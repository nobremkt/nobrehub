import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';

export default async function userRoutes(server: FastifyInstance) {

    // All routes require authentication
    server.addHook('preHandler', (server as any).authenticate);

    // GET /users - List users (admin only)
    server.get('/', async (request, reply) => {
        const user = (request as any).user;

        if (!['admin', 'manager_sales', 'manager_production', 'strategic'].includes(user.role)) {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                pipelineType: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: { assignedLeads: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return users;
    });

    // GET /users/closers/:pipeline - List closers by pipeline
    server.get('/closers/:pipeline', async (request) => {
        const { pipeline } = request.params as { pipeline: string };

        const closers = await prisma.user.findMany({
            where: {
                role: pipeline === 'high_ticket' ? 'closer_ht' : 'closer_lt',
                isActive: true
            },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { assignedLeads: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return closers;
    });

    // PUT /users/:id - Update user (admin only)
    server.put('/:id', async (request, reply) => {
        const currentUser = (request as any).user;
        const { id } = request.params as { id: string };
        const data = request.body as any;

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                role: data.role,
                pipelineType: data.pipelineType,
                isActive: data.isActive
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                pipelineType: true,
                isActive: true
            }
        });

        return user;
    });

    // DELETE /users/:id - Deactivate user (admin only)
    server.delete('/:id', async (request, reply) => {
        const currentUser = (request as any).user;
        const { id } = request.params as { id: string };

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        // Don't delete, just deactivate
        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        return { success: true };
    });
}
