/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES INBOX SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Serviço para buscar conversas do contexto pós-venda
 * Now reads from Firestore (conversations collection)
 */

import { getFirestoreDb } from '@/config/firebase';
import {
    collection,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { Conversation } from '@/features/inbox/types';

const COL_CONVERSATIONS = 'conversations';

export const PostSalesInboxService = {
    /**
     * Subscribe to post-sales conversations for a specific attendant.
     * Filters by context === 'post_sales' and assignedTo === postSalesId
     */
    subscribeToConversations: (
        postSalesId: string | null,
        callback: (conversations: Conversation[]) => void
    ) => {
        const db = getFirestoreDb();

        // Build query constraints
        const constraints = [
            where('context', '==', 'post_sales'),
            where('status', '==', 'open'),
        ];

        if (postSalesId) {
            constraints.push(where('assignedTo', '==', postSalesId));
        }

        const q = query(
            collection(db, COL_CONVERSATIONS),
            ...constraints,
            orderBy('updatedAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            let conversations: Conversation[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
                    createdAt: data.createdAt?.toMillis?.() || data.createdAt || 0,
                } as Conversation;
            });

            // If postSalesId is null, filter to unassigned only (distribution queue)
            if (!postSalesId) {
                conversations = conversations.filter(conv => !conv.assignedTo);
            }

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
        const db = getFirestoreDb();
        const conversationRef = doc(db, COL_CONVERSATIONS, conversationId);

        await updateDoc(conversationRef, {
            assignedTo: postSalesId,
            postSalesId: postSalesId,
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Get count of post-sales conversations per attendant.
     */
    getConversationCounts: (
        callback: (counts: Record<string, number>) => void
    ) => {
        const db = getFirestoreDb();

        const q = query(
            collection(db, COL_CONVERSATIONS),
            where('context', '==', 'post_sales'),
            where('status', '==', 'open')
        );

        return onSnapshot(q, (snapshot) => {
            const counts: Record<string, number> = {};

            snapshot.docs.forEach((docSnap) => {
                const conv = docSnap.data();
                if (conv.assignedTo) {
                    counts[conv.assignedTo] = (counts[conv.assignedTo] || 0) + 1;
                }
            });

            callback(counts);
        });
    }
};
