/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Inbox Seeder — DEV ONLY
 * Seeds the inbox database with mock conversations and messages.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';

export async function seedInboxDatabase(): Promise<void> {
    // Guard — block in production
    if (import.meta.env.PROD) {
        console.warn('[InboxSeeder] seedDatabase blocked in production');
        return;
    }

    const mocks = [
        {
            name: 'João Silva',
            phone: '11999999999',
            email: 'joao.silva@empresaA.com',
            channel: 'whatsapp',
            unread_count: 2,
            status: 'open',
            tags: ['Interessado', 'Quente', 'Novo Lead'],
            notes: 'Cliente interessado no plano anual.',
            messages: [
                { content: 'Olá, gostaria de saber mais sobre o serviço.', sender_type: 'lead' },
                { content: 'Claro, João! Como posso ajudar?', sender_type: 'agent' },
                { content: 'Vocês fazem desenvolvimento web?', sender_type: 'lead' }
            ]
        },
        {
            name: 'Maria Oliveira',
            phone: '11888888888',
            email: 'maria@techsolutions.com.br',
            channel: 'instagram',
            unread_count: 0,
            status: 'closed',
            tags: ['Cliente Antigo', 'Suporte'],
            notes: 'Dúvida técnica resolvida.',
            messages: [
                { content: 'Obrigado pelo atendimento!', sender_type: 'lead' },
                { content: 'Por nada! Conte conosco.', sender_type: 'agent' }
            ]
        },
        {
            name: 'Carlos Pereira',
            phone: '11777777777',
            email: 'contact@agenciaxyz.com',
            channel: 'whatsapp',
            unread_count: 0,
            status: 'open',
            tags: ['Parceria', 'Frio'],
            notes: 'Agência buscando parceria.',
            messages: [
                { content: 'Quanto custa o plano mensal?', sender_type: 'lead' }
            ]
        }
    ];

    for (const mock of mocks) {
        const now = new Date().toISOString();

        // Create Conversation
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .insert({
                lead_id: null,
                name: mock.name,
                phone: mock.phone,
                email: mock.email,
                tags: mock.tags || [],
                notes: mock.notes || '',
                unread_count: mock.unread_count,
                channel: mock.channel,
                status: mock.status,
                context: 'sales',
                last_message_preview: null,
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (convError || !convData) continue;

        // Create Messages
        let lastContent: string | null = null;
        let lastTimestamp = now;

        for (const [index, msg] of mock.messages.entries()) {
            const timestamp = new Date(Date.now() - (1000 * 60 * (mock.messages.length - index))).toISOString();

            await supabase
                .from('messages')
                .insert({
                    conversation_id: convData.id,
                    content: msg.content,
                    sender_id: null, // No real user IDs in seed data
                    sender_type: msg.sender_type,
                    status: 'read',
                    type: 'text',
                    created_at: timestamp,
                });

            lastContent = msg.content;
            lastTimestamp = timestamp;
        }

        // Update conversation with lastMessage
        if (lastContent) {
            await supabase
                .from('conversations')
                .update({
                    last_message_preview: lastContent,
                    last_message_at: lastTimestamp,
                    updated_at: lastTimestamp,
                })
                .eq('id', convData.id);
        }
    }

    console.log('Database seeded successfully!');
}
