// WhatsApp Routes - Handles webhook and message sending
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dialog360 } from '../services/dialog360.js';
import { prisma } from '../lib/prisma.js';
import { addToQueue } from '../services/queueManager.js';
import { emitNewMessage, emitNewLead, emitNewConversation } from '../services/socketService.js';
import { PipelineType } from '@prisma/client';

// Types for request bodies
interface SendMessageBody {
    to: string;
    text: string;
    leadId?: string;
}

interface SendTemplateBody {
    to: string;
    templateName: string;
    parameters?: string[];
    leadId?: string;
}

interface WebhookPayload {
    messages?: any[];
    statuses?: any[];
    contacts?: any[];
}

// Utility: Format Brazilian phone number
function formatBrazilianPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    // Brazilian format: 55 + DDD (2) + Number (8-9)
    if (digits.length === 13 && digits.startsWith('55')) {
        // 55 + DDD + 9XXXX-XXXX
        const ddd = digits.slice(2, 4);
        const part1 = digits.slice(4, 9);
        const part2 = digits.slice(9, 13);
        return `(${ddd}) ${part1}-${part2}`;
    } else if (digits.length === 12 && digits.startsWith('55')) {
        // 55 + DDD + XXXX-XXXX (old format)
        const ddd = digits.slice(2, 4);
        const part1 = digits.slice(4, 8);
        const part2 = digits.slice(8, 12);
        return `(${ddd}) ${part1}-${part2}`;
    }

    // Fallback: return as-is with spaces
    return phone;
}

// Utility: Extract name from WhatsApp contacts
// Utility: Extract name from WhatsApp contacts
function extractWhatsAppName(payload: any, senderId: string): string | null {
    let contacts = payload.contacts;

    // Normalize: Check for Meta "entry" format if contacts are missing in root
    if (!contacts && payload.entry?.[0]?.changes?.[0]?.value?.contacts) {
        contacts = payload.entry[0].changes[0].value.contacts;
    }

    // Try to find contact matching the sender
    if (contacts && Array.isArray(contacts)) {
        console.log(`👤 Contacts found: ${contacts.length}`, JSON.stringify(contacts));

        const contact = contacts.find((c: any) =>
            c.wa_id === senderId || c.wa_id === senderId.replace(/\D/g, '')
        );

        if (contact?.profile?.name) {
            return contact.profile.name;
        }

        // Try first contact as fallback (usually there is only one in webhook)
        if (contacts[0]?.profile?.name) {
            return contacts[0].profile.name;
        }
    } else {
        console.log('👤 No contacts array found in payload');
    }

    return null;
}

