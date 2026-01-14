import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Assigning WhatsApp leads to conversations...\n');

    // Get first admin user (Caio or Rogerio)
    const admin = await prisma.user.findFirst({
        where: { role: 'admin' }
    });

    if (!admin) {
        console.log('❌ No admin user found!');
        return;
    }

    console.log(`👤 Using admin: ${admin.name} (${admin.id})\n`);

    // Get all WhatsApp leads without active conversation
    const leads = await prisma.lead.findMany({
        where: { source: 'whatsapp' }
    });

    for (const lead of leads) {
        // Check for existing active conversation
        let conversation = await prisma.conversation.findFirst({
            where: { leadId: lead.id, status: { not: 'closed' } }
        });

        if (!conversation) {
            // Create new conversation
            conversation = await prisma.conversation.create({
                data: {
                    leadId: lead.id,
                    assignedAgentId: admin.id,
                    channel: 'whatsapp',
                    status: 'active',
                    pipeline: lead.pipeline as any,
                    lastMessageAt: new Date()
                }
            });
            console.log(`✅ Created conversation for ${lead.name} assigned to ${admin.name}`);
        } else if (!conversation.assignedAgentId) {
            // Assign to admin if no agent
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { assignedAgentId: admin.id, status: 'active' }
            });
            console.log(`✅ Assigned existing conversation for ${lead.name} to ${admin.name}`);
        } else {
            console.log(`⏭️ ${lead.name} already has conversation with agent`);
        }
    }

    console.log('\n✅ Done! Refresh Atendimento to see conversations.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
