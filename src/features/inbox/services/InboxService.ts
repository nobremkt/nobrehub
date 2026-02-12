/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - INBOX SERVICE (SUPABASE)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * All data in Supabase PostgreSQL:
 *   conversations              → Conversation metadata
 *   messages                   → Messages (FK conversation_id)
 *   settings (key-value)       → Distribution config (via SettingsService or inline)
 *
 * Real-time via Supabase Realtime (postgres_changes).
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { Conversation, Message } from '../types';
import { useSettingsStore } from '../../settings/stores/useSettingsStore';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS — row ↔ frontend type mapping
// ═══════════════════════════════════════════════════════════════════════════════

const rowToConversation = (row: any): Conversation => ({
    id: row.id,
    leadId: row.lead_id || '',
    leadName: row.name || '',
    leadPhone: row.phone || '',
    leadEmail: row.email || '',
    leadCompany: row.company || '',
    tags: row.tags || [],
    notes: row.notes || '',
    lastMessage: row.last_message_preview
        ? { id: '', conversationId: row.id, content: row.last_message_preview, type: 'text', direction: 'in', status: 'read', createdAt: row.last_message_at ? new Date(row.last_message_at) : new Date() }
        : undefined,
    unreadCount: row.unread_count || 0,
    assignedTo: row.assigned_to || undefined,
    channel: row.channel || 'whatsapp',
    status: row.status || 'open',
    context: row.context || 'sales',
    postSalesId: row.post_sales_id || undefined,
    isFavorite: row.is_favorite || false,
    isPinned: row.is_pinned || false,
    isBlocked: row.is_blocked || false,
    profilePicUrl: row.profile_pic_url || undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
});

const rowToMessage = (row: any): Message => ({
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content || '',
    type: row.type || 'text',
    direction: row.sender_type === 'agent' ? 'out' : 'in',
    status: row.status || 'sent',
    senderId: row.sender_id || undefined,
    mediaUrl: row.media_url || undefined,
    mediaName: row.metadata?.mediaName || undefined,
    viewOnce: row.metadata?.viewOnce || undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
});

