import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with team from fluxo_operacional.md...');

    // Clear existing data (order matters for FK constraints)
    await prisma.interaction.deleteMany();
    await (prisma as any).message?.deleteMany?.() || console.log('(no messages table)');
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany();

    const password = await hash('admin123', 10);

    // Create Admin/CEO (Launchpad Access to All)
    await prisma.user.create({
        data: {
            email: 'admin@nobremarketing.com',
            passwordHash: password,
            name: 'Rogerio Nobre', // CEO
            role: 'admin',
            isActive: true
        }
    });
    console.log('✅ CEO: Rogerio Nobre');

    // === SALES DEPARTMENT ===
    // 1. Manager Sales (Launchpad: Vendas)
    await prisma.user.create({
        data: {
            email: 'jaqueline@nobremarketing.com',
            passwordHash: password,
            name: 'Jaqueline',
            role: 'manager_sales',
            pipelineType: 'sales',
            isActive: true
        }
    });
    console.log('✅ Manager Sales: Jaqueline');

    // 2. Closers (High Ticket / Sales Pipeline)
    for (const closer of ['Ana Julia', 'João Bartholo']) {
        await prisma.user.create({
            data: {
                email: `${closer.toLowerCase().replace(/\s/g, '')}@nobremarketing.com`,
                passwordHash: password,
                name: closer,
                role: 'closer_ht',
                pipelineType: 'sales',
                isActive: true
            }
        });
        console.log('✅ Closer:', closer);
    }

    // === PRODUCTION DEPARTMENT ===
    // 1. Manager Production (Launchpad: Produção)
    await prisma.user.create({
        data: {
            email: 'willian@nobremarketing.com',
            passwordHash: password,
            name: 'Willian',
            role: 'manager_production',
            pipelineType: 'production',
            isActive: true
        }
    });
    console.log('✅ Manager Production: Willian');

    // 2. Editors (Production Pipeline)
    for (const editor of ['Caio A.', 'Demetrio', 'Fernanda', 'Gabriel', 'Gustavo']) {
        await prisma.user.create({
            data: {
                email: `${editor.toLowerCase().replace(/[^a-z]/g, '')}@nobremarketing.com`,
                passwordHash: password,
                name: editor,
                role: 'production',
                pipelineType: 'production',
                isActive: true
            }
        });
        console.log('✅ Production:', editor);
    }

    // === POST-SALES DEPARTMENT ===
    await prisma.user.create({
        data: {
            email: 'leticia@nobremarketing.com',
            passwordHash: password,
            name: 'Leticia',
            role: 'post_sales',
            pipelineType: 'post_sales',
            isActive: true
        }
    });
    console.log('✅ Post-Sales: Leticia');

    // === STRATEGIC DEPARTMENT ===
    await prisma.user.create({
        data: {
            email: 'caio@nobremarketing.com',
            passwordHash: password,
            name: 'Caio',
            role: 'strategic',
            isActive: true
        }
    });
    console.log('✅ Strategic: Caio');

    console.log('🎉 Hub Seeding Completed!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
