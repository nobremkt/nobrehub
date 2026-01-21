import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { emitLeadUpdated } from '../services/socketService.js';

interface CreateDealBody {
    leadId: string;
    value?: number;
    product?: string;
    origin?: string;
    stage?: string;
    pipeline?: string;
    notes?: string;
    temperature?: string;
}

interface UpdateDealBody {
    value?: number;
    product?: string;
    origin?: string;
    status?: 'open' | 'won' | 'lost';
    stage?: string;
    notes?: string;
    temperature?: string;
    recordingUrl?: string;
    ownerId?: string;
}

export async function dealsRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('preValidation', async (request: any, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Token inválido ou expirado' });
        }
    });

    // Create a new deal for a lead
    app.post('/', async (request: FastifyRequest<{ Body: CreateDealBody }>, reply: FastifyReply) => {
        try {
            const { leadId, value, product, origin, stage, pipeline, notes, temperature } = request.body;
            const userId = (request as any).userId;

            // Verify lead exists
            const lead = await prisma.lead.findUnique({ where: { id: leadId } });
            if (!lead) {
                return reply.status(404).send({ error: 'Lead not found' });
            }

            const deal = await prisma.deal.create({
                data: {
                    leadId,
                    value: value ?? 0,
                    product,
                    origin,
                    stage: stage ?? 'novo',
                    pipeline: (pipeline as any) ?? lead.pipeline ?? 'high_ticket',
                    notes,
                    temperature,
                    ownerId: userId
                },
                include: {
                    lead: { select: { id: true, name: true, phone: true } },
                    owner: { select: { id: true, name: true } }
                }
            });

            // Log history
            await prisma.leadHistory.create({
                data: {
                    leadId,
                    action: 'deal_created',
                    details: { dealId: deal.id, value: deal.value },
                    userId
                }
            });

            // Emit socket event
            emitLeadUpdated({ id: leadId, deals: [deal] });

            return reply.status(201).send(deal);
        } catch (error) {
            console.error('Error creating deal:', error);
            return reply.status(500).send({ error: 'Failed to create deal' });
        }
    });

    // Get all deals for a lead
    app.get('/lead/:leadId', async (request: FastifyRequest<{ Params: { leadId: string } }>, reply: FastifyReply) => {
        try {
            const { leadId } = request.params;

            const deals = await prisma.deal.findMany({
                where: { leadId },
                include: {
                    owner: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            return reply.send(deals);
        } catch (error) {
            console.error('Error fetching deals:', error);
            return reply.status(500).send({ error: 'Failed to fetch deals' });
        }
    });

    // Get a specific deal
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const deal = await prisma.deal.findUnique({
                where: { id },
                include: {
                    lead: { select: { id: true, name: true, phone: true, email: true, company: true } },
                    owner: { select: { id: true, name: true, email: true } }
                }
            });

            if (!deal) {
                return reply.status(404).send({ error: 'Deal not found' });
            }

            return reply.send(deal);
        } catch (error) {
            console.error('Error fetching deal:', error);
            return reply.status(500).send({ error: 'Failed to fetch deal' });
        }
    });

    // Update a deal
    app.put('/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateDealBody }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const { value, product, origin, status, stage, notes, temperature, recordingUrl, ownerId } = request.body;
            const userId = (request as any).userId;

            const existingDeal = await prisma.deal.findUnique({ where: { id } });
            if (!existingDeal) {
                return reply.status(404).send({ error: 'Deal not found' });
            }

            const updateData: any = {};
            if (value !== undefined) updateData.value = value;
            if (product !== undefined) updateData.product = product;
            if (origin !== undefined) updateData.origin = origin;
            if (status !== undefined) {
                updateData.status = status;
                if (status === 'won' || status === 'lost') {
                    updateData.closedAt = new Date();
                }
            }
            if (stage !== undefined) updateData.stage = stage;
            if (notes !== undefined) updateData.notes = notes;
            if (temperature !== undefined) updateData.temperature = temperature;
            if (recordingUrl !== undefined) updateData.recordingUrl = recordingUrl;
            if (ownerId !== undefined) updateData.ownerId = ownerId;

            const deal = await prisma.deal.update({
                where: { id },
                data: updateData,
                include: {
                    lead: { select: { id: true, name: true } },
                    owner: { select: { id: true, name: true } }
                }
            });

            // Log stage change if applicable
            if (stage && stage !== existingDeal.stage) {
                await prisma.leadHistory.create({
                    data: {
                        leadId: deal.leadId,
                        action: 'stage_changed',
                        details: { dealId: id, from: existingDeal.stage, to: stage },
                        userId
                    }
                });
            }

            // Log deal closed if applicable
            if (status && status !== existingDeal.status && (status === 'won' || status === 'lost')) {
                await prisma.leadHistory.create({
                    data: {
                        leadId: deal.leadId,
                        action: 'deal_closed',
                        details: { dealId: id, status, value: deal.value },
                        userId
                    }
                });
            }

            // Emit socket event
            emitLeadUpdated({ id: deal.leadId, lastDeal: deal });

            return reply.send(deal);
        } catch (error) {
            console.error('Error updating deal:', error);
            return reply.status(500).send({ error: 'Failed to update deal' });
        }
    });

    // Delete a deal
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const deal = await prisma.deal.findUnique({ where: { id } });
            if (!deal) {
                return reply.status(404).send({ error: 'Deal not found' });
            }

            await prisma.deal.delete({ where: { id } });

            return reply.send({ success: true });
        } catch (error) {
            console.error('Error deleting deal:', error);
            return reply.status(500).send({ error: 'Failed to delete deal' });
        }
    });
}
