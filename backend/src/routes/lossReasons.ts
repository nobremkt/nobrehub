import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';

interface CreateLossReasonBody {
    name: string;
    description?: string;
    isActive?: boolean;
}

export async function lossReasonsRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('preValidation', async (request: any, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Token inválido ou expirado' });
        }
    });

    // Get all loss reasons
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const reasons = await prisma.lossReason.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            });
            return reply.send(reasons);
        } catch (error) {
            console.error('Error fetching loss reasons:', error);
            return reply.status(500).send({ error: 'Failed to fetch loss reasons' });
        }
    });

    // Create a loss reason (admin)
    app.post('/', async (request: FastifyRequest<{ Body: CreateLossReasonBody }>, reply: FastifyReply) => {
        try {
            const { name, description, isActive = true } = request.body;

            const count = await prisma.lossReason.count();

            const reason = await prisma.lossReason.create({
                data: {
                    name,
                    // description - model might not have description yet, checking schema below
                    order: count,
                    isActive,
                },
            });

            return reply.status(201).send(reason);
        } catch (error) {
            console.error('Error creating loss reason:', error);
            return reply.status(500).send({ error: 'Failed to create loss reason' });
        }
    });

    // Mark lead as lost
    app.post('/lead/:leadId', async (request: FastifyRequest<{ Params: { leadId: string }; Body: { lossReasonId: string; notes?: string } }>, reply: FastifyReply) => {
        try {
            const { leadId } = request.params;
            const { lossReasonId, notes } = request.body;

            // Verify reason exists
            const reason = await prisma.lossReason.findUnique({
                where: { id: lossReasonId }
            });

            if (!reason) {
                return reply.status(404).send({ error: 'Loss reason not found' });
            }

            // Update lead
            const lead = await prisma.lead.update({
                where: { id: leadId },
                data: {
                    statusHT: 'perdido', // Defaulting to HT status for now, logic should respect pipeline
                    lossReasonId,
                    lostAt: new Date(),
                    notes: notes ? { set: notes } : undefined, // Appending would be better but simple set for now
                }
            });

            // Log history
            await prisma.leadHistory.create({
                data: {
                    leadId,
                    action: 'marked_lost',
                    details: { reason: reason.name, notes },
                    userId: (request as any).userId
                }
            });

            return reply.send(lead);
        } catch (error) {
            console.error('Error marking lead as lost:', error);
            return reply.status(500).send({ error: 'Failed to mark lead as lost' });
        }
    });
}
