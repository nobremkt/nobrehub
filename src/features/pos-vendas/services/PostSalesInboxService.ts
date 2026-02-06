/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES INBOX SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Serviço para buscar conversas do contexto pós-venda
 */

import { getRealtimeDb } from '@/config/firebase';
import { ref, onValue, query, orderByChild, update, serverTimestamp } from 'firebase/database';
import { Conversation } from '@/features/inbox/types';

const DB_PATHS = {
    CONVERSATIONS: 'conversations',
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
        const db = getRealtimeDb();
        const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS);
        const q = query(conversationsRef, orderByChild('updatedAt'));

        return onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }

            const conversations: Conversation[] = Object.keys(data)
                .map((key) => ({
                    id: key,
                    ...data[key],
                }))
                // Filter by post_sales context
                .filter((conv) => conv.context === 'post_sales')
                // Filter by assigned to this post-sales attendant (or unassigned for distribution)
                .filter((conv) =>
                    postSalesId
                        ? conv.assignedTo === postSalesId
                        : !conv.assignedTo // Unassigned = distribution queue
                )
                // Only open conversations
                .filter((conv) => conv.status === 'open')
                .sort((a, b) => {
                    const timeA = a.lastMessage?.timestamp || 0;
                    const timeB = b.lastMessage?.timestamp || 0;
                    return timeB - timeA;
                });

            callback(conversations);
        });
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
        const db = getRealtimeDb();
        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);

        await update(conversationRef, {
            assignedTo: postSalesId,
            postSalesId: postSalesId,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Get count of post-sales conversations per attendant.
     */
    getConversationCounts: (
        callback: (counts: Record<string, number>) => void
    ) => {
        const db = getRealtimeDb();
        const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS);

        return onValue(conversationsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback({});
                return;
            }

            const counts: Record<string, number> = {};

            Object.values(data).forEach((conv: any) => {
                if (conv.context === 'post_sales' && conv.assignedTo && conv.status === 'open') {
                    counts[conv.assignedTo] = (counts[conv.assignedTo] || 0) + 1;
                }
            });

            callback(counts);
        });
    }
};
