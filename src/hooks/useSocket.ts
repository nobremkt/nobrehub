import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState, useCallback } from 'react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseSocketOptions {
    userId?: string;
    autoConnect?: boolean;
}

export function useSocket({ userId, autoConnect = true }: UseSocketOptions = {}) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!autoConnect) return;

        // Create socket connection
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('🔌 Socket connected');

            // Join as agent if userId provided
            if (userId) {
                socket.emit('agent:join', userId);
            }
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('❌ Socket disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, [userId, autoConnect]);

    // Subscribe to conversation messages
    const subscribeToConversation = useCallback((conversationId: string, callback: (message: any) => void) => {
        socketRef.current?.on(`conversation:${conversationId}:message`, callback);
        return () => {
            socketRef.current?.off(`conversation:${conversationId}:message`, callback);
        };
    }, []);

    // Subscribe to new conversation assignments
    const subscribeToAssignments = useCallback((callback: (conversation: any) => void) => {
        socketRef.current?.on('conversation:assigned', callback);
        return () => {
            socketRef.current?.off('conversation:assigned', callback);
        };
    }, []);

    // Subscribe to queue updates
    const subscribeToQueue = useCallback((callback: (queueItem: any) => void) => {
        socketRef.current?.on('queue:update', callback);
        return () => {
            socketRef.current?.off('queue:update', callback);
        };
    }, []);

    // NEW: Subscribe to new leads (real-time lead list updates)
    const subscribeToNewLeads = useCallback((callback: (lead: any) => void) => {
        socketRef.current?.on('lead:new', callback);
        return () => {
            socketRef.current?.off('lead:new', callback);
        };
    }, []);

    // NEW: Subscribe to lead updates
    const subscribeToLeadUpdates = useCallback((callback: (lead: any) => void) => {
        socketRef.current?.on('lead:updated', callback);
        return () => {
            socketRef.current?.off('lead:updated', callback);
        };
    }, []);

    // NEW: Subscribe to new conversations (real-time inbox updates)
    const subscribeToNewConversations = useCallback((callback: (conversation: any) => void) => {
        socketRef.current?.on('conversation:new', callback);
        return () => {
            socketRef.current?.off('conversation:new', callback);
        };
    }, []);

    // NEW: Subscribe to conversation updates (status changes, transfers)
    const subscribeToConversationUpdates = useCallback((callback: (conversation: any) => void) => {
        socketRef.current?.on('conversation:updated', callback);
        return () => {
            socketRef.current?.off('conversation:updated', callback);
        };
    }, []);

    // Send a message
    const sendMessage = useCallback((conversationId: string, text: string, userId: string) => {
        socketRef.current?.emit('message:send', { conversationId, text, userId });
    }, []);

    // Request conversations list
    const requestConversations = useCallback((userId: string) => {
        socketRef.current?.emit('conversations:list', userId);
    }, []);

    // Subscribe to conversations data
    const subscribeToConversationsData = useCallback((callback: (conversations: any[]) => void) => {
        socketRef.current?.on('conversations:data', callback);
        return () => {
            socketRef.current?.off('conversations:data', callback);
        };
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        subscribeToConversation,
        subscribeToAssignments,
        subscribeToQueue,
        subscribeToNewLeads,
        subscribeToLeadUpdates,
        subscribeToNewConversations,
        subscribeToConversationUpdates,
        subscribeToConversationsData,
        sendMessage,
        requestConversations
    };
}

