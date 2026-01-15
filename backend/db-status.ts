import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('====== DATABASE STATUS CHECK ======\n');

    // 1. Check Users
    console.log('👥 USERS:');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isOnline: true,
            isActive: true,
            pipelineType: true,
            currentChatCount: true,
            maxConcurrentChats: true
        }
    });

    for (const u of users) {
        console.log(`  - ${u.name} (${u.role})`);
        console.log(`    Email: ${u.email}`);
        console.log(`    Online: ${u.isOnline} | Active: ${u.isActive}`);
        console.log(`    Pipeline: ${u.pipelineType || 'NULL'} | Chats: ${u.currentChatCount}/${u.maxConcurrentChats}`);
        console.log('');
    }

    // 2. Check Queue
    console.log('\n📋 QUEUE (waiting items):');
    const queueItems = await prisma.queue.findMany({
        where: { status: 'waiting' },
        include: { lead: { select: { name: true, phone: true } } },
        take: 10
    });

    if (queueItems.length === 0) {
        console.log('  (empty)');
    } else {
        for (const item of queueItems) {
            console.log(`  - ${item.lead.name} (${item.lead.phone}) @ ${item.pipeline}`);
        }
    }

    // 3. Check Conversations
    console.log('\n💬 ACTIVE CONVERSATIONS:');
    const conversations = await prisma.conversation.findMany({
        where: { status: { not: 'closed' } },
        include: {
            lead: { select: { name: true, phone: true } },
            assignedAgent: { select: { name: true } }
        },
        take: 10
    });

    if (conversations.length === 0) {
        console.log('  (none)');
    } else {
        for (const c of conversations) {
            console.log(`  - ${c.lead.name} -> ${c.assignedAgent?.name || 'UNASSIGNED'} (${c.status})`);
        }
    }

    // 4. Check Leads from WhatsApp
    console.log('\n📱 RECENT WHATSAPP LEADS:');
    const leads = await prisma.lead.findMany({
        where: { source: 'whatsapp' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    if (leads.length === 0) {
        console.log('  (none)');
    } else {
        for (const l of leads) {
            console.log(`  - ${l.name} (${l.phone}) @ ${l.pipeline} - Created: ${l.createdAt}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
