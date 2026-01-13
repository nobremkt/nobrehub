import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';

export default async function statsRoutes(server: FastifyInstance) {

    // All routes require authentication
    server.addHook('preHandler', (server as any).authenticate);

    // GET /stats/dashboard - Main dashboard stats
    server.get('/dashboard', async (request) => {
        const user = (request as any).user;

        // Build where clause based on role
        const where: any = {};
        if (user.role === 'closer_ht') {
            where.assignedTo = user.id;
            where.pipeline = 'high_ticket';
        } else if (user.role === 'closer_lt') {
            where.assignedTo = user.id;
            where.pipeline = 'low_ticket';
        }

        // Total leads
        const totalLeads = await prisma.lead.count({ where });

        // Leads by status
        const htLeads = await prisma.lead.groupBy({
            by: ['statusHT'],
            where: { ...where, pipeline: 'high_ticket' },
            _count: true,
            _sum: { estimatedValue: true }
        });

        const ltLeads = await prisma.lead.groupBy({
            by: ['statusLT'],
            where: { ...where, pipeline: 'low_ticket' },
            _count: true,
            _sum: { estimatedValue: true }
        });

        // Total value
        const totalValue = await prisma.lead.aggregate({
            where,
            _sum: { estimatedValue: true }
        });

        // Leads created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const leadsToday = await prisma.lead.count({
            where: {
                ...where,
                createdAt: { gte: today }
            }
        });

        // Closed leads (won)
        const closedLeads = await prisma.lead.count({
            where: {
                ...where,
                OR: [
                    { statusHT: 'fechado' },
                    { statusLT: 'fechado' }
                ]
            }
        });

        return {
            totalLeads,
            leadsToday,
            closedLeads,
            totalValue: totalValue._sum.estimatedValue || 0,
            highTicket: htLeads.map(s => ({
                status: s.statusHT,
                count: s._count,
                value: s._sum.estimatedValue || 0
            })),
            lowTicket: ltLeads.map(s => ({
                status: s.statusLT,
                count: s._count,
                value: s._sum.estimatedValue || 0
            }))
        };
    });

    // GET /stats/pipeline - Pipeline breakdown
    server.get('/pipeline', async (request) => {
        const query = request.query as any;
        const pipeline = query.pipeline || 'high_ticket';

        const statusField = pipeline === 'high_ticket' ? 'statusHT' : 'statusLT';

        const stats = await prisma.lead.groupBy({
            by: [statusField as any],
            where: { pipeline },
            _count: true,
            _sum: { estimatedValue: true }
        });

        return stats.map(s => ({
            status: (s as any)[statusField],
            count: s._count,
            value: s._sum.estimatedValue || 0
        }));
    });

    // GET /stats/closers - Closer performance
    server.get('/closers', async (request, reply) => {
        const user = (request as any).user;

        if (user.role !== 'admin') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        const closers = await prisma.user.findMany({
            where: {
                role: { in: ['closer_ht', 'closer_lt'] },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                role: true,
                assignedLeads: {
                    select: {
                        id: true,
                        statusHT: true,
                        statusLT: true,
                        estimatedValue: true
                    }
                }
            }
        });

        return closers.map(closer => {
            const leads = closer.assignedLeads;
            const closed = leads.filter(l => l.statusHT === 'fechado' || l.statusLT === 'fechado');
            const totalValue = closed.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

            return {
                id: closer.id,
                name: closer.name,
                role: closer.role,
                totalLeads: leads.length,
                closedLeads: closed.length,
                conversionRate: leads.length > 0 ? ((closed.length / leads.length) * 100).toFixed(1) : 0,
                totalRevenue: totalValue
            };
        });
    });
}
