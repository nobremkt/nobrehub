
import { FastifyInstance } from 'fastify';
import { z } from 'zod'; // Assuming zod is used, or I'll use simple validation
import { prisma } from '../lib/prisma';

export async function pipelineRoutes(app: FastifyInstance) {

    // GET /stages?pipeline=high_ticket
    app.get('/stages', async (request, reply) => {
        const querySchema = z.object({
            pipeline: z.enum(['high_ticket', 'low_ticket', 'production', 'post_sales', 'sales']) // sales might need handling
        });

        const parsed = querySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Invalid pipeline type' });
        }

        const { pipeline } = parsed.data;

        const stages = await prisma.pipelineStage.findMany({
            where: {
                pipeline: pipeline as any,
                isActive: true
            },
            orderBy: {
                order: 'asc'
            }
        });

        return stages;
    });

    // POST /stages (Create new stage)
    app.post('/stages', async (request, reply) => {
        const bodySchema = z.object({
            name: z.string().min(1),
            pipeline: z.enum(['high_ticket', 'low_ticket', 'production', 'post_sales']),
            color: z.string().default('slate'),
            order: z.number().optional()
        });

        const parsed = bodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send(parsed.error);
        }

        const { name, pipeline, color, order } = parsed.data;

        // Determine order if not provided
        let nextOrder = order;
        if (nextOrder === undefined) {
            const lastStage = await prisma.pipelineStage.findFirst({
                where: { pipeline: pipeline as any },
                orderBy: { order: 'desc' }
            });
            nextOrder = (lastStage?.order ?? -1) + 1;
        }

        const stage = await prisma.pipelineStage.create({
            data: {
                name,
                pipeline: pipeline as any,
                color,
                order: nextOrder,
                isSystem: false // User created
            }
        });

        return stage;
    });

    // PUT /stages/reorder (Batch reorder)
    app.put('/stages/reorder', async (request, reply) => {
        const bodySchema = z.object({
            stages: z.array(z.object({
                id: z.string(),
                order: z.number()
            }))
        });

        const parsed = bodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send(parsed.error);
        }

        const { stages } = parsed.data;

        // Use transaction for atomic updates
        await prisma.$transaction(
            stages.map(s =>
                prisma.pipelineStage.update({
                    where: { id: s.id },
                    data: { order: s.order }
                })
            )
        );

        return { success: true };
    });

    // PUT /stages/:id (Update stage details)
    app.put('/stages/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const bodySchema = z.object({
            name: z.string().optional(),
            color: z.string().optional(),
            isActive: z.boolean().optional()
        });

        const parsed = bodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send(parsed.error);
        }

        const stage = await prisma.pipelineStage.update({
            where: { id },
            data: parsed.data
        });

        return stage;
    });

    // DELETE /stages/:id
    app.delete('/stages/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const stage = await prisma.pipelineStage.findUnique({ where: { id } });
        if (!stage) return reply.status(404).send({ error: 'Stage not found' });

        if (stage.isSystem) {
            return reply.status(403).send({ error: 'Cannot delete system stage' });
        }

        // Check if stages has leads?
        // If we delete, leads become orphaned or need to move.
        // For now, soft delete or restrict.
        // We'll soft delete by setting isActive: false
        await prisma.pipelineStage.update({
            where: { id },
            data: { isActive: false }
        });

        return { success: true };
    });
}
