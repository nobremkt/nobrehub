// WhatsApp Routes - Handles webhook and message sending
import { emitNewMessage, emitNewLead, emitNewConversation, emitLeadUpdated, emitConversationUpdated } from '../services/socketService.js';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { prisma } from '../lib/prisma.js';
import { dialog360 } from '../services/dialog360.js';
import { addToQueue } from '../services/queueManager.js';
import { PipelineType } from '@prisma/client';

// ... (lines omitted)



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
        // Simple append file local implementation since we can't easily share the function across files without exporting it differently
        try {
            const fs = require('fs');
            const path = require('path');
            const LOG_FILE = path.join(process.cwd(), 'debug_log.txt');
            fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] 📩 [whatsapp.ts] Webhook Hit from 360Dialog\n`);
        } catch (e) { }

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
        // Improved matching: fetch candidates by suffix, then strict-check sanitized numbers
        const suffix = phoneKey.slice(-4);
        const candidates = await prisma.lead.findMany({
            where: { phone: { endsWith: suffix } }
        });

        let lead = candidates.find(candidate => {
            const cleanCandidate = candidate.phone.replace(/\D/g, '');
            // Check match with or without DDI (55) - robust comparison
            // phoneKey usually is 55 + DDD + NUM (12-13 digits) or sometimes without 55

            // Exact match
            if (cleanCandidate === phoneKey) return true;

            // Candidate has no 55, incoming has 55
            if (phoneKey.endsWith(cleanCandidate) && cleanCandidate.length >= 8) return true;

            // Candidate has 55, incoming has no 55
            if (cleanCandidate.endsWith(phoneKey) && phoneKey.length >= 8) return true;

            return false;
        }) || null;

        if (lead) {
            console.log(`🔎 DB Search FOUND Lead ID: ${lead.id} via Smart Match`);
        } else {
            console.log(`🔎 DB Search MISSING for ${phoneKey} (Candidates: ${candidates.length})`);
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
        console.log(`📧 DEBUG: conversation = ${conversation ? conversation.id : 'NULL'}`);

        // 5. Update conversation lastMessageAt
        if (conversation) {
            const updatedConversation = await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() },
                include: {
                    lead: { select: { id: true, name: true, phone: true, company: true } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            });

            // Emit real-time event to update the conversation list (for all listening agents/admins)
            // Emit real-time lead update
            // emitConversationUpdated is already imported at the top
            emitConversationUpdated(updatedConversation);

            // Emit lead updated event for notifications (incoming message)
            if (updatedConversation.lead) {
                emitLeadUpdated({
                    ...updatedConversation.lead,
                    lastMessage: incomingMessage.text || '[Mídia]',
                    lastMessageFrom: 'in',
                    lastMessageAt: new Date()
                });
            }

            // Emit real-time message to the specific conversation room
            // Always emit, regardless of assignment, so admins/supervisors can see it
            console.log(`📣 ABOUT TO EMIT - conversationId: ${conversation.id}, messageId: ${savedMessage.id}`);
            emitNewMessage(conversation.id, savedMessage);
            console.log(`📣 EMIT DONE`);
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

        // Verify user exists before using as foreign key
        let validUserId: string | undefined;
        if (user?.id) {
            const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
            if (existingUser) {
                validUserId = user.id;
            }
        }

        // Find lead by phone if not provided
        let resolvedLeadId = leadId;
        if (!resolvedLeadId) {
            const lead = await prisma.lead.findFirst({
                where: { phone: { contains: phoneKey.slice(-9) } }
            });
            resolvedLeadId = lead?.id;
        }

        // Find active conversation for this lead (CRITICAL for real-time)
        let conversationId: string | undefined;
        if (resolvedLeadId) {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    leadId: resolvedLeadId,
                    status: { not: 'closed' }
                },
                select: { id: true, assignedAgentId: true }
            });
            conversationId = conversation?.id;

            // Auto-assign logic if unassigned and valid user
            if (conversation && !conversation.assignedAgentId && validUserId) {
                const updatedConversation = await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: {
                        assignedAgentId: validUserId,
                        status: 'active',
                        lastMessageAt: new Date()
                    },
                    include: {
                        lead: { select: { id: true, name: true, phone: true, company: true } },
                        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                    }
                });
                // Emit update so it moves from Queue to Mine in real-time
                emitConversationUpdated(updatedConversation);
            }
        }

        // Save message to database first (pending status)
        const savedMessage = await prisma.message.create({
            data: {
                phone: phoneKey,
                leadId: resolvedLeadId,
                conversationId: conversationId,
                direction: 'out',
                type: 'text',
                text: text,
                status: 'pending',
                sentByUserId: validUserId // Only set if user actually exists
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

            // Emit real-time lead update with new lastMessage
            if (resolvedLeadId) {
                const updatedLead = await prisma.lead.findUnique({
                    where: { id: resolvedLeadId },
                });
                if (updatedLead) {
                    emitLeadUpdated({
                        ...updatedLead,
                        lastMessage: text,
                        lastMessageFrom: 'out',
                        lastMessageAt: new Date()
                    });
                }
            }

            // Emit real-time message to conversation room (so sender and others get it)
            if (savedMessage.conversationId) {
                emitNewMessage(savedMessage.conversationId, {
                    ...savedMessage,
                    status: 'sent',
                    waMessageId: result.messages[0]?.id
                });
            }

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

    // Send media (Image/Audio/Doc)
    server.post('/upload', {
        preHandler: [(server as any).authenticate as any]
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const parts = request.parts();
        const user = (request as any).user;
        let fileBuffer: Buffer | null = null;
        let fileName = '';
        let fileType = ''; // mimetype
        let fields: Record<string, any> = {};

        // Parse multipart
        for await (const part of parts) {
            if (part.type === 'file') {
                fileBuffer = await part.toBuffer();
                fileName = part.filename;
                fileType = part.mimetype;
            } else {
                fields[part.fieldname] = part.value;
            }
        }

        const { to, type, leadId, caption } = fields;

        if (!fileBuffer || !to || !type) {
            return reply.code(400).send({ error: 'File, "to" phone, and "type" are required' });
        }

        console.log(`📤 Uploading media: ${fileName} (${type}) for ${to}`);

        try {
            // 1. Upload to Supabase Storage
            const { supabase } = await import('../lib/supabase.js');
            const fileExt = fileName.split('.').pop();
            const storagePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(storagePath, fileBuffer, {
                    contentType: fileType,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('❌ Supabase Upload Error:', uploadError);
                throw new Error('Failed to upload file to storage');
            }

            // 2. Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from('chat-media')
                .getPublicUrl(storagePath);

            const publicUrl = publicUrlData.publicUrl;
            console.log('🔗 Public URL:', publicUrl);

            // 3. Resolve Lead and Conversation (Logic shared with /send)
            const phoneKey = to.replace(/\D/g, '');
            let resolvedLeadId = leadId;
            if (!resolvedLeadId) {
                const lead = await prisma.lead.findFirst({
                    where: { phone: { contains: phoneKey.slice(-9) } }
                });
                resolvedLeadId = lead?.id;
            }

            // Find valid user
            let validUserId: string | undefined;
            if (user?.id) {
                const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
                if (existingUser) validUserId = user.id;
            }

            // Find conversation
            let conversationId: string | undefined;
            if (resolvedLeadId) {
                const conversation = await prisma.conversation.findFirst({
                    where: { leadId: resolvedLeadId, status: { not: 'closed' } },
                    select: { id: true, assignedAgentId: true }
                });
                conversationId = conversation?.id;

                // Auto-assign logic
                if (conversation && !conversation.assignedAgentId && validUserId) {
                    const updatedConversation = await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { assignedAgentId: validUserId, status: 'active', lastMessageAt: new Date() },
                        include: {
                            lead: { select: { id: true, name: true, phone: true, company: true } },
                            messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                        }
                    });
                    emitConversationUpdated(updatedConversation);
                }
            }

            // 4. Save to Database (Pending)
            const savedMessage = await prisma.message.create({
                data: {
                    phone: phoneKey,
                    leadId: resolvedLeadId,
                    conversationId: conversationId,
                    direction: 'out',
                    type: type as any, // image, audio, etc.
                    text: caption || `[${type}]`,
                    mediaUrl: publicUrl,
                    status: 'pending',
                    sentByUserId: validUserId
                }
            });

            // 5. Send via WhatsApp API
            const result = await dialog360.sendMedia({
                to,
                link: publicUrl,
                type: type as any,
                caption
            });

            // 6. Update Message (Sent)
            await prisma.message.update({
                where: { id: savedMessage.id },
                data: {
                    waMessageId: result.messages[0]?.id,
                    status: 'sent'
                }
            });

            // 7. Emit Realtime Events
            if (savedMessage.conversationId) {
                emitNewMessage(savedMessage.conversationId, {
                    ...savedMessage,
                    status: 'sent',
                    waMessageId: result.messages[0]?.id
                });
            }

            if (resolvedLeadId) {
                // Update lead last message
                await prisma.lead.update({
                    where: { id: resolvedLeadId },
                    data: { updatedAt: new Date() } // Trigger update
                });
                // Emit lead update...
            }

            return reply.send({
                success: true,
                messageId: result.messages[0]?.id,
                mediaUrl: publicUrl
            });

        } catch (error: any) {
            console.error('❌ Upload/Send Failed:', error);
            return reply.code(500).send({ error: error.message });
        }
    });
}

