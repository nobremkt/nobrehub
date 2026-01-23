import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export default async function productsRoutes(app: FastifyInstance) {
    // List all active products
    app.get('/', async (req, reply) => {
        try {
            const products = await prisma.product.findMany({
                where: { active: true },
                orderBy: { name: 'asc' },
            });
            return products;
        } catch (error) {
            console.error('Error listing products:', error);
            return reply.status(500).send({ error: 'Failed to list products' });
        }
    });

    // Create product
    app.post('/', async (req, reply) => {
        try {
            const { name, description, price } = req.body as any;

            const product = await prisma.product.create({
                data: {
                    name,
                    description,
                    price: Number(price), // Ensure decimal
                },
            });

            return reply.status(201).send(product);
        } catch (error) {
            console.error('Error creating product:', error);
            return reply.status(500).send({ error: 'Failed to create product' });
        }
    });

    // Update product
    app.put('/:id', async (req, reply) => {
        try {
            const { id } = req.params as any;
            const { name, description, price, active } = req.body as any;

            const product = await prisma.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    price: price !== undefined ? Number(price) : undefined,
                    active,
                },
            });

            return product;
        } catch (error) {
            console.error('Error updating product:', error);
            return reply.status(500).send({ error: 'Failed to update product' });
        }
    });

    // Delete product (Soft delete)
    app.delete('/:id', async (req, reply) => {
        try {
            const { id } = req.params as any;

            const product = await prisma.product.update({
                where: { id },
                data: { active: false },
            });

            return product;
        } catch (error) {
            console.error('Error deleting product:', error);
            return reply.status(500).send({ error: 'Failed to delete product' });
        }
    });
}
