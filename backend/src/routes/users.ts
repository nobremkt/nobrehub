import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Validation schemas
const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['admin', 'sdr', 'closer_ht', 'closer_lt', 'production', 'post_sales', 'manager_sales', 'manager_production', 'strategic']),
    sectorId: z.string().uuid().optional(),
    pipelineType: z.enum(['high_ticket', 'low_ticket', 'sales', 'production', 'post_sales']).optional()
});

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    role: z.enum(['admin', 'sdr', 'closer_ht', 'closer_lt', 'production', 'post_sales', 'manager_sales', 'manager_production', 'strategic']).optional(),
    sectorId: z.string().uuid().nullable().optional(),
    pipelineType: z.enum(['high_ticket', 'low_ticket', 'sales', 'production', 'post_sales']).nullable().optional(),
    isActive: z.boolean().optional()
});

const createSectorSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

const updateSectorSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().nullable().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isActive: z.boolean().optional()
});

export default async function userRoutes(server: FastifyInstance) {

    // All routes require authentication
    server.addHook('preHandler', (server as any).authenticate);

    // =====================
    // USER ROUTES
    // =====================

    // GET /users - List users (admin only)
    server.get('/', async (request, reply) => {
        const user = (request as any).user;

        if (!['admin', 'manager_sales', 'manager_production', 'strategic'].includes(user.role)) {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                pipelineType: true,
                isActive: true,
                sectorId: true,
                sector: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                },
                createdAt: true,
                _count: {
                    select: { assignedLeads: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return users;
    });

    // POST /users - Create new user (admin only)
    server.post('/', async (request, reply) => {
        const currentUser = (request as any).user;

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Apenas administradores podem criar usuários' });
        }

        try {
            const data = createUserSchema.parse(request.body);

            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                return reply.code(409).send({ error: 'Email já cadastrado' });
            }

            // Create user in Supabase Auth
            const { data: supabaseUser, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
                email: data.email,
                password: data.password,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    name: data.name,
                    role: data.role
                }
            });

            if (supabaseError) {
                console.error('Supabase Auth error:', supabaseError);
                return reply.code(500).send({ error: 'Erro ao criar usuário no Supabase: ' + supabaseError.message });
            }

            // Hash password for local storage (for JWT auth compatibility)
            const passwordHash = await bcrypt.hash(data.password, 10);

            // Create user in local database
            const user = await prisma.user.create({
                data: {
                    supabaseId: supabaseUser.user.id,
                    email: data.email,
                    passwordHash,
                    name: data.name,
                    role: data.role,
                    sectorId: data.sectorId,
                    pipelineType: data.pipelineType
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    sectorId: true,
                    sector: {
                        select: {
                            id: true,
                            name: true,
                            color: true
                        }
                    },
                    pipelineType: true,
                    isActive: true,
                    createdAt: true
                }
            });

            return reply.code(201).send(user);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
            }
            console.error('Create user error:', error);
            throw error;
        }
    });

    // GET /users/closers/:pipeline - List closers by pipeline
    server.get('/closers/:pipeline', async (request) => {
        const { pipeline } = request.params as { pipeline: string };

        const closers = await prisma.user.findMany({
            where: {
                role: pipeline === 'high_ticket' ? 'closer_ht' : 'closer_lt',
                isActive: true
            },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { assignedLeads: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return closers;
    });

    // PUT /users/:id - Update user (admin only)
    server.put('/:id', async (request, reply) => {
        const currentUser = (request as any).user;
        const { id } = request.params as { id: string };

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        try {
            const data = updateUserSchema.parse(request.body);

            const user = await prisma.user.update({
                where: { id },
                data: {
                    name: data.name,
                    role: data.role,
                    sectorId: data.sectorId,
                    pipelineType: data.pipelineType,
                    isActive: data.isActive
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    sectorId: true,
                    sector: {
                        select: {
                            id: true,
                            name: true,
                            color: true
                        }
                    },
                    pipelineType: true,
                    isActive: true
                }
            });

            return user;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
            }
            throw error;
        }
    });

    // DELETE /users/:id - Deactivate user (admin only)
    server.delete('/:id', async (request, reply) => {
        const currentUser = (request as any).user;
        const { id } = request.params as { id: string };

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        // Get user to find Supabase ID
        const userToDelete = await prisma.user.findUnique({
            where: { id },
            select: { supabaseId: true }
        });

        // Don't delete from Supabase, just deactivate locally
        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        return { success: true };
    });

    // =====================
    // SECTOR ROUTES
    // =====================

    // GET /users/sectors - List all sectors
    server.get('/sectors', async () => {
        const sectors = await prisma.sector.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return sectors;
    });

    // POST /users/sectors - Create sector (admin only)
    server.post('/sectors', async (request, reply) => {
        const currentUser = (request as any).user;

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Apenas administradores podem criar setores' });
        }

        try {
            const data = createSectorSchema.parse(request.body);

            // Check if sector already exists
            const existing = await prisma.sector.findUnique({
                where: { name: data.name }
            });

            if (existing) {
                return reply.code(409).send({ error: 'Setor já existe' });
            }

            const sector = await prisma.sector.create({
                data: {
                    name: data.name,
                    description: data.description,
                    color: data.color || '#6366f1'
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    color: true
                }
            });

            return reply.code(201).send(sector);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
            }
            throw error;
        }
    });

    // PUT /users/sectors/:id - Update sector (admin only)
    server.put('/sectors/:id', async (request, reply) => {
        const currentUser = (request as any).user;
        const { id } = request.params as { id: string };

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        try {
            const data = updateSectorSchema.parse(request.body);

            const sector = await prisma.sector.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    color: data.color,
                    isActive: data.isActive
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    color: true,
                    isActive: true
                }
            });

            return sector;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Dados inválidos', details: error.errors });
            }
            throw error;
        }
    });

    // DELETE /users/sectors/:id - Deactivate sector (admin only)
    server.delete('/sectors/:id', async (request, reply) => {
        const currentUser = (request as any).user;
        const { id } = request.params as { id: string };

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        // Check if sector has users
        const usersInSector = await prisma.user.count({
            where: { sectorId: id, isActive: true }
        });

        if (usersInSector > 0) {
            return reply.code(400).send({ error: 'Não é possível excluir setor com membros ativos' });
        }

        await prisma.sector.update({
            where: { id },
            data: { isActive: false }
        });

        return { success: true };
    });

    // POST /users/sectors/seed - Seed default sectors (admin only, one-time)
    server.post('/sectors/seed', async (request, reply) => {
        const currentUser = (request as any).user;

        if (currentUser.role !== 'admin') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }

        const defaultSectors = [
            { name: 'Vendas HT', description: 'Equipe de vendas High Ticket', color: '#f43f5e' },
            { name: 'Vendas LT', description: 'Equipe de vendas Low Ticket', color: '#ec4899' },
            { name: 'Produção', description: 'Equipe de produção e entregas', color: '#3b82f6' },
            { name: 'Pós-Venda', description: 'Equipe de pós-venda e sucesso do cliente', color: '#f59e0b' },
            { name: 'Administração', description: 'Equipe administrativa', color: '#8b5cf6' }
        ];

        const created = [];
        for (const sector of defaultSectors) {
            const existing = await prisma.sector.findUnique({
                where: { name: sector.name }
            });

            if (!existing) {
                const newSector = await prisma.sector.create({
                    data: sector,
                    select: { id: true, name: true, color: true }
                });
                created.push(newSector);
            }
        }

        return { message: `${created.length} setores criados`, sectors: created };
    });
}
