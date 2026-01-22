import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { closeConversation, transferConversation, getQueueStatus } from '../services/queueManager.js';
import prisma from '../lib/prisma.js';

interface ConversationParams {
    id: string;
}

interface CloseBody {
    reason: 'payment' | 'no_interest' | 'transferred' | 'resolved' | 'timeout';
}

interface TransferBody {
    newAgentId: string;
}

export default async function conversationsRoutes(fastify: FastifyInstance) {
    // Apply authentication to all routes in this plugin
    fastify.addHook('preValidation', async (request: any, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Token inválido ou expirado' });
        }
    });

    // Get all conversations for the logged-in user (or all if admin)
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = (request as any).user;
            if (!user) {
                return reply.status(401).send({ error: 'Usuário não autenticado' });
            }

            const whereClause = user.role === 'admin'
                ? {}
                : { assignedAgentId: user.id };

            const conversations = await prisma.conversation.findMany({
                where: whereClause,
                include: {
                    lead: { select: { id: true, name: true, phone: true, company: true, estimatedValue: true } },
                    assignedAgent: { select: { id: true, name: true } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                },
                orderBy: { lastMessageAt: 'desc' }
            });

            return conversations;
        } catch (error: any) {
            console.error('Error fetching conversations:', error);
            return reply.status(500).send({ error: 'Erro ao buscar conversas', details: error.message });
        }
    });

    // Get active conversations only
    fastify.get('/active', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = (request as any).user;
            if (!user) {
                return reply.status(401).send({ error: 'Usuário não autenticado' });
            }

            const whereClause: any = user.role === 'admin'
                ? { status: { not: 'closed' as const } }
                : {
                    OR: [
                        { assignedAgentId: user.id },
                        { assignedAgentId: null }
                    ],
                    status: { not: 'closed' as const }
                };

            const conversations = await prisma.conversation.findMany({
                where: whereClause,
                include: {
                    lead: { select: { id: true, name: true, phone: true, company: true, estimatedValue: true } },
                    assignedAgent: { select: { id: true, name: true } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                },
                orderBy: { lastMessageAt: 'desc' }
            });

            return conversations;
        } catch (error: any) {
            console.error('Error fetching active conversations:', error);
            return reply.status(500).send({ error: 'Erro ao buscar conversas ativas', details: error.message });
        }
    });

    // Get conversation by lead ID (for WhatsApp button navigation)
    // NOTE: Must be defined BEFORE /:id to avoid route conflicts
    // Now also creates a conversation if none exists (for leads without WhatsApp history)
    fastify.get<{ Params: { leadId: string }; Querystring: { create?: string } }>('/by-lead/:leadId', async (request, reply) => {
        const { leadId } = request.params;
        const { create } = request.query;
        const user = (request as any).user;

        // First, try to find an existing conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                leadId,
                status: { not: 'closed' }
            },
            include: {
                lead: { select: { id: true, name: true, phone: true, company: true, estimatedValue: true, statusHT: true, statusLT: true, tags: true } },
                assignedAgent: { select: { id: true, name: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        // If no conversation exists and create=true, create one
        if (!conversation && (create === 'true' || create === '1')) {
            // Get lead info to determine pipeline
            const lead = await prisma.lead.findUnique({
                where: { id: leadId },
                select: { id: true, name: true, phone: true, company: true, estimatedValue: true, pipeline: true, statusHT: true, statusLT: true, tags: true }
            });

            if (!lead) {
                return reply.status(404).send({ error: 'Lead não encontrado' });
            }

            try {
                // Create a new conversation for this lead
                conversation = await prisma.conversation.create({
                    data: {
                        leadId: lead.id,
                        status: 'active',
                        pipeline: lead.pipeline || 'low_ticket',
                        assignedAgentId: user?.id || null, // Assign to current user if logged in
                        lastMessageAt: new Date()
                    },
                    include: {
                        lead: { select: { id: true, name: true, phone: true, company: true, estimatedValue: true, statusHT: true, statusLT: true, tags: true } },
                        assignedAgent: { select: { id: true, name: true } },
                        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                    }
                });
            } catch (error: any) {
                // Handle case where assignedAgentId (user.id) is invalid (e.g. deleted user with valid token)
                if (error.code === 'P2003') {
                    console.warn(`⚠️ Creating conversation without assignment due to invalid agent ID: ${user?.id}`);
                    conversation = await prisma.conversation.create({
                        data: {
                            leadId: lead.id,
                            status: 'active',
                            pipeline: lead.pipeline || 'low_ticket',
                            assignedAgentId: null,
                            lastMessageAt: new Date()
                        },
                        include: {
                            lead: { select: { id: true, name: true, phone: true, company: true, estimatedValue: true, statusHT: true, statusLT: true, tags: true } },
                            assignedAgent: { select: { id: true, name: true } },
                            messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                        }
                    });
                } else {
                    throw error;
                }
            }

            console.log(`[Conversations] Created new conversation for lead ${lead.name}: ${conversation.id}`);
        }

        if (!conversation) {
            return reply.status(404).send({ error: 'Nenhuma conversa encontrada para este lead', canCreate: true });
        }

        return conversation;
    });

    // Get a single conversation with all messages
    fastify.get<{ Params: ConversationParams }>('/:id', async (request, reply) => {
        const { id } = request.params;

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                lead: true,
                assignedAgent: { select: { id: true, name: true } },
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });

        if (!conversation) {
            return reply.status(404).send({ error: 'Conversa não encontrada' });
        }

        return conversation;
    });

    // Get messages for a conversation
    fastify.get<{ Params: ConversationParams }>('/:id/messages', async (request, reply) => {
        const { id } = request.params;

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            include: { sentByUser: { select: { id: true, name: true } } }
        });

        return messages;
    });

    // Put conversation on hold (Pause atendimento)
    fastify.post<{ Params: ConversationParams }>('/:id/hold', async (request, reply) => {
        const { id } = request.params;

        try {
            const conversation = await prisma.conversation.update({
                where: { id },
                data: { status: 'on_hold' },
                include: {
                    lead: { select: { id: true, name: true } },
                    assignedAgent: { select: { id: true, name: true } }
                }
            });
            return conversation;
        } catch (error: any) {
            console.error('Error putting conversation on hold:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // Resume conversation from hold
    fastify.post<{ Params: ConversationParams }>('/:id/resume', async (request, reply) => {
        const { id } = request.params;

        try {
            const conversation = await prisma.conversation.update({
                where: { id },
                data: { status: 'active' },
                include: {
                    lead: { select: { id: true, name: true } },
                    assignedAgent: { select: { id: true, name: true } }
                }
            });
            return conversation;
        } catch (error: any) {
            console.error('Error resuming conversation:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // Close a conversation (Quick Action)
    fastify.post<{ Params: ConversationParams; Body: CloseBody }>('/:id/close', async (request, reply) => {
        const { id } = request.params;
        const { reason } = request.body;

        try {
            const conversation = await closeConversation(id, reason);
            return conversation;
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // Transfer a conversation to another agent
    fastify.post<{ Params: ConversationParams; Body: TransferBody }>('/:id/transfer', async (request, reply) => {
        const { id } = request.params;
        const { newAgentId } = request.body;

        try {
            const conversation = await transferConversation(id, newAgentId);
            return conversation;
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // Get queue status for a pipeline
    fastify.get('/queue/:pipeline', async (request: FastifyRequest<{ Params: { pipeline: 'high_ticket' | 'low_ticket' } }>, reply) => {
        const { pipeline } = request.params;
        const status = await getQueueStatus(pipeline);
        return status;
    });

    // Get available agents for transfer (by pipeline)
    fastify.get('/agents/available', async (request: FastifyRequest<{ Querystring: { pipeline?: string } }>, reply) => {
        const { pipeline } = request.query;

        const agents = await prisma.user.findMany({
            where: {
                isActive: true,
                isOnline: true,
                OR: [
                    { pipelineType: pipeline ? (pipeline as any) : undefined },
                    { role: { in: ['admin', 'manager_sales', 'manager_production', 'post_sales'] } }
                ]
            },
            select: { id: true, name: true, pipelineType: true, currentChatCount: true, maxConcurrentChats: true }
        });

        return agents;
    });
}
