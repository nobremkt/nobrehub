import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Event callback types
type MessageCallback = (message: any) => void;
type ConversationCallback = (conversation: any) => void;
type LeadCallback = (lead: any) => void;

interface SocketContextType {
    socket: Socket | null;
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

    // Emit methods
    sendMessage: (conversationId: string, text: string, userId: string) => void;
    requestConversations: (userId: string) => void;
    joinAsAgent: (userId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
    children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Store subscriptions to re-register on reconnect
    const subscriptionsRef = useRef<Map<string, Set<MessageCallback>>>(new Map());
    const agentIdRef = useRef<string | null>(null);

    // Initialize socket connection ONCE
    useEffect(() => {
        console.log('🔌 SocketProvider: Initializing single socket connection...');

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity, // Never give up
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🔌 SocketProvider: Connected! Socket ID:', socket.id);
            console.log('🔌 Transport:', socket.io.engine.transport.name);
            setIsConnected(true);

            // Re-join as agent if we had an agentId
            if (agentIdRef.current) {
                socket.emit('agent:join', agentIdRef.current);
            }

            // Re-register all conversation subscriptions
            subscriptionsRef.current.forEach((callbacks, eventName) => {
                callbacks.forEach(callback => {
                    console.log(`🔌 SocketProvider: Re-registering listener for ${eventName}`);
                    socket.on(eventName, callback);
                });
            });

            socket.onAny((event, ...args) => {
                console.log(`🔌 📨 INCOMING EVENT: ${event}`, args);
            });

            socket.onAny((event, ...args) => {
                console.log(`🔌 📨 INCOMING EVENT: ${event}`, args);
            });

            socket.onAny((event, ...args) => {
                console.log(`🔌 📨 INCOMING EVENT: ${event}`, args);
            });
        });

        socket.io.engine.on("upgrade", () => {
            const upgradedTransport = socket.io.engine.transport.name;
            console.log("🔌 SocketProvider: Transport upgraded to", upgradedTransport);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ SocketProvider: Disconnected. Reason:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ SocketProvider: Connection error:', error.message);
        });

        return () => {
            console.log('🔌 SocketProvider: Cleaning up socket connection');
            socket.disconnect();
        };
    }, []); // Empty deps - ONLY runs once on mount

    // Join as agent
    const joinAsAgent = useCallback((userId: string) => {
        agentIdRef.current = userId;
        if (socketRef.current?.connected) {
            socketRef.current.emit('agent:join', userId);
        }
    }, []);

    // Subscribe to conversation messages
    const subscribeToConversation = useCallback((conversationId: string, callback: MessageCallback) => {
        const eventName = `conversation:${conversationId}:message`;
        const socket = socketRef.current;

        console.log(`🔌 SocketProvider: Subscribing to ${eventName}`);

        // Add to our tracking map
        if (!subscriptionsRef.current.has(eventName)) {
            subscriptionsRef.current.set(eventName, new Set());
        }
        subscriptionsRef.current.get(eventName)!.add(callback);

        // Actually register the listener
        if (socket) {
            socket.on(eventName, callback);
        }

        // Return unsubscribe function
        return () => {
            console.log(`🔌 SocketProvider: Unsubscribing from ${eventName}`);
            subscriptionsRef.current.get(eventName)?.delete(callback);
            socket?.off(eventName, callback);
        };
    }, []);

    // Generic subscription helper
    const createSubscription = useCallback((eventName: string, callback: any) => {
        const socket = socketRef.current;

        if (!subscriptionsRef.current.has(eventName)) {
            subscriptionsRef.current.set(eventName, new Set());
        }
        subscriptionsRef.current.get(eventName)!.add(callback);

        if (socket) {
            socket.on(eventName, callback);
        }

        return () => {
            subscriptionsRef.current.get(eventName)?.delete(callback);
            socket?.off(eventName, callback);
        };
    }, []);

    const subscribeToNewLeads = useCallback((callback: LeadCallback) => {
        return createSubscription('lead:new', callback);
    }, [createSubscription]);

    const subscribeToLeadUpdates = useCallback((callback: LeadCallback) => {
        return createSubscription('lead:updated', callback);
    }, [createSubscription]);

    const subscribeToNewConversations = useCallback((callback: ConversationCallback) => {
        return createSubscription('conversation:new', callback);
    }, [createSubscription]);

    const subscribeToConversationUpdates = useCallback((callback: ConversationCallback) => {
        return createSubscription('conversation:updated', callback);
    }, [createSubscription]);

    const subscribeToAssignments = useCallback((callback: ConversationCallback) => {
        return createSubscription('conversation:assigned', callback);
    }, [createSubscription]);

    const subscribeToQueue = useCallback((callback: (queueItem: any) => void) => {
        return createSubscription('queue:update', callback);
    }, [createSubscription]);

    const subscribeToConversationsData = useCallback((callback: (conversations: any[]) => void) => {
        return createSubscription('conversations:data', callback);
    }, [createSubscription]);

    // Send message via socket
    const sendMessage = useCallback((conversationId: string, text: string, userId: string) => {
        socketRef.current?.emit('message:send', { conversationId, text, userId });
    }, []);

    // Request conversations list from server
    const requestConversations = useCallback((userId: string) => {
        socketRef.current?.emit('conversations:list', userId);
    }, []);

    const value: SocketContextType = {
        socket: socketRef.current,
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
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

// Hook to use socket context
export function useSocketContext(): SocketContextType {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
}

// Compatibility hook - drop-in replacement for old useSocket
// This ensures we don't break existing components during migration
export function useSocket(options?: { userId?: string }) {
    const context = useSocketContext();

    // Auto-join as agent if userId provided
    useEffect(() => {
        if (options?.userId) {
            context.joinAsAgent(options.userId);
        }
    }, [options?.userId, context.joinAsAgent]);

    return context;
}
