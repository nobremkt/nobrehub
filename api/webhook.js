/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WEBHOOK — Receive WhatsApp messages via 360Dialog
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This Vercel serverless function handles:
 *   1. GET  → Webhook verification (360Dialog/Meta challenge handshake)
 *   2. POST → Incoming messages and delivery status updates
 *
 * Messages are written directly to Supabase (conversations + messages tables),
 * which triggers Realtime subscriptions so the Inbox updates instantly.
 *
 * Environment variables required:
 *   - SUPABASE_URL (or VITE_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - WEBHOOK_VERIFY_TOKEN (defaults to 'nobrehub_verify_token')
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getServiceClient, setCorsHeaders } from './_lib/integrationHelper.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizePhone(phone) {
    return (phone || '').replace(/\D/g, '');
}

function getMessageContent(message) {
    switch (message.type) {
        case 'text':
            return message.text?.body || '';
        case 'image':
            return '[Imagem]';
        case 'audio':
            return '[Áudio]';
        case 'video':
            return '[Vídeo]';
        case 'document':
            return `[Documento${message.document?.filename ? ': ' + message.document.filename : ''}]`;
        case 'sticker':
            return '[Sticker]';
        case 'location':
            return '[Localização]';
        case 'contacts':
            return '[Contato]';
        case 'reaction':
            return message.reaction?.emoji || '[Reação]';
        default:
            return `[${message.type || 'desconhecido'}]`;
    }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ── 1. Webhook Verification (GET) ───────────────────────────────────────
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'nobrehub_verify_token';

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[Webhook] Verified successfully');
            return res.status(200).send(challenge);
        }

        console.warn('[Webhook] Verification failed — invalid token');
        return res.status(403).send('Forbidden');
    }

    // ── 2. Incoming Messages & Status Updates (POST) ────────────────────────
    if (req.method === 'POST') {
        const body = req.body;

        try {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value) {
                return res.status(200).json({ success: true, note: 'No actionable data' });
            }

            // Process incoming messages
            if (value.messages?.length) {
                for (const message of value.messages) {
                    await processIncomingMessage(message, value.contacts?.[0]);
                }
            }

            // Process delivery status updates (sent, delivered, read, failed)
            if (value.statuses?.length) {
                for (const status of value.statuses) {
                    await processStatusUpdate(status);
                }
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('[Webhook] Processing error:', error.message);
            // Always return 200 to avoid 360Dialog retrying endlessly
            return res.status(200).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

// ─── Process Incoming WhatsApp Message ───────────────────────────────────────

async function processIncomingMessage(message, contact) {
    const supabase = getServiceClient();
    const phone = normalizePhone(message.from);
    const contactName = contact?.profile?.name || phone;
    const content = getMessageContent(message);
    const now = new Date().toISOString();

    console.log(`[Webhook] Message from ${phone}: ${content.substring(0, 50)}`);

    // ── Find existing conversation by phone ─────────────────────────────────
    const { data: existingConv } = await supabase
        .from('conversations')
        .select('id, unread_count')
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    let conversationId;

    if (existingConv) {
        conversationId = existingConv.id;
    } else {
        // ── Try to link to existing lead by phone ───────────────────────────
        const { data: linkedLead } = await supabase
            .from('leads')
            .select('id, name, email, company')
            .eq('phone', phone)
            .limit(1)
            .maybeSingle();

        // ── Create new conversation ─────────────────────────────────────────
        const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
                phone,
                name: linkedLead?.name || contactName,
                email: linkedLead?.email || '',
                company: linkedLead?.company || '',
                lead_id: linkedLead?.id || null,
                channel: 'whatsapp',
                status: 'open',
                context: 'sales',
                tags: [],
                notes: '',
                unread_count: 0,
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (createError) {
            console.error('[Webhook] Failed to create conversation:', createError.message);
            throw createError;
        }

        conversationId = newConv.id;
        console.log(`[Webhook] Created conversation ${conversationId} for ${phone}`);
    }

    // ── Insert message ──────────────────────────────────────────────────────
    const { error: msgError } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            content,
            type: message.type || 'text',
            sender_type: 'lead',
            sender_id: null,
            sender_name: contactName,
            status: 'received',
            whatsapp_message_id: message.id,
            media_url: message.image?.id || message.audio?.id || message.video?.id || message.document?.id || null,
            created_at: now,
        });

    if (msgError) {
        console.error('[Webhook] Failed to insert message:', msgError.message);
        throw msgError;
    }

    // ── Update conversation metadata ────────────────────────────────────────
    const currentUnread = existingConv?.unread_count || 0;

    const { error: updateError } = await supabase
        .from('conversations')
        .update({
            unread_count: currentUnread + 1,
            last_message_at: now,
            last_message_preview: content.substring(0, 100),
            updated_at: now,
            // Update name from WhatsApp profile if we only had the phone
            ...(contactName !== phone && { name: contactName }),
        })
        .eq('id', conversationId);

    if (updateError) {
        console.error('[Webhook] Failed to update conversation:', updateError.message);
    }

    console.log(`[Webhook] Saved message to conversation ${conversationId}`);
}

// ─── Process Delivery Status Update ──────────────────────────────────────────

async function processStatusUpdate(status) {
    const supabase = getServiceClient();
    const whatsappMessageId = status.id;
    const newStatus = status.status; // sent, delivered, read, failed

    // Map WhatsApp statuses to our internal statuses
    const statusMap = {
        sent: 'sent',
        delivered: 'delivered',
        read: 'read',
        failed: 'error',
    };

    const mappedStatus = statusMap[newStatus] || newStatus;

    const { error } = await supabase
        .from('messages')
        .update({ status: mappedStatus })
        .eq('whatsapp_message_id', whatsappMessageId);

    if (error) {
        // Not critical — message might not exist yet (race condition) or was deleted
        console.warn(`[Webhook] Status update failed for ${whatsappMessageId}:`, error.message);
    }
}
