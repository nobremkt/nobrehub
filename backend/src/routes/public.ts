import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';

// Public routes that don't require authentication
export default async function publicRoutes(server: FastifyInstance) {

    // GET /health - Health check for Uptime Robot
    server.get('/health', async () => {
        // Optional: Check DB connection
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { status: 'ok', uptime: process.uptime(), timestamp: new Date(), db: 'connected' };
        } catch (error) {
            return { status: 'degraded', uptime: process.uptime(), timestamp: new Date(), db: 'disconnected' };
        }
    });

    // POST /public/lead - Create lead from landing page (no auth required)
    server.post('/lead', async (request, reply) => {
        try {
            const body = request.body as any;

            // Validate minimum required fields
            if (!body.name || !body.phone) {
                return reply.code(400).send({ error: 'Nome e telefone são obrigatórios' });
            }

            // Create lead from landing page
            const lead = await prisma.lead.create({
                data: {
                    name: body.name,
                    email: body.email || null,
                    phone: body.phone.replace(/\D/g, ''), // Clean phone number
                    company: body.company || null,
                    source: 'website',
                    pipeline: body.pipeline || 'high_ticket',
                    statusHT: body.pipeline === 'low_ticket' ? null : 'novo',
                    statusLT: body.pipeline === 'low_ticket' ? 'novo' : null,
                    notes: body.notes || null,
                    contactReason: body.goal || body.challenge || body.contactReason || null, // "Qual seu maior desafio hoje"
                    estimatedValue: 0,
                    tags: []
                }
            });

            console.log(`📥 New lead from landing page: ${lead.name} (${lead.phone})`);
            console.log(`📝 Reason/Goal: ${lead.contactReason}`);

            // Emit real-time event
            try {
                const { emitNewLead } = await import('../services/socketService.js');
                emitNewLead(lead);
            } catch (socketError) {
                console.error('Error emitting socket event:', socketError);
            }

            return reply.code(201).send({ success: true, leadId: lead.id });
        } catch (error) {
            console.error('Error creating lead from landing page:', error);
            return reply.code(500).send({ error: 'Erro ao criar lead' });
        }
    });
}
