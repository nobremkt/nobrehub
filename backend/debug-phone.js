const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    // Find Caio lead
    const lead = await prisma.lead.findFirst({
        where: { name: { contains: 'Caio' } },
        select: { id: true, name: true, phone: true }
    });
    console.log('Lead:', lead);

    // Find all messages for this phone (last 4 digits)
    const messages = await prisma.message.findMany({
        where: { phone: { endsWith: '8231509' } },
        select: { id: true, phone: true, text: true, direction: true, leadId: true, conversationId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log('Messages matching phone suffix:', messages);

    // Find conversation for this lead
    if (lead) {
        const conversation = await prisma.conversation.findFirst({
            where: { leadId: lead.id },
            select: { id: true, status: true, pipeline: true }
        });
        console.log('Conversation:', conversation);

        // Find all messages for this conversation
        if (conversation) {
            const convMessages = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                select: { id: true, text: true, direction: true, createdAt: true },
                orderBy: { createdAt: 'desc' }
            });
            console.log('Messages in conversation:', convMessages);
        }
    }

    // Check if there are orphan messages (no conversationId)
    const orphanMessages = await prisma.message.findMany({
        where: { conversationId: null },
        select: { id: true, phone: true, text: true, leadId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log('Orphan messages (no conversationId):', orphanMessages);

    await prisma.$disconnect();
}

main().catch(console.error);
