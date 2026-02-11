/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES INBOX SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Serviço para buscar conversas do contexto pós-venda
 */

import { supabase } from '@/config/supabase';
import { Conversation } from '@/features/inbox/types';

type ConversationRow = {
    id: string;
    lead_id: string | null;
    name: string | null;
    phone: string;
    email: string | null;
    tags: string[] | null;
    notes: string | null;
    unread_count: number | null;
    assigned_to: string | null;
    channel: string | null;
    status: string | null;
    context: string | null;
    post_sales_id: string | null;
    last_message_preview: string | null;
    last_message_at: string | null;
    created_at: string | null;
    updated_at: string | null;
};

const rowToConversation = (row: any): Conversation => {
    const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;

    return {
        id: row.id,
        leadId: row.lead_id ?? '',
        leadName: row.name || '',
        leadPhone: row.phone || '',
        leadEmail: row.email ?? undefined,
        tags: row.tags ?? [],
        notes: row.notes ?? undefined,
        unreadCount: row.unread_count ?? 0,
        assignedTo: row.assigned_to ?? undefined,
        channel: row.channel || 'whatsapp',
        status: row.status || 'open',
        context: row.context || 'post_sales',
        postSalesId: row.post_sales_id ?? undefined,
        lastMessage: row.last_message_preview
            ? {
                id: `preview-${row.id}`,
                conversationId: row.id,
                content: row.last_message_preview,
                type: 'text',
                direction: 'in',
                status: 'read',
                createdAt: row.last_message_at ? new Date(row.last_message_at) : new Date(),
            }
            : undefined,
        createdAt: createdAt as unknown as Date,
        updatedAt: updatedAt as unknown as Date,
    } as Conversation;
};

const fetchConversations = async (postSalesId: string | null): Promise<Conversation[]> => {
    let query = supabase
        .from('conversations')
        .select('*')
        .eq('context', 'post_sales')
        .eq('status', 'open')
        .order('updated_at', { ascending: false });

    if (postSalesId) {
        query = query.eq('assigned_to', postSalesId);
    } else {
        query = query.is('assigned_to', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    return ((data as ConversationRow[] | null) || []).map(rowToConversation);
};

const fetchConversationCounts = async (): Promise<Record<string, number>> => {
    const { data, error } = await supabase
        .from('conversations')
        .select('assigned_to')
        .eq('context', 'post_sales')
        .eq('status', 'open');

    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((row: { assigned_to: string | null }) => {
        const assignedTo = row.assigned_to;
        if (!assignedTo) return;
        counts[assignedTo] = (counts[assignedTo] || 0) + 1;
    });

    return counts;
};

export const PostSalesInboxService = {
    /**
     * Subscribe to post-sales conversations for a specific attendant.
     * Filters by context === 'post_sales' and assignedTo === postSalesId
     */
    subscribeToConversations: (
        postSalesId: string | null,
        callback: (conversations: Conversation[]) => void
    ) => {
        const load = async () => {
            const conversations = await fetchConversations(postSalesId);
            callback(conversations);
        };

        load().catch((error) => {
            console.error('Error loading post-sales conversations:', error);
        });

        const channelName = postSalesId
            ? `postsales-inbox-${postSalesId}`
            : 'postsales-inbox-unassigned';

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
                load().catch((error) => {
                    console.error('Error refreshing post-sales conversations:', error);
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Subscribe to unassigned post-sales conversations (distribution queue).
     */
    subscribeToDistributionQueue: (
        callback: (conversations: Conversation[]) => void
    ) => {
        return PostSalesInboxService.subscribeToConversations(null, callback);
    },

    /**
     * Assign a post-sales conversation to an attendant.
     */
    assignConversation: async (conversationId: string, postSalesId: string) => {
        const { error } = await supabase
            .from('conversations')
            .update({
                assigned_to: postSalesId,
                post_sales_id: postSalesId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);

        if (error) throw error;
    },

    /**
     * Get count of post-sales conversations per attendant.
     */
    getConversationCounts: (
        callback: (counts: Record<string, number>) => void
    ) => {
        const loadCounts = async () => {
            const counts = await fetchConversationCounts();
            callback(counts);
        };

        loadCounts().catch((error) => {
            console.error('Error loading post-sales conversation counts:', error);
        });

        const channel = supabase
            .channel('postsales-conversation-counts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
                loadCounts().catch((error) => {
                    console.error('Error refreshing post-sales conversation counts:', error);
                });
            });

        channel.subscribe();

        return () => { supabase.removeChannel(channel); };
    }
};
