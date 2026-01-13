import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';

// Public routes that don't require authentication
export default async function publicRoutes(server: FastifyInstance) {

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
                    estimatedValue: 0,
                    tags: []
                }
            });

            console.log(`📥 New lead from landing page: ${lead.name} (${lead.phone})`);

            return reply.code(201).send({ success: true, leadId: lead.id });
        } catch (error) {
            console.error('Error creating lead from landing page:', error);
            return reply.code(500).send({ error: 'Erro ao criar lead' });
        }
    });
}
