import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== USERS ===');
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
    });
    console.log(users.length === 0 ? 'NO USERS FOUND!' : JSON.stringify(users, null, 2));

    console.log('\n=== CONVERSATIONS ===');
    const convs = await prisma.conversation.findMany({
        select: { id: true, status: true, leadId: true },
        take: 5
    });
    console.log(convs.length === 0 ? 'NO CONVERSATIONS!' : JSON.stringify(convs, null, 2));

    console.log('\n=== LEADS ===');
    const leads = await prisma.lead.findMany({
        select: { id: true, name: true, phone: true },
        take: 5
    });
    console.log(leads.length === 0 ? 'NO LEADS!' : JSON.stringify(leads, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
