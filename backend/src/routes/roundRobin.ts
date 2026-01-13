import { FastifyInstance } from 'fastify';
import { assignLeadRoundRobin, getRoundRobinStats, autoAssignAllUnassigned } from '../services/roundRobin.js';

export default async function roundRobinRoutes(server: FastifyInstance) {

    // All routes require authentication
    server.addHook('preHandler', (server as any).authenticate);

    // POST /round-robin/assign/:leadId - Assign single lead
    server.post('/assign/:leadId', async (request, reply) => {
        const user = (request as any).user;
        const { leadId } = request.params as { leadId: string };

        // Only admin or SDR can trigger round robin
        if (!['admin', 'sdr'].includes(user.role)) {
            return reply.code(403).send({ error: 'Sem permissão' });
        }

        try {
            const result = await assignLeadRoundRobin(leadId);
            return result;
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // POST /round-robin/auto-assign - Assign all unassigned leads
    server.post('/auto-assign', async (request, reply) => {
        const user = (request as any).user;
        const { pipeline } = request.body as { pipeline: 'high_ticket' | 'low_ticket' };

        // Only admin can do batch assignment
        if (user.role !== 'admin') {
            return reply.code(403).send({ error: 'Apenas administradores' });
        }

        try {
            const result = await autoAssignAllUnassigned(pipeline);
            return result;
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // GET /round-robin/stats/:pipeline - Get distribution stats
    server.get('/stats/:pipeline', async (request) => {
        const { pipeline } = request.params as { pipeline: 'high_ticket' | 'low_ticket' };

        const stats = await getRoundRobinStats(pipeline);
        return { pipeline, closers: stats };
    });
}
