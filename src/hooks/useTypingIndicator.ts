// useTypingIndicator - Firebase Realtime DB hook for typing status
// Replaces Socket.io typing events

import { useEffect, useState, useCallback, useRef } from 'react';
import { ref, onValue, set, onDisconnect } from '../lib/firebase';
import { realtimeDb } from '../lib/firebase';

/**
 * Hook to manage typing indicators for a conversation
 */
export function useTypingIndicator(conversationId: string | null, currentUserId: string | null) {
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for typing status changes
    useEffect(() => {
        if (!conversationId) return;

        const typingRef = ref(realtimeDb, `conversations/${conversationId}/typing`);

        const unsubscribe = onValue(typingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Filter out current user and get users who are typing
                const typing = Object.entries(data)
                    .filter(([uid, isTyping]) => isTyping && uid !== currentUserId)
                    .map(([uid]) => uid);
                setTypingUsers(typing);
            } else {
                setTypingUsers([]);
            }
        });

        return () => unsubscribe();
    }, [conversationId, currentUserId]);

    // Set typing status for current user
    const setTyping = useCallback((isTyping: boolean) => {
        if (!conversationId || !currentUserId) return;

        const userTypingRef = ref(realtimeDb, `conversations/${conversationId}/typing/${currentUserId}`);

        // Set typing status
        set(userTypingRef, isTyping);

        // Clear any existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Auto-clear typing after 3 seconds
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                set(userTypingRef, false);
            }, 3000);
        }
    }, [conversationId, currentUserId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Clear typing status when leaving
            if (conversationId && currentUserId) {
                const userTypingRef = ref(realtimeDb, `conversations/${conversationId}/typing/${currentUserId}`);
                set(userTypingRef, false);
            }
        };
    }, [conversationId, currentUserId]);

    return { typingUsers, setTyping, isAnyoneTyping: typingUsers.length > 0 };
}
