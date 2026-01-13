import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';

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

        // JWT
        await server.register(jwt, {
            secret: process.env.JWT_SECRET || 'default-secret-change-me'
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

        console.log('📱 WhatsApp routes registered at /whatsapp');

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
