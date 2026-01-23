import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend folder
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Syncing System Channels...');

    // 1. WhatsApp 360Dialog (System)
    const apiKey = process.env.DIALOG360_API_KEY;
    const wabaId = process.env.DIALOG360_WABA_ID;

    if (apiKey) {
        console.log('✅ Found DIALOG360_API_KEY in env. Creating system channel...');

        await prisma.channel.upsert({
            where: { id: 'system-whatsapp-main' }, // Fixed ID for system channel
            update: {
                name: 'WhatsApp Principal',
                type: 'whatsapp_official',
                status: 'connected',
                isEnabled: true,
                config: {
                    wabaId: wabaId ? `${wabaId.substring(0, 4)}...${wabaId.substring(wabaId.length - 4)}` : 'configured-in-env',
                    provider: '360Dialog'
                }
            },
            create: {
                id: 'system-whatsapp-main',
                name: 'WhatsApp Principal',
                type: 'whatsapp_official',
                status: 'connected',
                isEnabled: true,
                config: {
                    provider: '360Dialog'
                }
            }
        });
        console.log('✨ System WhatsApp Channel synced.');
    } else {
        console.log('⚠️ No DIALOG360_API_KEY found. Skipping WhatsApp sync.');
    }

    // 2. Mock others if needed, but sticking to real env for now.
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
