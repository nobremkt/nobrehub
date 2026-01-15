import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';
import { emitNewLead, emitLeadUpdated } from '../services/socketService.js';

// Validation schemas
const createLeadSchema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().min(10),
    company: z.string().optional(),
    source: z.enum(['website', 'instagram', 'whatsapp', 'facebook', 'google_ads', 'indicacao', 'outro']).default('website'),
    pipeline: z.enum(['high_ticket', 'low_ticket']).default('high_ticket'),
    statusHT: z.enum(['novo', 'qualificado', 'call_agendada', 'proposta', 'negociacao', 'fechado', 'perdido']).optional(),
    statusLT: z.enum(['novo', 'atribuido', 'em_negociacao', 'fechado', 'perdido']).optional(),
    estimatedValue: z.number().default(0),
    tags: z.array(z.string()).default([]),
    notes: z.string().optional()
});

const updateLeadSchema = createLeadSchema.partial();

export default async function leadRoutes(server: FastifyInstance) {

    // All routes require authentication
    server.addHook('preHandler', (server as any).authenticate);

    // GET /leads - List leads with filters
    server.get('/', async (request) => {
        const user = (request as any).user;
        const query = request.query as any;

        // Build filter based on user role
        const where: any = {};

        // Role-based filtering
        if (user.role === 'sdr') {
            where.OR = [{ statusHT: 'novo' }, { statusLT: 'novo' }];
        } else if (user.role === 'closer_ht') {
            where.pipeline = 'high_ticket';
            where.assignedTo = user.id;
        } else if (user.role === 'closer_lt') {
            where.pipeline = 'low_ticket';
            where.assignedTo = user.id;
        }

        if (query.pipeline) where.pipeline = query.pipeline;
        if (query.status) {
            if (query.pipeline === 'high_ticket') where.statusHT = query.status;
            else if (query.pipeline === 'low_ticket') where.statusLT = query.status;
        }
        if (query.assignedTo) where.assignedTo = query.assignedTo;

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedUser: { select: { id: true, name: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { text: true, createdAt: true, direction: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to include lastMessage property cleanly
        return leads.map(l => ({
            ...l,
            lastMessage: l.messages[0]?.text || null,
            lastMessageFrom: l.messages[0]?.direction || null,
            lastMessageAt: l.messages[0]?.createdAt || null
        }));
    });

    // GET /leads/:id
    server.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                assignedUser: { select: { id: true, name: true } },
                interactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: { user: { select: { id: true, name: true } } }
                }
            }
        });

        if (!lead) return reply.code(404).send({ error: 'Lead não encontrado' });
        return lead;
    });

    // POST /leads
    server.post('/', async (request, reply) => {
        try {
            const data = createLeadSchema.parse(request.body);
            const user = (request as any).user;

            const leadData: any = {
                ...data,
                phone: data.phone.replace(/\D/g, ''),
                statusHT: data.pipeline === 'high_ticket' ? (data.statusHT || 'novo') : null,
                statusLT: data.pipeline === 'low_ticket' ? (data.statusLT || 'novo') : null
            };

            const lead = await prisma.lead.create({ data: leadData });

            await prisma.interaction.create({
                data: { leadId: lead.id, userId: user.id, type: 'note', content: 'Lead criado' }
            });

            // Emit Real-time Event
            emitNewLead(lead);

            return reply.code(201).send(lead);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
            }
            throw error;
        }
    });

    // PUT /leads/:id
    server.put('/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const data = updateLeadSchema.parse(request.body);
            const lead = await prisma.lead.update({ where: { id }, data });

            // Emit Real-time Event
            emitLeadUpdated(lead);

            return lead;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
            }
            throw error;
        }
    });

    // PUT /leads/:id/status
    server.put('/:id/status', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };
        const user = (request as any).user;

        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) return reply.code(404).send({ error: 'Lead não encontrado' });

        const updateData: any = {};
        if (lead.pipeline === 'high_ticket') updateData.statusHT = status;
        else updateData.statusLT = status;

        const updatedLead = await prisma.lead.update({ where: { id }, data: updateData });

        await prisma.interaction.create({
            data: {
                leadId: id,
                userId: user.id,
                type: 'status_change',
                content: `Status alterado para: ${status}`,
                metadata: { oldStatus: lead.statusHT || lead.statusLT, newStatus: status }
            }
        });

        // Emit Real-time Event
        emitLeadUpdated(updatedLead);

        return updatedLead;
    });

    // PUT /leads/:id/assign
    server.put('/:id/assign', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { userId } = request.body as { userId: string };
        const currentUser = (request as any).user;

        if (!['admin', 'sdr'].includes(currentUser.role)) {
            return reply.code(403).send({ error: 'Sem permissão para atribuir leads' });
        }

        const lead = await prisma.lead.update({
            where: { id },
            data: { assignedTo: userId, assignedAt: new Date() },
            include: { assignedUser: { select: { id: true, name: true } } }
        });

        await prisma.interaction.create({
            data: {
                leadId: id,
                userId: currentUser.id,
                type: 'assignment',
                content: `Lead atribuído para: ${lead.assignedUser?.name}`,
                metadata: { assignedTo: userId }
            }
        });

        // Emit Real-time Event
        emitLeadUpdated(lead);

        return lead;
    });

    // DELETE /leads/:id
    server.delete('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const user = (request as any).user;

        // Delete associated interactions first (FK constraint)
        await prisma.interaction.deleteMany({ where: { leadId: id } });
        await prisma.lead.delete({ where: { id } });

        return { success: true };
    });

    // DELETE /leads/bulk - Bulk delete
    server.delete('/bulk', async (request, reply) => {
        const { ids } = request.body as { ids: string[] };
        const user = (request as any).user;

        if (user.role !== 'admin') {
            return reply.code(403).send({ error: 'Apenas administradores podem excluir leads' });
        }

        // Delete associated interactions first
        await prisma.interaction.deleteMany({ where: { leadId: { in: ids } } });
        await prisma.lead.deleteMany({ where: { id: { in: ids } } });

        return { success: true, deleted: ids.length };
    });
}
