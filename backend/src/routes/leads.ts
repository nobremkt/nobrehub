import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';
import { emitNewLead, emitLeadUpdated, emitConversationUpdated, emitNewConversation } from '../services/socketService.js';

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

    // GET /leads/:id/details - Unified 360° View (all data in one call)
    server.get('/:id/details', async (request, reply) => {
        const { id } = request.params as { id: string };

        // Fetch lead with all related data in parallel
        const [lead, deals, conversations, history] = await Promise.all([
            // Lead with basic relations
            prisma.lead.findUnique({
                where: { id },
                include: {
                    assignedUser: { select: { id: true, name: true } },
                }
            }),

            // All deals for this lead
            prisma.deal.findMany({
                where: { leadId: id },
                orderBy: { createdAt: 'desc' },
                include: {
                    owner: { select: { id: true, name: true } }
                }
            }),

            // All conversations with last messages
            prisma.conversation.findMany({
                where: { leadId: id },
                orderBy: { lastMessageAt: 'desc' },
                include: {
                    assignedAgent: { select: { id: true, name: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: { id: true, text: true, direction: true, createdAt: true, type: true }
                    }
                }
            }),

            // Lead history/audit log
            prisma.leadHistory.findMany({
                where: { leadId: id },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    user: { select: { id: true, name: true } }
                }
            })
        ]);

        if (!lead) return reply.code(404).send({ error: 'Lead não encontrado' });

        // Calculate summary stats (handle Decimal type)
        const totalDealValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0);
        const openDeals = deals.filter(d => d.status === 'open').length;
        const wonDeals = deals.filter(d => d.status === 'won').length;
        const activeConversations = conversations.filter(c => c.status === 'active').length;

        return {
            lead,
            deals,
            conversations,
            history,
            summary: {
                totalDealValue,
                openDeals,
                wonDeals,
                lostDeals: deals.filter(d => d.status === 'lost').length,
                totalConversations: conversations.length,
                activeConversations,
                lastActivity: history[0]?.createdAt || lead.updatedAt
            }
        };
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

            // Auto-create a conversation for manual leads so they appear in Inbox
            const conversation = await prisma.conversation.create({
                data: {
                    leadId: lead.id,
                    status: 'queued',
                    pipeline: lead.pipeline,
                    assignedAgentId: null  // Goes to queue for assignment
                },
                include: {
                    lead: { select: { id: true, name: true, phone: true, company: true } },
                    assignedAgent: { select: { id: true, name: true } }
                }
            });

            // Emit Real-time Events
            emitNewLead(lead);
            emitNewConversation(conversation);

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

            // Sync pipeline change to active conversation
            if (data.pipeline) {
                const activeConversation = await prisma.conversation.findFirst({
                    where: { leadId: id, status: { not: 'closed' } }
                });

                if (activeConversation && activeConversation.pipeline !== data.pipeline) {
                    console.log(`🔄 Syncing conversation pipeline: ${activeConversation.pipeline} -> ${data.pipeline}`);
                    const updatedConversation = await prisma.conversation.update({
                        where: { id: activeConversation.id },
                        data: {
                            pipeline: data.pipeline,
                            assignedAgentId: null // Reset assignment to return to queue
                        },
                        include: {
                            lead: { select: { id: true, name: true, phone: true, company: true } },
                            assignedAgent: { select: { id: true, name: true } }
                        }
                    });
                    emitConversationUpdated(updatedConversation);
                }
            }

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

    // PUT /leads/:id/stage - Transactional Stage Change with Audit Log
    server.put('/:id/stage', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { stage, pipeline } = request.body as { stage: string; pipeline?: 'high_ticket' | 'low_ticket' };
        const user = (request as any).user;

        // Get current lead state
        const currentLead = await prisma.lead.findUnique({ where: { id } });
        if (!currentLead) return reply.code(404).send({ error: 'Lead não encontrado' });

        const currentPipeline = pipeline || currentLead.pipeline || 'high_ticket';
        const oldStage = currentPipeline === 'high_ticket' ? currentLead.statusHT : currentLead.statusLT;

        // Transactional update: Lead + LeadHistory in one atomic operation
        const result = await prisma.$transaction(async (tx) => {
            // Update lead stage
            const updateData: any = {};
            if (currentPipeline === 'high_ticket') {
                updateData.statusHT = stage;
            } else {
                updateData.statusLT = stage;
            }

            const updatedLead = await tx.lead.update({
                where: { id },
                data: updateData
            });

            // Create audit log entry
            await tx.leadHistory.create({
                data: {
                    leadId: id,
                    action: 'stage_changed',
                    details: {
                        from: oldStage || 'novo',
                        to: stage,
                        pipeline: currentPipeline
                    },
                    userId: user.id
                }
            });

            // Also create interaction for backward compatibility
            await tx.interaction.create({
                data: {
                    leadId: id,
                    userId: user.id,
                    type: 'status_change',
                    content: `Etapa alterada: ${oldStage || 'novo'} → ${stage}`,
                    metadata: { from: oldStage, to: stage, pipeline: currentPipeline }
                }
            });

            return updatedLead;
        });

        console.log(`📊 Stage change: ${currentLead.name} [${oldStage} → ${stage}] by ${user.name}`);

        // Emit Real-time Event
        emitLeadUpdated(result);

        return {
            lead: result,
            stageChange: {
                from: oldStage,
                to: stage,
                pipeline: currentPipeline,
                changedBy: user.name,
                changedAt: new Date().toISOString()
            }
        };
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

    // GET /leads/:id/history - Get lead activity history
    server.get<{ Params: { id: string } }>('/:id/history', async (request, reply) => {
        const { id } = request.params;

        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) {
            return reply.code(404).send({ error: 'Lead não encontrado' });
        }

        const history = await prisma.leadHistory.findMany({
            where: { leadId: id },
            include: {
                user: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        return history;
    });

    // GET /leads/:id/deals - Get all deals for a lead
    server.get<{ Params: { id: string } }>('/:id/deals', async (request, reply) => {
        const { id } = request.params;

        const deals = await prisma.deal.findMany({
            where: { leadId: id },
            include: {
                owner: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return deals;
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

    // POST /leads/:id/lost - Mark lead as lost with reason
    server.post<{ Params: { id: string } }>('/:id/lost', async (request, reply) => {
        const { id } = request.params;
        const { lossReasonId, notes } = request.body as { lossReasonId: string; notes?: string };
        const user = (request as any).user;

        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) return reply.code(404).send({ error: 'Lead não encontrado' });

        // Update lead status to 'perdido' and record loss reason
        const updateData: any = {
            lostAt: new Date(),
            lossReasonId: lossReasonId,
            notes: notes ? (lead.notes ? `${lead.notes}\n\n[Perda] ${notes}` : `[Perda] ${notes}`) : lead.notes,
        };

        // Set status to 'perdido' based on pipeline
        if (lead.pipeline === 'high_ticket') {
            updateData.statusHT = 'perdido';
        } else if (lead.pipeline === 'low_ticket') {
            updateData.statusLT = 'perdido';
        }

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: updateData,
            include: {
                assignedUser: { select: { id: true, name: true } }
            }
        });

        // Create history entry
        await prisma.leadHistory.create({
            data: {
                leadId: id,
                action: 'marked_lost',
                details: {
                    lossReasonId,
                    notes,
                    previousStatus: lead.pipeline === 'high_ticket' ? lead.statusHT : lead.statusLT
                },
                userId: user.id
            }
        });

        console.log(`❌ Lead marked as lost: ${lead.name} - Reason: ${lossReasonId}`);
        emitLeadUpdated(updatedLead);

        return updatedLead;
    });

    // GET /leads/tags/all - Get all unique tags used in the system
    server.get('/tags/all', async () => {
        const leads = await prisma.lead.findMany({
            where: { tags: { isEmpty: false } },
            select: { tags: true }
        });

        const allTags = new Set<string>();
        leads.forEach(lead => {
            (lead.tags as string[]).forEach(tag => allTags.add(tag));
        });

        return Array.from(allTags).sort();
    });

    // PUT /leads/:id/tags - Update lead tags
    server.put<{ Params: { id: string } }>('/:id/tags', async (request, reply) => {
        const { id } = request.params;
        const { tags } = request.body as { tags: string[] };
        const user = (request as any).user;

        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) return reply.code(404).send({ error: 'Lead não encontrado' });

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: { tags },
            include: { assignedUser: { select: { id: true, name: true } } }
        });

        await prisma.leadHistory.create({
            data: {
                leadId: id,
                action: 'tags_updated',
                details: { oldTags: lead.tags, newTags: tags },
                userId: user.id
            }
        });

        emitLeadUpdated(updatedLead);
        return updatedLead;
    });

    // POST /leads/:id/tags/add - Add a single tag to lead
    server.post<{ Params: { id: string } }>('/:id/tags/add', async (request, reply) => {
        const { id } = request.params;
        const { tag } = request.body as { tag: string };

        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) return reply.code(404).send({ error: 'Lead não encontrado' });

        const currentTags = (lead.tags as string[]) || [];
        if (currentTags.includes(tag)) {
            return lead; // Tag already exists
        }

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: { tags: [...currentTags, tag] },
            include: { assignedUser: { select: { id: true, name: true } } }
        });

        emitLeadUpdated(updatedLead);
        return updatedLead;
    });

    // POST /leads/:id/tags/remove - Remove a single tag from lead
    server.post<{ Params: { id: string } }>('/:id/tags/remove', async (request, reply) => {
        const { id } = request.params;
        const { tag } = request.body as { tag: string };

        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) return reply.code(404).send({ error: 'Lead não encontrado' });

        const currentTags = (lead.tags as string[]) || [];
        const newTags = currentTags.filter(t => t !== tag);

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: { tags: newTags },
            include: { assignedUser: { select: { id: true, name: true } } }
        });

        emitLeadUpdated(updatedLead);
        return updatedLead;
    });
}
