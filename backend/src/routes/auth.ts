import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['admin', 'sdr', 'closer_ht', 'closer_lt']),
    pipelineType: z.enum(['high_ticket', 'low_ticket']).optional()
});

export default async function authRoutes(server: FastifyInstance) {

    // POST /auth/login
    server.post('/login', async (request, reply) => {
        try {
            const { email, password } = loginSchema.parse(request.body);

            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user || !user.isActive) {
                return reply.code(401).send({ error: 'Credenciais inválidas' });
            }

            const validPassword = await bcrypt.compare(password, user.passwordHash);

            if (!validPassword) {
                return reply.code(401).send({ error: 'Credenciais inválidas' });
            }

            const token = server.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                pipelineType: user.pipelineType
            }, { expiresIn: '7d' });

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    pipelineType: user.pipelineType
                }
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
            }
            throw error;
        }
    });

    // POST /auth/dev-login - Development login without password (DEV ONLY)
    server.post('/dev-login', async (request, reply) => {
        // Only allow in development
        if (process.env.NODE_ENV === 'production') {
            return reply.code(403).send({ error: 'Dev login disabled in production' });
        }

        try {
            const { userId } = request.body as { userId: string };

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            const token = server.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                pipelineType: user.pipelineType
            }, { expiresIn: '7d' });

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    pipelineType: user.pipelineType
                }
            };
        } catch (error) {
            console.error('Dev login error:', error);
            return reply.code(500).send({ error: 'Dev login failed' });
        }
    });

    // POST /auth/register (admin only)
    server.post('/register', {
        preHandler: [(server as any).authenticate]
    }, async (request, reply) => {
        try {
            const requester = (request as any).user;

            if (requester.role !== 'admin') {
                return reply.code(403).send({ error: 'Apenas administradores podem criar usuários' });
            }

            const data = registerSchema.parse(request.body);

            const existingUser = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                return reply.code(409).send({ error: 'Email já cadastrado' });
            }

            const passwordHash = await bcrypt.hash(data.password, 10);

            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    name: data.name,
                    role: data.role,
                    pipelineType: data.pipelineType
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    pipelineType: true,
                    createdAt: true
                }
            });

            return reply.code(201).send(user);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
            }
            throw error;
        }
    });

    // GET /auth/me
    server.get('/me', {
        preHandler: [(server as any).authenticate]
    }, async (request) => {
        const { id } = (request as any).user;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                pipelineType: true,
                createdAt: true
            }
        });

        return user;
    });
}
