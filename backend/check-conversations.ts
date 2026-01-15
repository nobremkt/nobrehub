import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking ALL Conversations (including closed)...');
    const conversations = await prisma.conversation.findMany({
        take: 10,
        select: {
            id: true,
            status: true,
            pipeline: true,
            assignedAgentId: true,
            lastMessageAt: true,
            lead: { select: { name: true, phone: true } },
            assignedAgent: { select: { id: true, name: true, role: true } }
        },
        orderBy: { lastMessageAt: 'desc' }
    });

    console.log(JSON.stringify(conversations, null, 2));
    console.log(`\nTotal active conversations: ${conversations.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
