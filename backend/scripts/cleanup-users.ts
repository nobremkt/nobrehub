// Script to clean up old users and check sectors
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== CURRENT USERS ===');
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    console.table(users);

    console.log('\n=== CURRENT SECTORS ===');
    const sectors = await prisma.sector.findMany({
        select: { id: true, name: true, color: true }
    });
    console.table(sectors);

    // Delete all users except keep one admin if needed
    console.log('\n=== DELETING ALL USERS ===');

    // First, disconnect relations
    await prisma.lead.updateMany({
        where: { assignedTo: { not: null } },
        data: { assignedTo: null }
    });

    // Delete users
    const deleted = await prisma.user.deleteMany({});
    console.log(`Deleted ${deleted.count} users`);

    console.log('\n=== DONE ===');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
