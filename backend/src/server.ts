import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeSocketService } from './services/socketService.js';

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
        // CORS - Allow frontend and landing pages
        await server.register(cors, {
            origin: (origin, cb) => {
                // Allow requests with no origin (like mobile apps or curl)
                if (!origin) return cb(null, true);

                // List of allowed origins
                const allowedOrigins = [
                    'http://localhost:5173',
                    'http://localhost:3000',
                    process.env.FRONTEND_URL,
                    // Landing pages can be from any domain
                ].filter(Boolean);

                // Allow if origin matches OR if it's a landing page making public requests
                if (allowedOrigins.includes(origin) || origin) {
                    return cb(null, true);
                }

                cb(new Error('Not allowed by CORS'), false);
            },
            credentials: true
        });

        // JWT - CRITICAL: Must have a secure secret, fail fast if not set
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start in an insecure state.');
        }
        await server.register(jwt, {
            secret: jwtSecret
        });

        // Auth decorator
        server.decorate('authenticate', async (request: any, reply: any) => {
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.code(401).send({ error: 'Token inválido ou expirado' });
            }
        });

        // Health check
        server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

        // Register public routes (no auth required)
        await server.register(publicRoutes, { prefix: '/public' });

        // Register authenticated routes
        await server.register(authRoutes, { prefix: '/auth' });
        await server.register(leadRoutes, { prefix: '/leads' });
        await server.register(userRoutes, { prefix: '/users' });
        await server.register(statsRoutes, { prefix: '/stats' });
        await server.register(roundRobinRoutes, { prefix: '/round-robin' });
        await server.register(whatsappRoutes, { prefix: '/whatsapp' });
        await server.register(conversationsRoutes, { prefix: '/conversations' });

        console.log('📱 WhatsApp routes registered at /whatsapp');
        console.log('💬 Conversations routes registered at /conversations');

        // Create HTTP server for Socket.io
        const httpServer = createServer(server.server);

        // Initialize Socket.io
        const io = initializeSocketService(httpServer);
        console.log('🔌 Socket.io initialized');

        // Start server
        const port = parseInt(process.env.PORT || '3000');
        const host = process.env.HOST || '0.0.0.0';

        await server.listen({ port, host });
        console.log(`🚀 Server running at http://localhost:${port}`);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

bootstrap();