export default async function whatsappRoutes(server: FastifyInstance) {

    // Webhook verification (GET) - Meta/360Dialog verifies webhook URL
    server.get('/webhook', async (request: FastifyRequest<{
        Querystring: { 'hub.mode'?: string; 'hub.verify_token'?: string; 'hub.challenge'?: string }
    }>, reply: FastifyReply) => {
        const mode = request.query['hub.mode'];
        const token = request.query['hub.verify_token'];
        const challenge = request.query['hub.challenge'];

        const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'nobre-crm-webhook';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully');
            return reply.code(200).send(challenge);
        }

        console.log('❌ Webhook verification failed');
        return reply.code(403).send('Forbidden');
    });

    // Webhook receiver (POST) - Receives messages from WhatsApp
    server.post('/webhook', async (request: FastifyRequest<{ Body: WebhookPayload }>, reply: FastifyReply) => {
        const payload = request.body;

        // Efficient Logging (Avoid Rate Limits)
        console.log('📩 Webhook Hit');
        console.log('🔍 FULL PAYLOAD:', JSON.stringify(payload, null, 2));

        const incomingMessage = dialog360.parseIncomingMessage(payload);

        if (!incomingMessage) {
            // Check for status update BEFORE returning
            const statusUpdate = dialog360.parseStatusUpdate(payload);
            if (statusUpdate) {
                console.log(`📊 Status: ${statusUpdate.status} (MsgID: ${statusUpdate.messageId})`);
                const validStatuses = ['sent', 'delivered', 'read', 'failed'] as const;
                if (validStatuses.includes(statusUpdate.status as any)) {
                    await prisma.message.updateMany({
                        where: { waMessageId: statusUpdate.messageId },
                        data: { status: statusUpdate.status as any }
                    });
                }
            } else {
                // Critical Debug: Log why we couldn't parse it
                console.log('⚠️ Unparsed Webhook Payload:', JSON.stringify(payload, null, 2));
                if ((payload as any).entry) {
                    console.log('💡 Hint: Detected Meta "entry" format. Parser expects flat 360Dialog format.');
                }
            }
            return reply.code(200).send({ status: 'ok' });
        }

        const phoneKey = incomingMessage.from.replace(/\D/g, '');
        console.log(`📱 Process Msg from: ${incomingMessage.from} (Key: ${phoneKey})`);

        // 1. Check DB - Find existing lead
        let lead = await prisma.lead.findFirst({
            where: { phone: { contains: phoneKey.slice(-8) } }
        });

        if (lead) {
            console.log(`🔎 DB Search FOUND Lead ID: ${lead.id} Name: ${lead.name} Phone: ${lead.phone}`);
        } else {
            console.log(`🔎 DB Search MISSING for ${phoneKey}`);
        }

        // 2. Create lead if missing
        if (!lead) {
            // Use utility function for better name extraction
            const profileName = extractWhatsAppName(payload, incomingMessage.from);
            const leadName = profileName || `WhatsApp ${phoneKey.slice(-4)}`;

            console.log(`👤 Profile Data: ${JSON.stringify(payload.contacts)} -> Extracted Name: ${profileName}`);

            try {
                console.log(`🚀 Creating Lead: ${leadName} Phone: ${phoneKey}`);
                lead = await prisma.lead.create({
                    data: {
                        name: leadName,
                        phone: phoneKey, // Store raw digits - format on frontend display
                        source: 'whatsapp',
                        pipeline: 'low_ticket',
                        statusLT: 'novo',
                        tags: ['whatsapp']
                    }
                });
                console.log(`✨ Created OK: ${lead.id}`);

                // Emit real-time event for new lead
                emitNewLead(lead);
            } catch (err: any) {
                console.error(`❌ Create Fail: ${err.message}`);
                return reply.code(200).send({ status: 'ok' });
            }
        }

        // 3. Find or Create Conversation + Add to Queue
        let conversation = await prisma.conversation.findFirst({
            where: { leadId: lead.id, status: { not: 'closed' } }
        });

        if (!conversation) {
            // No active conversation - add to queue for assignment
            console.log(`📥 No active conversation - adding to queue`);
            const pipeline = lead.pipeline as PipelineType || 'low_ticket';
            await addToQueue(lead.id, pipeline);

            // Fetch the newly created conversation
            conversation = await prisma.conversation.findFirst({
                where: { leadId: lead.id, status: { not: 'closed' } },
                include: {
                    lead: { select: { id: true, name: true, phone: true, company: true } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            });

            // Emit real-time event for new conversation
            if (conversation) {
                emitNewConversation(conversation);
            }
        }

        // 4. Save Message (use upsert to handle duplicates from webhook retries)
        const savedMessage = await prisma.message.upsert({
            where: { waMessageId: incomingMessage.messageId },
            create: {
                waMessageId: incomingMessage.messageId,
                phone: phoneKey,
                leadId: lead.id,
                conversationId: conversation?.id,
                direction: 'in',
                type: incomingMessage.type === 'text' ? 'text' : 'text',
                text: incomingMessage.text,
                status: 'delivered'
            },
            update: {} // Do nothing if already exists
        });
        console.log('💾 Msg Saved');

        // 5. Update conversation lastMessageAt
        if (conversation) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
            });

            // Emit real-time event to agent
            if (conversation.assignedAgentId) {
                emitNewMessage(conversation.id, savedMessage);
            }
        }

        return reply.code(200).send({ status: 'ok' });
    });

    // Send text message
    server.post('/send', {
        preHandler: [(server as any).authenticate as any]
    }, async (request: FastifyRequest<{ Body: SendMessageBody }>, reply: FastifyReply) => {
        const { to, text, leadId } = request.body;
        const user = (request as any).user;

        if (!to || !text) {
            return reply.code(400).send({ error: 'Phone number and text are required' });
        }

        const phoneKey = to.replace(/\D/g, '');

        // Find lead by phone if not provided
        let resolvedLeadId = leadId;
        if (!resolvedLeadId) {
            const lead = await prisma.lead.findFirst({
                where: { phone: { contains: phoneKey.slice(-9) } }
            });
            resolvedLeadId = lead?.id;
        }

        // Save message to database first (pending status)
        const savedMessage = await prisma.message.create({
            data: {
                phone: phoneKey,
                leadId: resolvedLeadId,
                direction: 'out',
                type: 'text',
                text: text,
                status: 'pending',
                sentByUserId: user?.id
            }
        });

        try {
            const result = await dialog360.sendMessage({ to, text });

            // Update with WhatsApp message ID and status
            await prisma.message.update({
                where: { id: savedMessage.id },
                data: {
                    waMessageId: result.messages[0]?.id,
                    status: 'sent'
                }
            });

            console.log('✅ Message sent to:', to);
            return reply.send({
                success: true,
                messageId: result.messages[0]?.id,
                dbId: savedMessage.id
            });
        } catch (error: any) {
            // Update message status to failed
            await prisma.message.update({
                where: { id: savedMessage.id },
                data: { status: 'failed' }
            });

            console.error('❌ Failed to send message:', error);
            console.error('Stack:', error.stack);

            if (error.response) {
                console.error('360Dialog Response:', JSON.stringify(error.response, null, 2));
            }

            return reply.code(500).send({
                error: 'Failed to send message',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    });

    // Send template message (HSM)
    server.post('/send-template', {
        preHandler: [(server as any).authenticate as any]
    }, async (request: FastifyRequest<{ Body: SendTemplateBody }>, reply: FastifyReply) => {
        const { to, templateName, parameters = [], leadId } = request.body;
        const user = (request as any).user;

        if (!to || !templateName) {
            return reply.code(400).send({ error: 'Phone number and template name are required' });
        }

        const phoneKey = to.replace(/\D/g, '');

        // Find lead by phone if not provided
        let resolvedLeadId = leadId;
        if (!resolvedLeadId) {
            const lead = await prisma.lead.findFirst({
                where: { phone: { contains: phoneKey.slice(-9) } }
            });
            resolvedLeadId = lead?.id;
        }

        // Save template message to database
        const savedMessage = await prisma.message.create({
            data: {
                phone: phoneKey,
                leadId: resolvedLeadId,
                direction: 'out',
                type: 'template',
                templateName: templateName,
                text: `Template: ${templateName}`,
                status: 'pending',
                sentByUserId: user?.id
            }
        });

        try {
            // Build components for template parameters
            const components = parameters.length > 0 ? [{
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: p }))
            }] : [];

            const result = await dialog360.sendTemplate({
                to,
                templateName,
                components
            });

            // Update with WhatsApp message ID
            await prisma.message.update({
                where: { id: savedMessage.id },
                data: {
                    waMessageId: result.messages[0]?.id,
                    status: 'sent'
                }
            });

            console.log('✅ Template sent to:', to);
            return reply.send({
                success: true,
                messageId: result.messages[0]?.id,
                dbId: savedMessage.id
            });
        } catch (error: any) {
            // Update message status to failed
            await prisma.message.update({
                where: { id: savedMessage.id },
                data: { status: 'failed' }
            });

            console.error('❌ Failed to send template:', error.message);
            return reply.code(500).send({
                error: 'Failed to send template',
                details: error.message
            });
        }
    });

    // Get available templates
    server.get('/templates', {
        preHandler: [(server as any).authenticate as any]
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const templates = await dialog360.getTemplates();
            return reply.send({ templates });
        } catch (error: any) {
            console.error('❌ Failed to fetch templates:', error.message);
            return reply.code(500).send({
                error: 'Failed to fetch templates',
                details: error.message
            });
        }
    });

    // Get conversation history for a phone number (from database)
    server.get('/messages/:phone', {
        preHandler: [(server as any).authenticate as any]
    }, async (request: FastifyRequest<{ Params: { phone: string } }>, reply: FastifyReply) => {
        const { phone } = request.params;
        const phoneKey = phone.replace(/\D/g, '');

        console.log(`🔍 [DEBUG] Fetching messages for: ${phone} (Key: ${phoneKey})`);

        // Handle Brazil DDI logic (if 10-11 digits, try adding 55)
        const possiblePhones = [phoneKey];
        if (phoneKey.length === 10 || phoneKey.length === 11) {
            possiblePhones.push(`55${phoneKey}`);
        }

        console.log(`🔍 [DEBUG] Searching variations:`, possiblePhones);

        // Fetch messages from database matching any valid phone format
        const messages = await prisma.message.findMany({
            where: { phone: { in: possiblePhones } },
            orderBy: { createdAt: 'asc' },
            include: {
                sentByUser: {
                    select: { name: true }
                }
            }
        });

        console.log(`✅ [DEBUG] Found ${messages.length} messages for ${phoneKey}`);

        // Format for frontend
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            waMessageId: msg.waMessageId,
            text: msg.text,
            direction: msg.direction,
            type: msg.type,
            status: msg.status,
            timestamp: msg.createdAt.toISOString(),
            agentName: msg.sentByUser?.name
        }));

        return reply.send({ messages: formattedMessages });
    });
}
