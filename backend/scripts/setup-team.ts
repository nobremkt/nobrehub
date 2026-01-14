import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Default password for all users (they should change on first login)
const DEFAULT_PASSWORD = 'nobre2026';

const teamMembers = [
    // Administradores
    { name: 'Rogerio', email: 'rogerio@nobremarketing.com.br', role: 'admin', pipelineType: null },
    { name: 'Michele', email: 'michele@nobremarketing.com.br', role: 'admin', pipelineType: null },
    { name: 'Caio', email: 'caio@nobremarketing.com.br', role: 'admin', pipelineType: null },
    { name: 'Camila', email: 'camila@nobremarketing.com.br', role: 'admin', pipelineType: null },

    // High Ticket Closers
    { name: 'Ana Julia', email: 'anajulia@nobremarketing.com.br', role: 'closer_ht', pipelineType: 'high_ticket' },
    { name: 'João Bartholo', email: 'joaobartholo@nobremarketing.com.br', role: 'closer_ht', pipelineType: 'high_ticket' },

    // Low Ticket Closers - Jaqueline é líder (manager_sales)
    { name: 'Jaqueline', email: 'jaqueline@nobremarketing.com.br', role: 'manager_sales', pipelineType: 'low_ticket' },
    { name: 'Beatriz', email: 'beatriz@nobremarketing.com.br', role: 'closer_lt', pipelineType: 'low_ticket' },
    { name: 'Carla', email: 'carla@nobremarketing.com.br', role: 'closer_lt', pipelineType: 'low_ticket' },
    { name: 'João Vitor', email: 'joaovitor@nobremarketing.com.br', role: 'closer_lt', pipelineType: 'low_ticket' },
    { name: 'Julia', email: 'julia@nobremarketing.com.br', role: 'closer_lt', pipelineType: 'low_ticket' },

    // Pós-Vendas - todos com role post_sales
    { name: 'Fernanda', email: 'fernanda@nobremarketing.com.br', role: 'post_sales', pipelineType: null },
    { name: 'Letícia', email: 'leticia@nobremarketing.com.br', role: 'post_sales', pipelineType: null },
    { name: 'Miriã', email: 'miria@nobremarketing.com.br', role: 'post_sales', pipelineType: null },
];

async function main() {
    console.log('🗑️ Deleting ALL existing users...\n');

    // Delete all conversations and queue entries first (foreign key dependencies)
    await prisma.queue.deleteMany({});
    console.log('   Cleared queue entries');

    await prisma.conversation.deleteMany({});
    console.log('   Cleared conversations');

    // Now delete all users
    const deleted = await prisma.user.deleteMany({});
    console.log(`   Deleted ${deleted.count} users\n`);

    console.log('🚀 Creating new team...\n');

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const member of teamMembers) {
        try {
            await prisma.user.create({
                data: {
                    name: member.name,
                    email: member.email,
                    passwordHash: hashedPassword,
                    role: member.role as any,
                    pipelineType: member.pipelineType as any,
                    isActive: true,
                    maxConcurrentChats: 5
                }
            });
            console.log(`✅ ${member.name} (${member.role}) - ${member.email}`);
        } catch (error: any) {
            console.error(`❌ Error with ${member.name}: ${error.message}`);
        }
    }

    console.log('\n✅ Team setup complete!');
    console.log(`   Total: ${teamMembers.length} members`);
    console.log(`   Default password: ${DEFAULT_PASSWORD}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
