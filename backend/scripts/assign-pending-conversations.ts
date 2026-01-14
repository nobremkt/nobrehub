import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = 'c5c42e67-fd7e-4be2-84e1-6ad4d984c851'; // Rogerio Nobre

    // Find all queue entries that are still waiting
    const waitingQueues = await prisma.queue.findMany({
        where: { status: 'waiting' },
        include: { lead: true }
    });

    console.log(`Found ${waitingQueues.length} pending queue entries`);

    for (const queue of waitingQueues) {
        // Check if lead already has an active conversation
        let conversation = await prisma.conversation.findFirst({
            where: { leadId: queue.leadId, status: { not: 'closed' } }
        });

        if (!conversation) {
            // Create conversation and assign
            conversation = await prisma.conversation.create({
                data: {
                    leadId: queue.leadId,
                    assignedAgentId: userId,
                    channel: 'whatsapp',
                    status: 'active',
                    pipeline: queue.pipeline,
                    lastMessageAt: new Date()
                }
            });
            console.log(`✅ Created and assigned conversation for lead: ${queue.lead.name}`);
        } else if (!conversation.assignedAgentId) {
            // Update existing conversation to assign agent
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    assignedAgentId: userId,
                    status: 'active'
                }
            });
            console.log(`✅ Assigned existing conversation for lead: ${queue.lead.name}`);
        } else {
            console.log(`⏭️ Lead ${queue.lead.name} already has assigned conversation`);
        }

        // Update queue status
        await prisma.queue.update({
            where: { id: queue.id },
            data: { status: 'assigned' }
        });
    }

    console.log('\n✅ All pending conversations processed!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
