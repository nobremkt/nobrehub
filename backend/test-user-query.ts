import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing specific user query...');
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
        console.log('✅ Query successful!');
        console.log('Returning users:', users.length);
        console.log('Sample:', users[0]);
    } catch (e: any) {
        console.error('❌ Query failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
