// usePresence - Firebase Realtime DB hook for online/offline status
// Replaces Socket.io presence detection

import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from '../lib/firebase';
import { realtimeDb } from '../lib/firebase';

export interface UserPresence {
    online: boolean;
    lastSeen: number | null;
    currentConversation: string | null;
}

/**
 * Hook to manage current user's presence status
 */
export function usePresence(userId: string | null) {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const presenceRef = ref(realtimeDb, `presence/${userId}`);
        const connectedRef = ref(realtimeDb, '.info/connected');

        // Listen for connection state
        const unsubscribe = onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === true) {
                console.log(`🔥 Firebase: User ${userId} is online`);
                setIsOnline(true);

                // Set online status
                set(presenceRef, {
                    online: true,
                    lastSeen: Date.now(),
                    currentConversation: null
                });

                // Set offline status on disconnect
                onDisconnect(presenceRef).set({
                    online: false,
                    lastSeen: Date.now(),
                    currentConversation: null
                });
            } else {
                setIsOnline(false);
            }
        });

        return () => {
            unsubscribe();
            // Mark as offline when component unmounts
            set(presenceRef, {
                online: false,
                lastSeen: Date.now(),
                currentConversation: null
            });
        };
    }, [userId]);

    // Set current conversation
    const setCurrentConversation = useCallback((conversationId: string | null) => {
        if (!userId) return;

        const presenceRef = ref(realtimeDb, `presence/${userId}/currentConversation`);
        set(presenceRef, conversationId);
    }, [userId]);

    return { isOnline, setCurrentConversation };
}

/**
 * Hook to watch another user's presence status
 */
export function useUserPresence(userId: string | null) {
    const [presence, setPresence] = useState<UserPresence | null>(null);

    useEffect(() => {
        if (!userId) {
            setPresence(null);
            return;
        }

        const presenceRef = ref(realtimeDb, `presence/${userId}`);

        const unsubscribe = onValue(presenceRef, (snapshot) => {
            if (snapshot.exists()) {
                setPresence(snapshot.val());
            } else {
                setPresence({ online: false, lastSeen: null, currentConversation: null });
            }
        });

        return () => unsubscribe();
    }, [userId]);

    return presence;
}

/**
 * Hook to watch multiple users' presence
 */
export function useTeamPresence(userIds: string[]) {
    const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());

    useEffect(() => {
        if (!userIds.length) return;

        const unsubscribes: (() => void)[] = [];

        userIds.forEach(userId => {
            const presenceRef = ref(realtimeDb, `presence/${userId}`);

            const unsubscribe = onValue(presenceRef, (snapshot) => {
                setPresenceMap(prev => {
                    const updated = new Map(prev);
                    if (snapshot.exists()) {
                        updated.set(userId, snapshot.val());
                    } else {
                        updated.set(userId, { online: false, lastSeen: null, currentConversation: null });
                    }
                    return updated;
                });
            });

            unsubscribes.push(unsubscribe);
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [JSON.stringify(userIds)]);

    const onlineUsers = Array.from(presenceMap.entries())
        .filter(([_, p]) => p.online)
        .map(([id]) => id);

    return { presenceMap, onlineUsers, onlineCount: onlineUsers.length };
}
