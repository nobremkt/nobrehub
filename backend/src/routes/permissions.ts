import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

export async function permissionsRoutes(app: FastifyInstance) {
    app.addHook('preHandler', (app as any).authenticate);

    // List all permissions
    app.get('/', async (req, reply) => {
        const user = (req as any).user;
        if (user.role !== 'admin' && user.role !== 'strategic') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        const permissions = await prisma.roleAccess.findMany({
            orderBy: { role: 'asc' }
        });

        // Ensure we return something for every role even if not in DB yet (though seed handles this)
        return permissions;
    });

    // Update permissions
    app.put('/:role', async (req, reply) => {
        const user = (req as any).user;
        if (user.role !== 'admin' && user.role !== 'strategic') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        const { role } = req.params as { role: string };
        const schema = z.object({
            permissions: z.array(z.string())
        });

        try {
            const { permissions } = schema.parse(req.body);

            // Valid roles validation could be added here but relying on TS/Prisma for now

            const updated = await prisma.roleAccess.upsert({
                where: { role: role as any },
                update: { permissions },
                create: { role: role as any, permissions }
            });

            return updated;
        } catch (error) {
            return reply.code(400).send({ error: 'Dados inválidos' });
        }
    });
}
