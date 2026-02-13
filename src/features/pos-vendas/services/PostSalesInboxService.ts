/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES INBOX SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Serviço para buscar conversas do contexto pós-venda
 * Now reads from Supabase (conversations table)
 */

import { supabase } from '@/config/supabase';
import { Conversation } from '@/features/inbox/types';
import type { Database } from '@/types/supabase';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];

/** Converte row do banco → Conversation */
function rowToConversation(row: ConversationRow): Conversation {
    return {
        id: row.id,
        updatedAt: new Date(row.updated_at || Date.now()),
        createdAt: new Date(row.created_at || Date.now()),
        assignedTo: row.assigned_to ?? undefined,
        leadId: row.lead_id ?? '',
        leadName: row.name || '',
        leadPhone: row.phone || '',
        context: (row.context as Conversation['context']) ?? undefined,
        status: (row.status as Conversation['status']) ?? 'open',
        channel: (row.channel as Conversation['channel']) ?? 'whatsapp',
        postSalesId: row.post_sales_id ?? undefined,
        unreadCount: row.unread_count || 0,
        profilePicUrl: row.profile_pic_url ?? undefined,
        tags: row.tags ?? undefined,
        notes: row.notes ?? undefined,
        isFavorite: row.is_favorite ?? undefined,
        isPinned: row.is_pinned ?? undefined,
        isBlocked: row.is_blocked ?? undefined,
        dealStatus: (row.deal_status as Conversation['dealStatus']) ?? undefined,
        lossReason: row.loss_reason ?? undefined,
    };
}

export const PostSalesInboxService = {
    /**
     * Subscribe to post-sales conversations for a specific attendant.
     * Filters by context === 'post_sales' and assignedTo === postSalesId
     */
    subscribeToConversations: (
        postSalesId: string | null,
        callback: (conversations: Conversation[]) => void
    ) => {
        const fetchConversations = async () => {
            try {
                let query = supabase
                    .from('conversations')
                    .select('*')
                    .eq('context', 'post_sales')
                    .eq('status', 'open')
                    .order('updated_at', { ascending: false });

                if (postSalesId) {
                    query = query.eq('assigned_to', postSalesId);
                }

                const { data, error } = await query;
                if (error) throw error;

                let conversations = (data || []).map(rowToConversation);

                // If postSalesId is null, filter to unassigned only (distribution queue)
                if (!postSalesId) {
                    conversations = conversations.filter(conv => !conv.assignedTo);
                }

                callback(conversations);
            } catch (error) {
                console.error('Error fetching post-sales conversations:', error);
                callback([]);
            }
        };

        // Initial fetch
        fetchConversations();

        // Realtime subscription
        const channel = supabase
            .channel('post_sales_conversations')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: 'context=eq.post_sales',
            }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
        const fetchCounts = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('assigned_to')
                .eq('context', 'post_sales')
                .eq('status', 'open');

            if (error) {
                console.error('Error fetching conversation counts:', error);
                callback({});
                return;
            }

            const counts: Record<string, number> = {};
            (data || []).forEach(row => {
                if (row.assigned_to) {
                    counts[row.assigned_to] = (counts[row.assigned_to] || 0) + 1;
                }
            });

            callback(counts);
        };

        // Initial fetch
        fetchCounts();

        // Realtime
        const channel = supabase
            .channel('post_sales_conversation_counts')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: 'context=eq.post_sales',
            }, () => {
                fetchCounts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
};
