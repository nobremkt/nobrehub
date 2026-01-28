// FirebaseContext - Drop-in replacement for SocketContext
// Provides the same API as SocketContext but uses Firebase Realtime DB

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { ref, onValue, set, push, onDisconnect } from '../lib/firebase';
import { realtimeDb } from '../lib/firebase';

// Event callback types (same as SocketContext)
type MessageCallback = (message: any) => void;
type ConversationCallback = (conversation: any) => void;
type LeadCallback = (lead: any) => void;

interface FirebaseContextType {
    // Compatibility properties
    socket: null; // No socket object in Firebase
    isConnected: boolean;

    // Subscription methods - return unsubscribe function
    subscribeToConversation: (conversationId: string, callback: MessageCallback) => () => void;
    subscribeToNewLeads: (callback: LeadCallback) => () => void;
    subscribeToLeadUpdates: (callback: LeadCallback) => () => void;
    subscribeToNewConversations: (callback: ConversationCallback) => () => void;
    subscribeToConversationUpdates: (callback: ConversationCallback) => () => void;
    subscribeToAssignments: (callback: ConversationCallback) => () => void;
    subscribeToQueue: (callback: (queueItem: any) => void) => () => void;
    subscribeToConversationsData: (callback: (conversations: any[]) => void) => () => void;

    // Emit methods (now write to Firebase)
    sendMessage: (conversationId: string, text: string, userId: string) => void;
    requestConversations: (userId: string) => void;
    joinAsAgent: (userId: string) => void;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

interface FirebaseProviderProps {
    children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Monitor Firebase connection
    useEffect(() => {

        const connectedRef = ref(realtimeDb, '.info/connected');

        const unsubscribe = onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val() === true;
            setIsConnected(connected);
        });

        return () => unsubscribe();
    }, []);

    // Set up presence for current user
    useEffect(() => {
        if (!currentUserId || !isConnected) return;

        const presenceRef = ref(realtimeDb, `presence/${currentUserId}`);

        // Set online
        set(presenceRef, {
            online: true,
            lastSeen: Date.now()
        });

        // Set offline on disconnect
        onDisconnect(presenceRef).set({
            online: false,
            lastSeen: Date.now()
        });

        return () => {
            set(presenceRef, {
                online: false,
                lastSeen: Date.now()
            });
        };
    }, [currentUserId, isConnected]);

    // Join as agent (set current user)
    const joinAsAgent = useCallback((userId: string) => {
        setCurrentUserId(userId);
    }, []);

    // Subscribe to conversation messages
    const subscribeToConversation = useCallback((conversationId: string, callback: MessageCallback) => {

        const messageRef = ref(realtimeDb, `conversations/${conversationId}/newMessage`);

        const unsubscribe = onValue(messageRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                callback({
                    id: data.id,
                    content: data.content,
                    text: data.text || data.content,
                    sender: data.sender,
                    direction: data.direction,
                    status: data.status || 'sent',
                    waMessageId: data.waMessageId,
                    type: data.type || 'text',
                    timestamp: data.timestamp,
                    createdAt: data.createdAt || new Date(data.timestamp || Date.now()).toISOString(),
                    conversationId
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Subscribe to new leads
    const subscribeToNewLeads = useCallback((callback: LeadCallback) => {

        const leadsRef = ref(realtimeDb, `leads/new`);

        const unsubscribe = onValue(leadsRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to lead updates
    const subscribeToLeadUpdates = useCallback((callback: LeadCallback) => {

        const leadsRef = ref(realtimeDb, `leads/updates`);

        const unsubscribe = onValue(leadsRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to new conversations
    const subscribeToNewConversations = useCallback((callback: ConversationCallback) => {

        const convsRef = ref(realtimeDb, `conversationsUpdates/new`);

        const unsubscribe = onValue(convsRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to conversation updates
    const subscribeToConversationUpdates = useCallback((callback: ConversationCallback) => {

        const convsRef = ref(realtimeDb, `conversationsUpdates/updated`);

        const unsubscribe = onValue(convsRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to assignments
    const subscribeToAssignments = useCallback((callback: ConversationCallback) => {

        const assignRef = ref(realtimeDb, `conversationsUpdates/assigned`);

        const unsubscribe = onValue(assignRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to queue updates
    const subscribeToQueue = useCallback((callback: (queueItem: any) => void) => {

        const queueRef = ref(realtimeDb, `queue`);

        const unsubscribe = onValue(queueRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to conversations data
    const subscribeToConversationsData = useCallback((callback: (conversations: any[]) => void) => {
        // This would typically come from the API, not realtime
        // For now, return empty unsubscribe
        return () => { };
    }, []);

    // Send message (write to Firebase, backend will process)
    const sendMessage = useCallback((conversationId: string, text: string, userId: string) => {

        // Write to a "pending messages" location that backend will process
        // Or call API directly - this is just for compatibility
        const pendingRef = ref(realtimeDb, `pendingMessages/${conversationId}`);
        push(pendingRef, {
            text,
            userId,
            timestamp: Date.now()
        });
    }, []);

    // Request conversations (no-op, use API instead)
    const requestConversations = useCallback((userId: string) => {
    }, []);

    const value: FirebaseContextType = {
        socket: null,
        isConnected,
        subscribeToConversation,
        subscribeToNewLeads,
        subscribeToLeadUpdates,
        subscribeToNewConversations,
        subscribeToConversationUpdates,
        subscribeToAssignments,
        subscribeToQueue,
        subscribeToConversationsData,
        sendMessage,
        requestConversations,
        joinAsAgent
    };

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
}

// Hook to use Firebase context
export function useFirebaseContext(): FirebaseContextType {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebaseContext must be used within a FirebaseProvider');
    }
    return context;
}

export function useFirebase(options?: { userId?: string }) {
    const context = useFirebaseContext();

    useEffect(() => {
        if (options?.userId) {
            context.joinAsAgent(options.userId);
        }
    }, [options?.userId, context.joinAsAgent]);

    return context;
}
