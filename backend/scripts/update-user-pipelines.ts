import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Update user "Caio" to have low_ticket pipeline
    const user = await prisma.user.update({
        where: { id: 'c5c42e67-fd7e-4be2-84e1-6ad4d984c851' },
        data: {
            pipelineType: 'low_ticket'
        }
    });
    console.log('✅ Updated user:', user.name);
    console.log('   Pipeline:', user.pipelineType);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
