import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Users Status...');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            isOnline: true,
            pipelineType: true
        }
    });

    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
