import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find a lead
    const lead = await prisma.lead.findFirst({
        select: { id: true, name: true, phone: true, pipeline: true }
    });

    if (!lead) {
        console.log('No leads found in database');
        return;
    }

    console.log('Found lead:', lead);

    // Find an agent to assign
    const agent = await prisma.user.findFirst({
        where: { isActive: true, role: { in: ['admin', 'closer_ht', 'closer_lt'] } },
        select: { id: true, name: true }
    });

    if (!agent) {
        console.log('No active agent found');
        return;
    }

    console.log('Found agent:', agent);

    // Check if conversation exists
    const existingConv = await prisma.conversation.findFirst({
        where: { leadId: lead.id }
    });

    if (existingConv) {
        console.log('Conversation already exists:', existingConv.id, 'Status:', existingConv.status);

        // Reopen if closed
        if (existingConv.status === 'closed') {
            const updated = await prisma.conversation.update({
                where: { id: existingConv.id },
                data: { status: 'active' }
            });
            console.log('Reopened conversation:', updated.id);
        }
        return;
    }

    // Create new conversation
    const newConv = await prisma.conversation.create({
        data: {
            leadId: lead.id,
            assignedAgentId: agent.id,
            status: 'active',
            pipeline: lead.pipeline || 'high_ticket'
        }
    });

    console.log('Created new conversation:', newConv.id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
