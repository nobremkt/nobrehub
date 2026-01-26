import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export default async function organizationRoutes(app: FastifyInstance) {
    // Get organization details
    app.get('/', async (req, reply) => {
        try {
            // Check if organization exists
            let organization = await prisma.organization.findFirst();

            // If not, create a default one
            if (!organization) {
                organization = await prisma.organization.create({
                    data: {
                        name: 'Minha Empresa',
                        address: 'Endereço não informado',
                        email: 'contato@empresa.com',
                        phone: '00 00000-0000',
                        cnpj: '00.000.000/0000-00',
                    }
                });
            }

            return organization;
        } catch (error) {
            console.error('Error fetching organization:', error);
            return reply.status(500).send({ error: 'Failed to fetch organization' });
        }
    });

    // Update organization details
    app.put('/', async (req, reply) => {
        try {
            const { name, cnpj, email, phone, address, website, logoUrl } = req.body as any;

            // Upsert ensures we update if exists, or create if not
            // We use a fixed ID or findFirst approach since we only have one org
            const existing = await prisma.organization.findFirst();

            let organization;

            if (existing) {
                organization = await prisma.organization.update({
                    where: { id: existing.id },
                    data: { name, cnpj, email, phone, address, website, logoUrl }
                });
            } else {
                organization = await prisma.organization.create({
                    data: { name, cnpj, email, phone, address, website, logoUrl }
                });
            }

            return organization;
        } catch (error) {
            console.error('Error updating organization:', error);
            return reply.status(500).send({ error: 'Failed to update organization' });
        }
    });
}
