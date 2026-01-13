// WhatsApp Routes - Handles webhook and message sending
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dialog360 } from '../services/dialog360.js';
import { prisma } from '../lib/prisma.js';

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

        console.log(`📱 Msg from: ${incomingMessage.from}`);
        const phoneKey = incomingMessage.from.replace(/\D/g, '');

        // 1. Check DB
        let lead = await prisma.lead.findFirst({
            where: { phone: { contains: phoneKey.slice(-9) } }
        });
        console.log(`🔎 DB Search (${phoneKey.slice(-9)}): ${lead ? 'FOUND' : 'MISSING'}`);

        // 2. Create if missing
        if (!lead) {
            const senderProfile = payload.contacts?.find((c: any) => c.wa_id === incomingMessage.from);
            const leadName = senderProfile?.profile?.name || `WhatsApp ${phoneKey.slice(-4)}`;

            try {
                console.log(`🚀 Creating: ${leadName}`);
                lead = await prisma.lead.create({
                    data: {
                        name: leadName,
                        phone: phoneKey,
                        source: 'whatsapp',
                        pipeline: 'low_ticket',
                        statusLT: 'novo',
                        tags: ['whatsapp']
                    }
                });
                console.log(`✨ Created OK: ${lead.id}`);
            } catch (err: any) {
                console.error(`❌ Create Fail: ${err.message}`);
                // Fallback
                try {
                    lead = await prisma.lead.create({
                        data: {
                            name: leadName,
                            phone: phoneKey,
                            source: 'whatsapp',
                            pipeline: 'low_ticket'
                        }
                    });
                    console.log(`✨ Fallback OK: ${lead.id}`);
                } catch (retryErr: any) {
                    console.error(`❌ Fallback Fail: ${retryErr.message}`);
                }
            }
        }

        // 3. Save Message
        if (lead) {
            await prisma.message.create({
                data: {
                    waMessageId: incomingMessage.messageId,
                    phone: phoneKey,
                    leadId: lead.id,
                    direction: 'in',
                    type: incomingMessage.type === 'text' ? 'text' : 'text', // Simple fallback
                    text: incomingMessage.text,
                    status: 'delivered'
                }
            });
            console.log('💾 Msg Saved');
        } else {
            console.log('⚠️ Msg Skipped (No Lead)');
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
