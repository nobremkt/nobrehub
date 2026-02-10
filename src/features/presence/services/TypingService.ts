/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPING SERVICE (RTDB)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Serviço de indicador de digitação em tempo real usando Firebase RTDB.
 *
 * Estrutura RTDB:
 *   /typing/{chatId}/{userId} = { name: "Beatriz", timestamp: 1707500000 }
 *
 * - Entradas são auto-removidas via onDisconnect
 * - Entradas com timestamp > STALE_THRESHOLD são ignoradas (fallback)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    ref,
    set,
    remove,
    onValue,
    onDisconnect,
    off,
} from 'firebase/database';
import { getRealtimeDb } from '@/config/firebase';

const TYPING_PATH = 'typing';

/** Entries older than this (ms) are considered stale and filtered out */
const STALE_THRESHOLD = 5000;

export interface TypingUser {
    userId: string;
    name: string;
    timestamp: number;
}

export const TypingService = {
    /**
     * Mark current user as typing in a chat.
     * Registers onDisconnect to auto-cleanup if browser closes.
     */
    async startTyping(chatId: string, userId: string, displayName: string): Promise<void> {
        const rtdb = getRealtimeDb();
        const typingRef = ref(rtdb, `${TYPING_PATH}/${chatId}/${userId}`);

        await set(typingRef, {
            name: displayName,
            timestamp: Date.now(),
        });

        // Auto-remove on disconnect (tab close, network drop)
        onDisconnect(typingRef).remove();
    },

    /**
     * Remove current user's typing indicator.
     */
    async stopTyping(chatId: string, userId: string): Promise<void> {
        const rtdb = getRealtimeDb();
        const typingRef = ref(rtdb, `${TYPING_PATH}/${chatId}/${userId}`);
        await remove(typingRef);
    },

    /**
     * Subscribe to typing users in a chat.
     * Filters out the current user and stale entries.
     * Returns unsubscribe function.
     */
    subscribeToTyping(
        chatId: string,
        currentUserId: string,
        callback: (typingUsers: TypingUser[]) => void
    ): () => void {
        const rtdb = getRealtimeDb();
        const chatTypingRef = ref(rtdb, `${TYPING_PATH}/${chatId}`);

        const handleValue = (snapshot: any) => {
            if (!snapshot.exists()) {
                callback([]);
                return;
            }

            const data = snapshot.val();
            const now = Date.now();
            const users: TypingUser[] = [];

            for (const [uid, entry] of Object.entries(data)) {
                const typingEntry = entry as { name: string; timestamp: number };

                // Skip current user and stale entries
                if (uid === currentUserId) continue;
                if (now - typingEntry.timestamp > STALE_THRESHOLD) continue;

                users.push({
                    userId: uid,
                    name: typingEntry.name,
                    timestamp: typingEntry.timestamp,
                });
            }

            callback(users);
        };

        onValue(chatTypingRef, handleValue);

        return () => {
            off(chatTypingRef, 'value', handleValue);
        };
    },
};