export const InboxService = {
    /**
     * Subscribe to the list of conversations.
     */
    subscribeToConversations: (callback: (conversations: Conversation[]) => void) => {
        // 1. Initial fetch
        const fetchConversations = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[InboxService] Error fetching conversations:', error);
                return;
            }
            callback((data || []).map(rowToConversation));
        };

        fetchConversations();

        // 2. Realtime channel
        const channel = supabase
            .channel('inbox-conversations')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => { fetchConversations(); }
            )
            .subscribe();

        // 3. Cleanup
        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Subscribe to messages for a specific conversation.
     */
    subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void) => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) {
                console.error('[InboxService] Error fetching messages:', error);
                return;
            }
            callback((data || []).map(rowToMessage));
        };

        fetchMessages();

        const channel = supabase
            .channel(`inbox-messages-${conversationId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                () => { fetchMessages(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Subscribe to a conversation by leadId.
     * Used by post-sales to find the conversation associated with a client.
     */
    subscribeToConversationByLeadId: (
        leadId: string,
        callback: (conversation: Conversation | null) => void
    ) => {
        const fetchConversation = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('lead_id', leadId)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('[InboxService] Error fetching conversation by leadId:', error);
                callback(null);
                return;
            }
            callback(data ? rowToConversation(data) : null);
        };

        fetchConversation();

        const channel = supabase
            .channel(`inbox-conv-lead-${leadId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'conversations', filter: `lead_id=eq.${leadId}` },
                () => { fetchConversation(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Create a new conversation for a lead.
     * Used when navigating from Kanban/Lead360 and no existing conversation exists.
     */
    createConversation: async (leadData: {
        leadId?: string;
        leadName: string;
        leadPhone: string;
        leadEmail?: string;
        leadCompany?: string;
        tags?: string[];
    }): Promise<string> => {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                lead_id: leadData.leadId || `lead_${Date.now()}`,
                name: leadData.leadName,
                phone: leadData.leadPhone,
                email: leadData.leadEmail || '',
                tags: leadData.tags || [],
                notes: '',
                unread_count: 0,
                channel: 'whatsapp',
                status: 'open',
                context: 'sales',
                last_message_preview: null,
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Send a new message.
     */
    sendMessage: async (conversationId: string, text: string, senderId: string = 'agent') => {
        const now = new Date().toISOString();

        // 0. Get Conversation Details (to get phone number)
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (convError || !convData) throw new Error('Conversation not found');

        // 1. Create message in messages table
        const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                content: text,
                sender_id: senderId,
                sender_type: 'agent',
                status: 'pending',
                type: 'text',
                created_at: now,
            })
            .select('id')
            .single();

        if (msgError) throw msgError;
        const messageId = msgData.id;

        // 2. Update conversation lastMessage + unreadCount
        await supabase
            .from('conversations')
            .update({
                last_message_preview: text,
                last_message_at: now,
                unread_count: 0,
                updated_at: now,
            })
            .eq('id', conversationId);

        // 3. Send to WhatsApp (if configured)
        const { whatsapp } = useSettingsStore.getState();

        if (whatsapp.provider === '360dialog' && whatsapp.apiKey && whatsapp.baseUrl && convData.phone) {
            try {
                const phone = convData.phone.replace(/\D/g, '');

                const response = await fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apiKey: whatsapp.apiKey,
                        baseUrl: whatsapp.baseUrl,
                        to: phone,
                        text: text
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('360Dialog Error:', errorData);
                    throw new Error('Failed to send message via WhatsApp');
                }

                const responseData = await response.json();
                const whatsappMessageId = responseData.messages?.[0]?.id;

                // Update status to SENT on success
                await supabase
                    .from('messages')
                    .update({ status: 'sent', whatsapp_message_id: whatsappMessageId })
                    .eq('id', messageId);

            } catch (error) {
                console.error('Failed to send WhatsApp message:', error);
                await supabase
                    .from('messages')
                    .update({ status: 'error' })
                    .eq('id', messageId);
            }
        } else {
            await supabase
                .from('messages')
                .update({ status: 'sent' })
                .eq('id', messageId);
        }

        return messageId;
    },

    /**
     * Helper to update lead phone.
     */
    updateLeadPhone: async (conversationId: string, newPhone: string) => {
        await supabase
            .from('conversations')
            .update({ phone: newPhone })
            .eq('id', conversationId);
    },

    /**
     * Send a template message via WhatsApp.
     */
    sendTemplateMessage: async (
        conversationId: string,
        templateName: string,
        language: string,
        components: any[],
        previewText: string,
        senderId: string = 'agent'
    ) => {
        const now = new Date().toISOString();

        // 0. Get Conversation
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (convError || !convData) throw new Error('Conversation not found');

        // 1. Create message in messages table
        const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                content: previewText,
                sender_id: senderId,
                sender_type: 'agent',
                status: 'pending',
                type: 'template',
                metadata: { templateName },
                created_at: now,
            })
            .select('id')
            .single();

        if (msgError) throw msgError;
        const messageId = msgData.id;

        // Update conversation
        await supabase
            .from('conversations')
            .update({
                last_message_preview: previewText,
                last_message_at: now,
                unread_count: 0,
                updated_at: now,
            })
            .eq('id', conversationId);

        // 2. Send to WhatsApp
        const { whatsapp } = useSettingsStore.getState();

        if (whatsapp.provider === '360dialog' && whatsapp.apiKey && whatsapp.baseUrl && convData.phone) {
            try {
                const phone = convData.phone.replace(/\D/g, '');

                const response = await fetch('/api/send-template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apiKey: whatsapp.apiKey,
                        baseUrl: whatsapp.baseUrl,
                        to: phone,
                        templateName: templateName,
                        language: language,
                        components: components
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('360Dialog Template Error:', errorData);
                    throw new Error('Failed to send template via WhatsApp');
                }

                const responseData = await response.json();
                const whatsappMessageId = responseData.messages?.[0]?.id;

                await supabase
                    .from('messages')
                    .update({ status: 'sent', whatsapp_message_id: whatsappMessageId })
                    .eq('id', messageId);

            } catch (error) {
                console.error('Failed to send WhatsApp template:', error);
                await supabase
                    .from('messages')
                    .update({ status: 'error' })
                    .eq('id', messageId);
            }
        } else {
            await supabase
                .from('messages')
                .update({ status: 'sent' })
                .eq('id', messageId);
        }

        return messageId;
    },

    /**
     * Toggle favorite status for a conversation.
     */
    toggleFavorite: async (conversationId: string) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('is_favorite')
            .eq('id', conversationId)
            .single();

        if (error || !data) return;

        await supabase
            .from('conversations')
            .update({ is_favorite: !data.is_favorite })
            .eq('id', conversationId);
    },

    /**
     * Toggle pinned status for a conversation.
     */
    togglePin: async (conversationId: string) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('is_pinned')
            .eq('id', conversationId)
            .single();

        if (error || !data) return;

        await supabase
            .from('conversations')
            .update({ is_pinned: !data.is_pinned })
            .eq('id', conversationId);
    },

    /**
     * Schedule a message for future delivery.
     */
    scheduleMessage: async (
        conversationId: string,
        content: string,
        scheduledFor: Date,
        senderId: string = 'agent'
    ) => {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                content,
                sender_id: senderId,
                sender_type: 'agent',
                status: 'scheduled',
                type: 'text',
                metadata: { scheduledFor: scheduledFor.toISOString() },
                created_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Send a media message (image, video, audio, document).
     */
    sendMediaMessage: async (
        conversationId: string,
        mediaUrl: string,
        mediaType: 'image' | 'video' | 'audio' | 'document',
        mediaName?: string,
        senderId: string = 'agent',
        viewOnce?: boolean
    ) => {
        const now = new Date().toISOString();

        // 0. Get Conversation
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (convError || !convData) throw new Error('Conversation not found');

        // 1. Create message
        const contentMap = {
            image: '[Imagem]',
            video: '[Vídeo]',
            audio: '[Áudio]',
            document: mediaName || '[Documento]'
        };

        const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                content: contentMap[mediaType],
                sender_id: senderId,
                sender_type: 'agent',
                status: 'pending',
                type: mediaType,
                media_url: mediaUrl,
                metadata: { mediaName, viewOnce: viewOnce || false },
                created_at: now,
            })
            .select('id')
            .single();

        if (msgError) throw msgError;
        const messageId = msgData.id;

        // Update conversation
        await supabase
            .from('conversations')
            .update({
                last_message_preview: contentMap[mediaType],
                last_message_at: now,
                unread_count: 0,
                updated_at: now,
            })
            .eq('id', conversationId);

        // 2. Send to WhatsApp
        const { whatsapp } = useSettingsStore.getState();

        if (whatsapp.provider === '360dialog' && whatsapp.apiKey && whatsapp.baseUrl && convData.phone) {
            try {
                const phone = convData.phone.replace(/\D/g, '');

                const response = await fetch('/api/send-media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apiKey: whatsapp.apiKey,
                        baseUrl: whatsapp.baseUrl,
                        to: phone,
                        mediaType: mediaType,
                        mediaUrl: mediaUrl,
                        caption: mediaName,
                        viewOnce: viewOnce
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('360Dialog Media Error:', errorData);
                    throw new Error('Failed to send media via WhatsApp');
                }

                const responseData = await response.json();
                const whatsappMessageId = responseData.messages?.[0]?.id;

                await supabase
                    .from('messages')
                    .update({ status: 'sent', whatsapp_message_id: whatsappMessageId })
                    .eq('id', messageId);

            } catch (error) {
                console.error('Failed to send WhatsApp media:', error);
                await supabase
                    .from('messages')
                    .update({ status: 'error' })
                    .eq('id', messageId);
            }
        } else {
            await supabase
                .from('messages')
                .update({ status: 'sent' })
                .eq('id', messageId);
        }

        return messageId;
    },

    /**
     * Update diverse conversation details (lead info, tags, notes, etc).
     * Also syncs relevant fields to the corresponding Supabase Lead if leadId exists.
     */
    updateConversationDetails: async (conversationId: string, data: Partial<Conversation>) => {
        // 1. Build conversation update object
        const convUpdates: Record<string, unknown> = {};
        if (data.leadName !== undefined) convUpdates.name = data.leadName;
        if (data.leadPhone !== undefined) convUpdates.phone = data.leadPhone;
        if (data.leadEmail !== undefined) convUpdates.email = data.leadEmail;
        if (data.tags !== undefined) convUpdates.tags = data.tags;
        if (data.notes !== undefined) convUpdates.notes = data.notes;
        if (data.isFavorite !== undefined) convUpdates.is_favorite = data.isFavorite;
        if (data.isPinned !== undefined) convUpdates.is_pinned = data.isPinned;
        convUpdates.updated_at = new Date().toISOString();

        await supabase
            .from('conversations')
            .update(convUpdates)
            .eq('id', conversationId);

        // 2. Get conversation to check for leadId
        const { data: conv } = await supabase
            .from('conversations')
            .select('lead_id')
            .eq('id', conversationId)
            .single();

        // 3. If leadId exists, sync relevant fields to Supabase Lead
        if (conv?.lead_id) {
            try {
                const leadUpdates: Record<string, unknown> = {};

                if (data.leadName !== undefined) leadUpdates.name = data.leadName;
                if (data.leadPhone !== undefined) leadUpdates.phone = data.leadPhone;
                if (data.leadEmail !== undefined) leadUpdates.email = data.leadEmail;
                if (data.leadCompany !== undefined) leadUpdates.company = data.leadCompany;
                if (data.tags !== undefined) leadUpdates.tags = data.tags;
                if (data.notes !== undefined) leadUpdates.notes = data.notes;

                if (Object.keys(leadUpdates).length > 0) {
                    leadUpdates.updated_at = new Date().toISOString();
                    await supabase
                        .from('leads')
                        .update(leadUpdates)
                        .eq('id', conv.lead_id);
                    console.log('[InboxService] Synced conversation changes to Lead:', conv.lead_id);
                }
            } catch (error) {
                console.error('[InboxService] Failed to sync to Lead:', error);
            }
        }
    },

    /**
     * Assign conversation to a team member.
     */
    assignConversation: async (conversationId: string, userId: string | null, updatedBy?: string) => {
        await supabase
            .from('conversations')
            .update({
                assigned_to: userId,
                updated_by: updatedBy || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
    },

    /**
     * Close or reopen a conversation.
     */
    toggleConversationStatus: async (conversationId: string, updatedBy?: string) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('status')
            .eq('id', conversationId)
            .single();

        if (error || !data) return 'open';

        const newStatus = data.status === 'open' ? 'closed' : 'open';

        await supabase
            .from('conversations')
            .update({
                status: newStatus,
                updated_by: updatedBy || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);

        return newStatus;
    },

    /**
     * Transfer conversation to post-sales sector.
     */
    transferToPostSales: async (conversationId: string, updatedBy?: string) => {
        await supabase
            .from('conversations')
            .update({
                context: 'post_sales',
                status: 'open',
                assigned_to: null,
                updated_by: updatedBy || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
    },

    /**
     * Update deal status (won/lost/open).
     * Triggers system message via Postgres trigger.
     */
    updateDealStatus: async (
        conversationId: string,
        dealStatus: 'open' | 'won' | 'lost',
        updatedBy?: string,
        lossReason?: string
    ) => {
        await supabase
            .from('conversations')
            .update({
                deal_status: dealStatus,
                loss_reason: dealStatus === 'lost' ? (lossReason || null) : null,
                updated_by: updatedBy || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
    },

    /**
     * Mark conversation as read.
     */
    markAsRead: async (conversationId: string) => {
        await supabase
            .from('conversations')
            .update({ unread_count: 0 })
            .eq('id', conversationId);
    },

    /**
     * Seeds the database with mock data for testing.
     */
    seedDatabase: async () => {
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
                    lead_id: `mock_${Date.now()}_${Math.random()}`,
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
                        sender_id: msg.sender_type === 'agent' ? 'agent' : 'lead',
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
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // LEAD DISTRIBUTION (Round Robin - Least Loaded)
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Get lead distribution settings.
     * Reads from Supabase settings table or inline config.
     */
    getDistributionSettings: async (): Promise<{
        enabled: boolean;
        mode: 'auto' | 'manual';
        participants: string[];
    }> => {
        // For now, we read from a settings record.
        // This could also be a dedicated table or a Supabase config row.
        const { data, error } = await (supabase as any)
            .from('settings')
            .select('value')
            .eq('key', 'leadDistribution')
            .maybeSingle();

        if (error || !data) {
            return {
                enabled: false,
                mode: 'manual',
                participants: []
            };
        }

        const settings = typeof (data as any).value === 'string' ? JSON.parse((data as any).value) : (data as any).value;
        return settings as {
            enabled: boolean;
            mode: 'auto' | 'manual';
            participants: string[];
        };
    },

    /**
     * Save lead distribution settings.
     */
    saveDistributionSettings: async (settings: {
        enabled: boolean;
        mode: 'auto' | 'manual';
        participants: string[];
    }): Promise<void> => {
        await (supabase as any)
            .from('settings')
            .upsert({
                key: 'leadDistribution',
                value: settings,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });
    },

    /**
     * Get count of active (open) leads per collaborator.
     */
    getActiveLeadsCount: async (): Promise<Record<string, number>> => {
        const { data, error } = await supabase
            .from('conversations')
            .select('assigned_to')
            .neq('status', 'closed');

        if (error) throw error;

        const counts: Record<string, number> = {};
        (data || []).forEach((row) => {
            if (row.assigned_to) {
                counts[row.assigned_to] = (counts[row.assigned_to] || 0) + 1;
            }
        });

        return counts;
    },

    /**
     * Get the next collaborator to assign based on "Least Loaded" strategy.
     */
    getNextCollaborator: async (participants: string[]): Promise<string | null> => {
        if (!participants || participants.length === 0) {
            return null;
        }

        const counts = await InboxService.getActiveLeadsCount();

        const participantCounts = participants.map(id => ({
            id,
            count: counts[id] || 0
        }));

        participantCounts.sort((a, b) => a.count - b.count);

        return participantCounts[0]?.id || null;
    },

    /**
     * Distribute all unassigned leads to participants.
     */
    distributeUnassignedLeads: async (): Promise<{ distributed: number; errors: number }> => {
        const settings = await InboxService.getDistributionSettings();

        if (!settings.enabled || settings.participants.length === 0) {
            return { distributed: 0, errors: 0 };
        }

        // Get all unassigned open conversations
        const { data, error } = await supabase
            .from('conversations')
            .select('id')
            .neq('status', 'closed')
            .is('assigned_to', null);

        if (error) throw error;

        const unassigned = (data || []).map(row => row.id);

        let distributed = 0;
        let errors = 0;

        for (const conversationId of unassigned) {
            try {
                const nextCollaborator = await InboxService.getNextCollaborator(settings.participants);
                if (nextCollaborator) {
                    await InboxService.assignConversation(conversationId, nextCollaborator);
                    distributed++;
                }
            } catch (error) {
                console.error(`Error distributing conversation ${conversationId}:`, error);
                errors++;
            }
        }

        return { distributed, errors };
    }
};
