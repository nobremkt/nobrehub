// Scheduled Messages Routes - API for scheduling messages
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { emitNewMessage, emitLeadUpdated } from '../services/socketService.js';
import { dialog360 } from '../services/dialog360.js';

interface ScheduleMessageBody {
    conversationId: string;
    content: string;
    scheduledFor: string; // ISO date string
}

interface ScheduleParams {
    id: string;
}

export default async function scheduledMessagesRoutes(server: FastifyInstance) {
    // Apply auth to all routes
    server.addHook('preHandler', (server as any).authenticate);

    // Create a scheduled message
    server.post<{ Body: ScheduleMessageBody }>('/', async (request, reply) => {
        const { conversationId, content, scheduledFor } = request.body;
        const user = (request as any).user;

        if (!conversationId || !content || !scheduledFor) {
            return reply.code(400).send({ error: 'conversationId, content, and scheduledFor are required' });
        }

        // Validate scheduledFor is in the future
        const scheduleDate = new Date(scheduledFor);
        if (scheduleDate <= new Date()) {
            return reply.code(400).send({ error: 'scheduledFor must be in the future' });
        }

        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { lead: true }
        });

        if (!conversation) {
            return reply.code(404).send({ error: 'Conversation not found' });
        }

        const scheduledMessage = await prisma.scheduledMessage.create({
            data: {
                conversationId,
                content,
                scheduledFor: scheduleDate,
                createdById: user.id,
                status: 'pending'
            },
            include: {
                createdBy: { select: { id: true, name: true } }
            }
        });

        console.log(`📅 Scheduled message for ${scheduleDate.toISOString()}`);

        return reply.send(scheduledMessage);
    });

    // List scheduled messages for a conversation
    server.get<{ Params: { conversationId: string } }>('/conversation/:conversationId', async (request, reply) => {
        const { conversationId } = request.params;

        const messages = await prisma.scheduledMessage.findMany({
            where: { conversationId },
            orderBy: { scheduledFor: 'asc' },
            include: {
                createdBy: { select: { id: true, name: true } }
            }
        });

        return reply.send(messages);
    });

    // List all pending scheduled messages (for admin/job processing)
    server.get('/pending', async (request, reply) => {
        const messages = await prisma.scheduledMessage.findMany({
            where: {
                status: 'pending',
                scheduledFor: { lte: new Date() }
            },
            orderBy: { scheduledFor: 'asc' },
            include: {
                conversation: {
                    include: { lead: true }
                },
                createdBy: { select: { id: true, name: true } }
            }
        });

        return reply.send(messages);
    });

    // Cancel a scheduled message
    server.delete<{ Params: ScheduleParams }>('/:id', async (request, reply) => {
        const { id } = request.params;
        const user = (request as any).user;

        const existing = await prisma.scheduledMessage.findUnique({
            where: { id }
        });

        if (!existing) {
            return reply.code(404).send({ error: 'Scheduled message not found' });
        }

        if (existing.status !== 'pending') {
            return reply.code(400).send({ error: 'Can only cancel pending messages' });
        }

        // Only creator or admin can cancel
        if (existing.createdById !== user.id && user.role !== 'admin') {
            return reply.code(403).send({ error: 'Not authorized to cancel this message' });
        }

        await prisma.scheduledMessage.update({
            where: { id },
            data: { status: 'cancelled' }
        });

        console.log(`❌ Cancelled scheduled message ${id}`);

        return reply.send({ success: true });
    });

    // Process and send a scheduled message (called by cron job or manual trigger)
    server.post<{ Params: ScheduleParams }>('/:id/send', async (request, reply) => {
        const { id } = request.params;

        const scheduledMsg = await prisma.scheduledMessage.findUnique({
            where: { id },
            include: {
                conversation: {
                    include: { lead: true }
                },
                createdBy: true
            }
        });

        if (!scheduledMsg) {
            return reply.code(404).send({ error: 'Scheduled message not found' });
        }

        if (scheduledMsg.status !== 'pending') {
            return reply.code(400).send({ error: 'Message already processed' });
        }

        const phone = scheduledMsg.conversation.lead.phone;

        try {
            // Send via WhatsApp
            const result = await dialog360.sendMessage({
                to: phone,
                text: scheduledMsg.content
            });

            // Save as regular message
            const savedMessage = await prisma.message.create({
                data: {
                    phone: phone.replace(/\D/g, ''),
                    leadId: scheduledMsg.conversation.lead.id,
                    conversationId: scheduledMsg.conversationId,
                    direction: 'out',
                    type: 'text',
                    text: scheduledMsg.content,
                    status: 'sent',
                    waMessageId: result.messages[0]?.id,
                    sentByUserId: scheduledMsg.createdById
                }
            });

            // Update scheduled message status
            await prisma.scheduledMessage.update({
                where: { id },
                data: {
                    status: 'sent',
                    sentAt: new Date()
                }
            });

            // Emit real-time events
            emitNewMessage(scheduledMsg.conversationId, savedMessage);

            console.log(`✅ Sent scheduled message ${id} to ${phone}`);

            return reply.send({ success: true, messageId: savedMessage.id });

        } catch (error: any) {
            // Mark as failed
            await prisma.scheduledMessage.update({
                where: { id },
                data: {
                    status: 'failed',
                    errorMessage: error.message
                }
            });

            console.error(`❌ Failed to send scheduled message ${id}:`, error.message);

            return reply.code(500).send({ error: 'Failed to send message', details: error.message });
        }
    });

    // Process all pending scheduled messages (batch job)
    server.post('/process-pending', async (request, reply) => {
        const pendingMessages = await prisma.scheduledMessage.findMany({
            where: {
                status: 'pending',
                scheduledFor: { lte: new Date() }
            },
            include: {
                conversation: {
                    include: { lead: true }
                },
                createdBy: true
            }
        });

        console.log(`📅 Processing ${pendingMessages.length} pending scheduled messages`);

        const results = {
            processed: 0,
            success: 0,
            failed: 0
        };

        for (const msg of pendingMessages) {
            results.processed++;
            const phone = msg.conversation.lead.phone;

            try {
                const result = await dialog360.sendMessage({
                    to: phone,
                    text: msg.content
                });

                // Save as regular message
                const savedMessage = await prisma.message.create({
                    data: {
                        phone: phone.replace(/\D/g, ''),
                        leadId: msg.conversation.lead.id,
                        conversationId: msg.conversationId,
                        direction: 'out',
                        type: 'text',
                        text: msg.content,
                        status: 'sent',
                        waMessageId: result.messages[0]?.id,
                        sentByUserId: msg.createdById
                    }
                });

                await prisma.scheduledMessage.update({
                    where: { id: msg.id },
                    data: { status: 'sent', sentAt: new Date() }
                });

                emitNewMessage(msg.conversationId, savedMessage);
                results.success++;

            } catch (error: any) {
                await prisma.scheduledMessage.update({
                    where: { id: msg.id },
                    data: { status: 'failed', errorMessage: error.message }
                });
                results.failed++;
            }
        }

        console.log(`📅 Processed: ${results.success} success, ${results.failed} failed`);

        return reply.send(results);
    });
}
