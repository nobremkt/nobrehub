import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { closeConversation, transferConversation, getQueueStatus } from '../services/queueManager.js';

const prisma = new PrismaClient();

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

            const whereClause = user.role === 'admin'
                ? { status: { not: 'closed' as const } }
                : { assignedAgentId: user.id, status: { not: 'closed' as const } };

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

    // Get conversation by lead ID (for WhatsApp button navigation)
    fastify.get<{ Params: { leadId: string } }>('/by-lead/:leadId', async (request, reply) => {
        const { leadId } = request.params;

        const conversation = await prisma.conversation.findFirst({
            where: {
                leadId,
                status: { not: 'closed' }
            },
            include: {
                lead: { select: { id: true, name: true, phone: true, company: true, estimatedValue: true } },
                assignedAgent: { select: { id: true, name: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        if (!conversation) {
            return reply.status(404).send({ error: 'Nenhuma conversa encontrada para este lead' });
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
