import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export default async function notificationRoutes(app: FastifyInstance) {
    // Get current user preferences
    app.get('/preferences', {
        preHandler: [app.authenticate]
    }, async (req: any, reply) => {
        try {
            const userId = req.user.id;
            let prefs = await prisma.notificationPreferences.findUnique({
                where: { userId }
            });

            if (!prefs) {
                // Return defaults if not found (or create on the fly)
                prefs = await prisma.notificationPreferences.create({
                    data: { userId }
                });
            }

            return prefs;
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            return reply.status(500).send({ error: 'Failed to fetch preferences' });
        }
    });

    // Update preferences
    app.put('/preferences', {
        preHandler: [app.authenticate]
    }, async (req: any, reply) => {
        try {
            const userId = req.user.id;
            const updates = req.body as any;

            // Remove sensitive or non-updatable fields
            delete updates.id;
            delete updates.userId;
            delete updates.updatedAt;

            const prefs = await prisma.notificationPreferences.upsert({
                where: { userId },
                create: { ...updates, userId },
                update: updates
            });

            return prefs;
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            return reply.status(500).send({ error: 'Failed to update preferences' });
        }
    });
}
