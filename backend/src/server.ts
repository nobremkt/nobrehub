console.log('🚨 SERVER ENTRY POINT - server.ts loading... [RESTART]');
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { initializeSocketService } from './services/socketService.js';
import prisma from './lib/prisma.js';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import userRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import roundRobinRoutes from './routes/roundRobin.js';
import whatsappRoutes from './routes/whatsapp.js';
import publicRoutes from './routes/public.js';
import conversationsRoutes from './routes/conversations.js';

const server = Fastify({ logger: true });

// Register plugins
async function bootstrap() {
    try {
        console.log('🚀 Starting server bootstrap...');
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔌 PORT: ${process.env.PORT || 'undefined (using 3000)'}`);

        // Register Multipart (File Uploads)
        await server.register(multipart, {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            }
        });
        console.log('✅ Multipart registered');

        // CORS
        console.log('Starting CORS registration...');
        await server.register(cors, {
            origin: (origin, cb) => {
                if (!origin) return cb(null, true);
                const allowedOrigins = [
                    'http://localhost:5173',
                    'http://localhost:3000',
                    process.env.FRONTEND_URL,
                ].filter(Boolean);
                if (allowedOrigins.includes(origin) || origin) {
                    return cb(null, true);
                }
                cb(new Error('Not allowed by CORS'), false);
            },
            credentials: true
        });
        console.log('✅ CORS registered');

        // JWT
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('FATAL: JWT_SECRET environment variable is not set.');
        }
        await server.register(jwt, { secret: jwtSecret });
        console.log('✅ JWT registered');

        // Auth decorator
        server.decorate('authenticate', async (request: any, reply: any) => {
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.code(401).send({ error: 'Token inválido ou expirado' });
            }
        });

        // Health check
        server.get('/health', async () => {
            console.log('💓 Health check requested');
            return { status: 'ok', timestamp: new Date().toISOString() };
        });
        console.log('✅ Health check route registered');

        // Routes
        console.log('Registering routes...');
        await server.register(publicRoutes, { prefix: '/public' });
        await server.register(authRoutes, { prefix: '/auth' });
        await server.register(leadRoutes, { prefix: '/leads' });

        // DEV ONLY: Public dev routes (no auth required)
        if (process.env.NODE_ENV !== 'production') {
            server.get('/users/dev-list', async () => {
                try {
                    const users = await prisma.user.findMany({
                        where: { isActive: true },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            pipelineType: true,
                            isOnline: true
                        },
                        orderBy: { name: 'asc' }
                    });
                    return users;
                } catch (error: any) {
                    console.error('❌ dev-list error:', error);
                    return { error: error.message };
                }
            });
            console.log('✅ Dev routes registered (dev-list)');
        }

        await server.register(userRoutes, { prefix: '/users' });
        await server.register(statsRoutes, { prefix: '/stats' });
        await server.register(roundRobinRoutes, { prefix: '/round-robin' });
        await server.register(whatsappRoutes, { prefix: '/whatsapp' });
        await server.register(conversationsRoutes, { prefix: '/conversations' });
        console.log('✅ All routes registered');

        // Start Fastify server
        const port = parseInt(process.env.PORT || '3000');
        const host = process.env.HOST || '0.0.0.0';

        console.log(`Attempting to listen on ${host}:${port}...`);
        await server.listen({ port, host });
        console.log(`🚀 Fastify server successfully listening at http://${host}:${port}`);

        // Initialize Socket.io
        try {
            console.log('Initializing Socket.io...');
            const io = initializeSocketService(server.server);
            console.log('🔌 Socket.io initialized on same server');
        } catch (socketError) {
            console.error('⚠️ Socket.io init failed:', socketError);
        }

    } catch (err) {
        console.error('❌ FATAL ERROR starting server:', err);
        process.exit(1);
    }
}

bootstrap();

