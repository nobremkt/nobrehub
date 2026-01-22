import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // List all users with password info
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            supabaseId: true,
            role: true
        }
    });

    console.log('\n=== ALL USERS ===');
    users.forEach(u => {
        console.log({
            id: u.id,
            name: u.name,
            email: u.email,
            hasPassword: !!u.passwordHash,
            passwordLength: u.passwordHash?.length || 0,
            supabaseId: u.supabaseId,
            role: u.role
        });
    });

    // Try to set password for caio@nobremarketing.com.br
    const caio = users.find(u => u.email === 'caio@nobremarketing.com.br');
    if (caio) {
        const hash = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
            where: { id: caio.id },
            data: { passwordHash: hash, role: 'admin' }
        });
        console.log('\n✅ Password for caio@nobremarketing.com.br set to: admin123');
        console.log('✅ Role set to: admin');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
