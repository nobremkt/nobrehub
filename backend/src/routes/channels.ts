
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function channelRoutes(app: FastifyInstance) {
    // GET /channels - List all channels
    app.get('/channels', async (request, reply) => {
        try {
            const channels = await prisma.channel.findMany({
                orderBy: { createdAt: 'desc' }
            });
            return channels;
        } catch (error) {
            console.error('Error fetching channels:', error);
            return reply.status(500).send({ error: 'Failed to fetch channels' });
        }
    });

    // POST /channels - Create new channel
    app.post('/channels', async (request, reply) => {
        const createChannelSchema = z.object({
            name: z.string(),
            type: z.enum(['whatsapp_official', 'whatsapp_api', 'instagram', 'email']),
            config: z.any().optional(),
            number: z.string().optional(),
            accountName: z.string().optional(),
            isEnabled: z.boolean().default(true),
        });

        try {
            const data = createChannelSchema.parse(request.body);

            const channel = await prisma.channel.create({
                data: {
                    name: data.name,
                    type: data.type,
                    config: data.config ?? {},
                    number: data.number,
                    accountName: data.accountName,
                    isEnabled: data.isEnabled,
                    status: 'disconnected', // Default to disconnected until validated
                }
            });

            return channel;
        } catch (error) {
            console.error('Error creating channel:', error);
            return reply.status(400).send({ error: 'Invalid data' });
        }
    });

    // PATCH /channels/:id - Update channel (enable/disable or config)
    app.patch('/channels/:id', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string(),
        });

        const updateChannelSchema = z.object({
            name: z.string().optional(),
            isEnabled: z.boolean().optional(),
            status: z.enum(['connected', 'disconnected', 'error']).optional(),
            config: z.any().optional(),
            number: z.string().optional(),
            accountName: z.string().optional(),
        });

        try {
            const { id } = paramsSchema.parse(request.params);
            const data = updateChannelSchema.parse(request.body);

            const channel = await prisma.channel.update({
                where: { id },
                data
            });

            return channel;
        } catch (error) {
            console.error('Error updating channel:', error);
            return reply.status(500).send({ error: 'Failed to update channel' });
        }
    });

    // DELETE /channels/:id - Delete channel
    app.delete('/channels/:id', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string(),
        });

        try {
            const { id } = paramsSchema.parse(request.params);
            await prisma.channel.delete({
                where: { id }
            });
            return { success: true };
        } catch (error) {
            console.error('Error deleting channel:', error);
            return reply.status(500).send({ error: 'Failed to delete channel' });
        }
    });
}
