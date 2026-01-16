const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    const conv = await prisma.conversation.findUnique({
        where: { id: '9e10b54a-8b29-4009-9d2f-f205ca1aed85' },
        include: {
            lead: true,
            messages: { orderBy: { createdAt: 'asc' } }
        }
    });

    console.log('Conversation:', conv?.id);
    console.log('Lead:', conv?.lead?.name);
    console.log('Messages count:', conv?.messages?.length);
    console.log('Messages:');
    conv?.messages?.forEach(m => {
        console.log(`  ${m.direction === 'in' ? '←' : '→'} ${m.text} (${m.createdAt.toISOString()})`);
    });

    await prisma.$disconnect();
}

main().catch(console.error);
