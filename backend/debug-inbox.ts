// Debug script to check conversation and lead state
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== DEBUG INBOX ISSUE ===\n');

    // 1. Find all Low Ticket leads
    const ltLeads = await prisma.lead.findMany({
        where: { pipeline: 'low_ticket' },
        select: { id: true, name: true, phone: true, pipeline: true, statusLT: true }
    });

    console.log('📋 Low Ticket Leads:', ltLeads.length);
    ltLeads.forEach(l => console.log(`  - ${l.name} (${l.phone}) | status: ${l.statusLT}`));

    // 2. Find conversations for these leads
    console.log('\n📞 Conversations for Low Ticket Leads:');
    for (const lead of ltLeads) {
        const conversations = await prisma.conversation.findMany({
            where: { leadId: lead.id },
            select: {
                id: true,
                status: true,
                pipeline: true,
                assignedAgentId: true,
                assignedAgent: { select: { name: true, role: true } }
            }
        });

        if (conversations.length === 0) {
            console.log(`  ❌ ${lead.name}: NO CONVERSATION`);
        } else {
            conversations.forEach(c => {
                console.log(`  ✅ ${lead.name}: status=${c.status}, pipeline=${c.pipeline}, agent=${c.assignedAgent?.name || 'NULL'} (${c.assignedAgent?.role || 'unassigned'})`);
            });
        }
    }

    // 3. Find all Closer LT users
    console.log('\n👤 Closer LT Users:');
    const closerLtUsers = await prisma.user.findMany({
        where: {
            OR: [
                { role: 'closer_lt' },
                { pipelineType: 'low_ticket' }
            ]
        },
        select: { id: true, name: true, role: true, pipelineType: true, isActive: true }
    });
    closerLtUsers.forEach(u => console.log(`  - ${u.name} | role: ${u.role} | pipeline: ${u.pipelineType} | active: ${u.isActive}`));

    // 4. Check active conversations visible to all users
    console.log('\n📬 Active Conversations (status != closed):');
    const activeConvs = await prisma.conversation.findMany({
        where: { status: { not: 'closed' } },
        include: {
            lead: { select: { name: true, phone: true } },
            assignedAgent: { select: { name: true } }
        }
    });
    activeConvs.forEach(c => {
        console.log(`  - Lead: ${c.lead.name} | Pipeline: ${c.pipeline} | Status: ${c.status} | Agent: ${c.assignedAgent?.name || 'QUEUE'}`);
    });

    await prisma.$disconnect();
}

main().catch(console.error);
