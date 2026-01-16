// Script to create conversations for orphaned leads (leads without conversations)
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    console.log('🔍 Finding leads without conversations...\n');

    // Get all leads
    const allLeads = await prisma.lead.findMany({
        select: { id: true, name: true, phone: true, pipeline: true }
    });

    let createdCount = 0;

    for (const lead of allLeads) {
        // Check if conversation exists
        const existingConv = await prisma.conversation.findFirst({
            where: { leadId: lead.id }
        });

        if (!existingConv) {
            console.log(`❌ ${lead.name} (${lead.pipeline}): No conversation - CREATING...`);

            await prisma.conversation.create({
                data: {
                    leadId: lead.id,
                    status: 'queued',
                    pipeline: lead.pipeline,
                    assignedAgentId: null
                }
            });

            console.log(`   ✅ Created conversation for ${lead.name}`);
            createdCount++;
        } else {
            console.log(`✅ ${lead.name}: Has conversation (status: ${existingConv.status}, pipeline: ${existingConv.pipeline})`);
        }
    }

    console.log(`\n📊 Summary: Created ${createdCount} new conversations`);

    await prisma.$disconnect();
}

main().catch(console.error);
