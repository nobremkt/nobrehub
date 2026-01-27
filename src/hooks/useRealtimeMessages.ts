// useRealtimeMessages - Firebase Realtime DB hook for instant message sync
// Replaces Socket.io conversation subscriptions

import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set } from '../lib/firebase';
import { realtimeDb } from '../lib/firebase';

export interface RealtimeMessage {
    id: string;
    content: string;
    sender: string;
    direction: 'in' | 'out';
    timestamp: number;
    conversationId?: string;
}

/**
 * Hook to listen for new messages in a conversation via Firebase Realtime DB
 * This replaces the Socket.io subscription pattern
 */
export function useRealtimeMessages(conversationId: string | null) {
    const [newMessage, setNewMessage] = useState<RealtimeMessage | null>(null);
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        if (!conversationId) {
            setIsListening(false);
            return;
        }

        console.log(`🔥 Firebase: Subscribing to conversation ${conversationId}`);
        setIsListening(true);

        const messageRef = ref(realtimeDb, `conversations/${conversationId}/newMessage`);

        const unsubscribe = onValue(messageRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log(`🔥 Firebase: New message received for ${conversationId}:`, data);
                setNewMessage({
                    id: data.id || snapshot.key!,
                    content: data.content,
                    sender: data.sender,
                    direction: data.direction,
                    timestamp: data.timestamp || Date.now(),
                    conversationId
                });
            }
        }, (error) => {
            console.error(`🔥 Firebase: Error listening to ${conversationId}:`, error);
            setIsListening(false);
        });

        return () => {
            console.log(`🔥 Firebase: Unsubscribing from conversation ${conversationId}`);
            unsubscribe();
            setIsListening(false);
        };
    }, [conversationId]);

    // Reset message after it's been processed
    const clearNewMessage = useCallback(() => {
        setNewMessage(null);
    }, []);

    return { newMessage, isListening, clearNewMessage };
}

/**
 * Hook to listen for multiple conversations (for Inbox/Kanban views)
 */
export function useRealtimeConversations(conversationIds: string[]) {
    const [messages, setMessages] = useState<Map<string, RealtimeMessage>>(new Map());

    useEffect(() => {
        if (!conversationIds.length) return;

        const unsubscribes: (() => void)[] = [];

        conversationIds.forEach(convId => {
            const messageRef = ref(realtimeDb, `conversations/${convId}/newMessage`);

            const unsubscribe = onValue(messageRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setMessages(prev => {
                        const updated = new Map(prev);
                        updated.set(convId, {
                            id: data.id || snapshot.key!,
                            content: data.content,
                            sender: data.sender,
                            direction: data.direction,
                            timestamp: data.timestamp || Date.now(),
                            conversationId: convId
                        });
                        return updated;
                    });
                }
            });

            unsubscribes.push(unsubscribe);
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [JSON.stringify(conversationIds)]);

    return { messages };
}
