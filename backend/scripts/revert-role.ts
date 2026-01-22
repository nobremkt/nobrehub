import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Revert role to strategic
    await prisma.user.update({
        where: { email: 'caio@nobremarketing.com.br' },
        data: { role: 'strategic' }
    });
    console.log('✅ Role reverted to: strategic');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
