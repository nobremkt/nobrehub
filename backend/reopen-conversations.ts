import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Reopening all closed conversations...');
    const result = await prisma.conversation.updateMany({
        where: { status: 'closed' },
        data: { status: 'active' }
    });
    console.log('Reopened:', result);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
