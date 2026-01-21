import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';

// ============ INTERFACES ============

interface CreateActivityBody {
    leadId: string;
    type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'task' | 'follow_up';
    title: string;
    description?: string;
    dueDate: string; // ISO date string
    assignedTo?: string;
}

interface UpdateActivityBody {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: 'pending' | 'completed' | 'skipped' | 'overdue';
    notes?: string;
    assignedTo?: string;
}

interface CreatePlaybookBody {
    name: string;
    description?: string;
    stageKey?: string;
    pipeline?: string;
}

interface CreateActivityTemplateBody {
    playbookId: string;
    type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'task' | 'follow_up';
    title: string;
    description?: string;
    daysFromStart: number;
    order?: number;
    messageTemplate?: string;
}

export async function activitiesRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('preValidation', async (request: any, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Token inválido ou expirado' });
        }
    });

    // ============ ACTIVITIES ============

    // Get activities for a lead
    app.get('/lead/:leadId', async (request: FastifyRequest<{ Params: { leadId: string }; Querystring: { status?: string } }>, reply: FastifyReply) => {
        try {
            const { leadId } = request.params;
            const { status } = request.query;

            const where: any = { leadId };
            if (status) {
                where.status = status;
            }

            const activities = await prisma.activity.findMany({
                where,
                orderBy: { dueDate: 'asc' },
            });

            return reply.send(activities);
        } catch (error) {
            console.error('Error fetching activities:', error);
            return reply.status(500).send({ error: 'Failed to fetch activities' });
        }
    });

    // Get all pending activities for current user
    app.get('/my-pending', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;

            const activities = await prisma.activity.findMany({
                where: {
                    assignedTo: userId,
                    status: 'pending',
                },
                orderBy: { dueDate: 'asc' },
                take: 50,
            });

            return reply.send(activities);
        } catch (error) {
            console.error('Error fetching my activities:', error);
            return reply.status(500).send({ error: 'Failed to fetch activities' });
        }
    });

    // Get overdue activities count
    app.get('/overdue-count', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;

            const count = await prisma.activity.count({
                where: {
                    assignedTo: userId,
                    status: 'pending',
                    dueDate: { lt: new Date() },
                },
            });

            return reply.send({ count });
        } catch (error) {
            console.error('Error counting overdue:', error);
            return reply.status(500).send({ error: 'Failed to count overdue activities' });
        }
    });

    // Create an activity
    app.post('/', async (request: FastifyRequest<{ Body: CreateActivityBody }>, reply: FastifyReply) => {
        try {
            const { leadId, type, title, description, dueDate, assignedTo } = request.body;
            const userId = (request as any).userId;

            const activity = await prisma.activity.create({
                data: {
                    leadId,
                    type: type as any,
                    title,
                    description,
                    dueDate: new Date(dueDate),
                    assignedTo: assignedTo || userId,
                },
            });

            return reply.status(201).send(activity);
        } catch (error) {
            console.error('Error creating activity:', error);
            return reply.status(500).send({ error: 'Failed to create activity' });
        }
    });

    // Update an activity
    app.patch('/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateActivityBody }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const updates = request.body;

            const data: any = { ...updates };
            if (updates.dueDate) {
                data.dueDate = new Date(updates.dueDate);
            }
            if (updates.status === 'completed') {
                data.completedAt = new Date();
            }

            const activity = await prisma.activity.update({
                where: { id },
                data,
            });

            return reply.send(activity);
        } catch (error: any) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ error: 'Activity not found' });
            }
            console.error('Error updating activity:', error);
            return reply.status(500).send({ error: 'Failed to update activity' });
        }
    });

    // Complete an activity
    app.post('/:id/complete', async (request: FastifyRequest<{ Params: { id: string }; Body: { notes?: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const { notes } = request.body || {};

            const activity = await prisma.activity.update({
                where: { id },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    notes,
                },
            });

            return reply.send(activity);
        } catch (error: any) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ error: 'Activity not found' });
            }
            console.error('Error completing activity:', error);
            return reply.status(500).send({ error: 'Failed to complete activity' });
        }
    });

    // Skip an activity
    app.post('/:id/skip', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const activity = await prisma.activity.update({
                where: { id },
                data: { status: 'skipped' },
            });

            return reply.send(activity);
        } catch (error: any) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ error: 'Activity not found' });
            }
            console.error('Error skipping activity:', error);
            return reply.status(500).send({ error: 'Failed to skip activity' });
        }
    });

    // Delete an activity
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            await prisma.activity.delete({ where: { id } });

            return reply.send({ success: true });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ error: 'Activity not found' });
            }
            console.error('Error deleting activity:', error);
            return reply.status(500).send({ error: 'Failed to delete activity' });
        }
    });

    // ============ PLAYBOOKS ============

    // Get all playbooks
    app.get('/playbooks', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const playbooks = await prisma.playbook.findMany({
                where: { isActive: true },
                include: {
                    templates: {
                        orderBy: { order: 'asc' },
                    },
                },
            });

            return reply.send(playbooks);
        } catch (error) {
            console.error('Error fetching playbooks:', error);
            return reply.status(500).send({ error: 'Failed to fetch playbooks' });
        }
    });

    // Create a playbook
    app.post('/playbooks', async (request: FastifyRequest<{ Body: CreatePlaybookBody }>, reply: FastifyReply) => {
        try {
            const { name, description, stageKey, pipeline } = request.body;

            const playbook = await prisma.playbook.create({
                data: {
                    name,
                    description,
                    stageKey,
                    pipeline: pipeline as any,
                },
            });

            return reply.status(201).send(playbook);
        } catch (error) {
            console.error('Error creating playbook:', error);
            return reply.status(500).send({ error: 'Failed to create playbook' });
        }
    });

    // Add template to playbook
    app.post('/playbooks/:playbookId/templates', async (request: FastifyRequest<{ Params: { playbookId: string }; Body: Omit<CreateActivityTemplateBody, 'playbookId'> }>, reply: FastifyReply) => {
        try {
            const { playbookId } = request.params;
            const { type, title, description, daysFromStart, order = 0, messageTemplate } = request.body;

            const template = await prisma.activityTemplate.create({
                data: {
                    playbookId,
                    type: type as any,
                    title,
                    description,
                    daysFromStart,
                    order,
                    messageTemplate,
                },
            });

            return reply.status(201).send(template);
        } catch (error) {
            console.error('Error creating activity template:', error);
            return reply.status(500).send({ error: 'Failed to create template' });
        }
    });

    // Apply playbook to a lead (creates activities from templates)
    app.post('/playbooks/:playbookId/apply', async (request: FastifyRequest<{ Params: { playbookId: string }; Body: { leadId: string } }>, reply: FastifyReply) => {
        try {
            const { playbookId } = request.params;
            const { leadId } = request.body;
            const userId = (request as any).userId;

            // Get playbook with templates
            const playbook = await prisma.playbook.findUnique({
                where: { id: playbookId },
                include: { templates: { orderBy: { order: 'asc' } } },
            });

            if (!playbook) {
                return reply.status(404).send({ error: 'Playbook not found' });
            }

            const now = new Date();
            const activities = await prisma.$transaction(
                playbook.templates.map(template =>
                    prisma.activity.create({
                        data: {
                            leadId,
                            type: template.type,
                            title: template.title,
                            description: template.description,
                            dueDate: new Date(now.getTime() + template.daysFromStart * 24 * 60 * 60 * 1000),
                            assignedTo: userId,
                            templateId: template.id,
                        },
                    })
                )
            );

            return reply.status(201).send({
                message: `Applied ${activities.length} activities from playbook "${playbook.name}"`,
                activities,
            });
        } catch (error) {
            console.error('Error applying playbook:', error);
            return reply.status(500).send({ error: 'Failed to apply playbook' });
        }
    });
}
