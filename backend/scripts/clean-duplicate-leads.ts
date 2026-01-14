import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning duplicate WhatsApp leads...\n');

    // Find all WhatsApp leads grouped by phone (last 8 digits)
    const leads = await prisma.lead.findMany({
        where: { source: 'whatsapp' },
        orderBy: { createdAt: 'asc' }
    });

    // Group by last 8 digits of phone
    const groups = new Map<string, typeof leads>();
    for (const lead of leads) {
        const key = lead.phone.replace(/\D/g, '').slice(-8);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(lead);
    }

    let deletedCount = 0;

    for (const [phoneKey, group] of groups) {
        if (group.length > 1) {
            // Keep the first (oldest) lead, delete the rest
            const [keep, ...duplicates] = group;
            console.log(`📱 ${phoneKey}: Keeping "${keep.name}" (${keep.id}), deleting ${duplicates.length} duplicates`);

            for (const dup of duplicates) {
                // Delete related conversations and messages first
                await prisma.message.deleteMany({ where: { leadId: dup.id } });
                await prisma.conversation.deleteMany({ where: { leadId: dup.id } });
                await prisma.queue.deleteMany({ where: { leadId: dup.id } });
                await prisma.lead.delete({ where: { id: dup.id } });
                deletedCount++;
            }
        }
    }

    console.log(`\n✅ Deleted ${deletedCount} duplicate leads`);

    // Count remaining
    const remaining = await prisma.lead.count({ where: { source: 'whatsapp' } });
    console.log(`   Remaining WhatsApp leads: ${remaining}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
