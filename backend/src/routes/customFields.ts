import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';

// ============ INTERFACES ============

interface CreateCustomFieldBody {
    name: string;
    key: string;
    type?: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'email' | 'phone';
    entity: 'contact' | 'company' | 'deal';
    options?: string[];
    order?: number;
    isVisible?: boolean;
    isRequired?: boolean;
    placeholder?: string;
}

interface UpdateCustomFieldBody {
    name?: string;
    type?: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'email' | 'phone';
    options?: string[];
    order?: number;
    isVisible?: boolean;
    isRequired?: boolean;
    placeholder?: string;
}

interface SetFieldValueBody {
    leadId: string;
    customFieldId: string;
    value: string;
}

interface BulkSetFieldValuesBody {
    leadId: string;
    values: { customFieldId: string; value: string }[];
}

export async function customFieldsRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook('preValidation', async (request: any, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Token inválido ou expirado' });
        }
    });

    // ============ CUSTOM FIELD DEFINITIONS ============

    // Get all custom fields (optionally filter by entity)
    app.get('/', async (request: FastifyRequest<{ Querystring: { entity?: string } }>, reply: FastifyReply) => {
        try {
            const { entity } = request.query;

            const where: any = {};
            if (entity) {
                where.entity = entity;
            }

            const fields = await prisma.customField.findMany({
                where,
                orderBy: [{ entity: 'asc' }, { order: 'asc' }],
            });

            return reply.send(fields);
        } catch (error) {
            console.error('Error fetching custom fields:', error);
            return reply.status(500).send({ error: 'Failed to fetch custom fields' });
        }
    });

    // Create a new custom field (admin only in future)
    app.post('/', async (request: FastifyRequest<{ Body: CreateCustomFieldBody }>, reply: FastifyReply) => {
        try {
            const { name, key, type = 'text', entity, options, order = 0, isVisible = true, isRequired = false, placeholder } = request.body;

            // Validate required fields
            if (!name || !key || !entity) {
                return reply.status(400).send({ error: 'name, key, and entity are required' });
            }

            // Check for duplicate key within same entity
            const existing = await prisma.customField.findFirst({
                where: { key, entity },
            });

            if (existing) {
                return reply.status(409).send({ error: `Custom field with key "${key}" already exists for entity "${entity}"` });
            }

            const field = await prisma.customField.create({
                data: {
                    name,
                    key,
                    type: type as any,
                    entity: entity as any,
                    options: options ? JSON.parse(JSON.stringify(options)) : undefined,
                    order,
                    isVisible,
                    isRequired,
                    placeholder,
                },
            });

            return reply.status(201).send(field);
        } catch (error) {
            console.error('Error creating custom field:', error);
            return reply.status(500).send({ error: 'Failed to create custom field' });
        }
    });

    // Update a custom field
    app.patch('/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateCustomFieldBody }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const updates = request.body;

            const field = await prisma.customField.update({
                where: { id },
                data: updates as any,
            });

            return reply.send(field);
        } catch (error: any) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ error: 'Custom field not found' });
            }
            console.error('Error updating custom field:', error);
            return reply.status(500).send({ error: 'Failed to update custom field' });
        }
    });

    // Delete a custom field
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            await prisma.customField.delete({ where: { id } });

            return reply.send({ success: true });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ error: 'Custom field not found' });
            }
            console.error('Error deleting custom field:', error);
            return reply.status(500).send({ error: 'Failed to delete custom field' });
        }
    });

    // Reorder custom fields
    app.post('/reorder', async (request: FastifyRequest<{ Body: { fields: { id: string; order: number }[] } }>, reply: FastifyReply) => {
        try {
            const { fields } = request.body;

            await prisma.$transaction(
                fields.map(({ id, order }) =>
                    prisma.customField.update({
                        where: { id },
                        data: { order },
                    })
                )
            );

            return reply.send({ success: true });
        } catch (error) {
            console.error('Error reordering custom fields:', error);
            return reply.status(500).send({ error: 'Failed to reorder custom fields' });
        }
    });

    // ============ CUSTOM FIELD VALUES ============

    // Get all field values for a lead
    app.get('/values/:leadId', async (request: FastifyRequest<{ Params: { leadId: string } }>, reply: FastifyReply) => {
        try {
            const { leadId } = request.params;

            // Get all custom fields with their values for this lead
            const fields = await prisma.customField.findMany({
                where: { isVisible: true },
                orderBy: [{ entity: 'asc' }, { order: 'asc' }],
                include: {
                    values: {
                        where: { leadId },
                    },
                },
            });

            // Transform to a more usable format
            const result = fields.map(field => ({
                ...field,
                value: field.values[0]?.value || null,
                values: undefined, // Remove the nested array
            }));

            return reply.send(result);
        } catch (error) {
            console.error('Error fetching field values:', error);
            return reply.status(500).send({ error: 'Failed to fetch field values' });
        }
    });

    // Set a single field value
    app.post('/values', async (request: FastifyRequest<{ Body: SetFieldValueBody }>, reply: FastifyReply) => {
        try {
            const { leadId, customFieldId, value } = request.body;

            // Upsert the value
            const fieldValue = await prisma.customFieldValue.upsert({
                where: {
                    customFieldId_leadId: { customFieldId, leadId },
                },
                update: { value },
                create: { customFieldId, leadId, value },
            });

            return reply.send(fieldValue);
        } catch (error) {
            console.error('Error setting field value:', error);
            return reply.status(500).send({ error: 'Failed to set field value' });
        }
    });

    // Bulk set field values for a lead
    app.post('/values/bulk', async (request: FastifyRequest<{ Body: BulkSetFieldValuesBody }>, reply: FastifyReply) => {
        try {
            const { leadId, values } = request.body;

            await prisma.$transaction(
                values.map(({ customFieldId, value }) =>
                    prisma.customFieldValue.upsert({
                        where: {
                            customFieldId_leadId: { customFieldId, leadId },
                        },
                        update: { value },
                        create: { customFieldId, leadId, value },
                    })
                )
            );

            // Fetch updated values
            const updatedFields = await prisma.customField.findMany({
                where: { isVisible: true },
                orderBy: [{ entity: 'asc' }, { order: 'asc' }],
                include: {
                    values: {
                        where: { leadId },
                    },
                },
            });

            const result = updatedFields.map(field => ({
                ...field,
                value: field.values[0]?.value || null,
                values: undefined,
            }));

            return reply.send(result);
        } catch (error) {
            console.error('Error bulk setting field values:', error);
            return reply.status(500).send({ error: 'Failed to set field values' });
        }
    });
}
