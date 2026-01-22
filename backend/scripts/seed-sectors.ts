import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultSectors = [
    { name: 'Vendas HT', description: 'Equipe de vendas High Ticket', color: '#f43f5e' },
    { name: 'Vendas LT', description: 'Equipe de vendas Low Ticket', color: '#ec4899' },
    { name: 'Produção', description: 'Equipe de produção e entregas', color: '#3b82f6' },
    { name: 'Pós-Venda', description: 'Equipe de pós-venda e sucesso do cliente', color: '#f59e0b' },
    { name: 'Administração', description: 'Equipe administrativa', color: '#8b5cf6' }
];

async function main() {
    console.log('🌱 Seeding sectors...');

    for (const sector of defaultSectors) {
        const existing = await prisma.sector.findUnique({
            where: { name: sector.name }
        });

        if (!existing) {
            await prisma.sector.create({
                data: {
                    ...sector,
                    isActive: true
                }
            });
            console.log(`✅ Created sector: ${sector.name}`);
        } else {
            console.log(`ℹ️ Sector already exists: ${sector.name}`);
        }
    }

    console.log('\n🔍 Checking users...');
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in the database.`);

    if (userCount === 0) {
        console.log('⚠️ Warning: No users found in public.User table. Application usually requires syncing Supabase Auth users to public.User table.');
    } else {
        const users = await prisma.user.findMany({ select: { name: true, role: true, isActive: true } });
        console.log('Users found:', users);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
