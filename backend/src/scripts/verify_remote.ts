
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load directly from .env.production
dotenv.config({ path: path.join(__dirname, '../../.env.production') });

const prisma = new PrismaClient();

async function check() {
    console.log('🔍 Checking remote database...');
    console.log('URL:', process.env.DATABASE_URL?.replace(/:[^:]+@/, ':****@'));

    try {
        const count = await prisma.user.count();
        console.log(`📊 Total Users: ${count}`);

        const admin = await prisma.user.findUnique({
            where: { email: 'admin@nobremarketing.com' }
        });

        if (admin) {
            console.log('✅ Admin found:', admin.id, admin.email, admin.role);
            console.log('Hash start:', admin.passwordHash.substring(0, 10));
        } else {
            console.log('❌ Admin NOT found!');
        }
    } catch (e: any) {
        console.error('💥 Connection Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
