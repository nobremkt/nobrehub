const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    // Get Low Ticket leads
    const ltLeads = await prisma.lead.findMany({
        where: { pipeline: 'low_ticket' },
        select: { id: true, name: true, phone: true }
    });

    console.log('Low Ticket Leads:', ltLeads.length);

    for (const lead of ltLeads) {
        const conv = await prisma.conversation.findFirst({
            where: { leadId: lead.id }
        });

        if (conv) {
            console.log(`✅ ${lead.name}: Conversation exists - status=${conv.status}, pipeline=${conv.pipeline}, agent=${conv.assignedAgentId || 'QUEUE'}`);
        } else {
            console.log(`❌ ${lead.name}: NO CONVERSATION FOUND!`);
        }
    }

    // Show all active conversations
    const activeConvs = await prisma.conversation.findMany({
        where: { status: { not: 'closed' } },
        include: { lead: { select: { name: true, pipeline: true } } }
    });

    console.log('\nActive Conversations:', activeConvs.length);
    activeConvs.forEach(c => {
        console.log(`  - ${c.lead.name} (lead pipeline: ${c.lead.pipeline}) -> conv pipeline: ${c.pipeline}, status: ${c.status}`);
    });

    await prisma.$disconnect();
}

main().catch(console.error);
