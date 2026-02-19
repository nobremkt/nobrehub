import { create } from 'zustand';
import { Conversation, Message, SearchFilters } from '../types';
import { InboxService } from '../services/InboxService';

interface InboxState {
    conversations: Conversation[];
    messages: Record<string, Message[]>; // conversationId -> messages
    selectedConversationId: string | null;
    filters: SearchFilters;
    isLoading: boolean;
    draftMessage: string; // Mensagem pré-preenchida (ex: vindo do Playbook)

    // Pagination
    hasMoreMessages: Record<string, boolean>; // conversationId -> hasMore
    isLoadingMore: boolean;

    // Subscriptions handling
    unsubConversations: () => void;
    unsubMessages: () => void;

    // Actions
    init: () => void;
    selectConversation: (id: string | null) => void;
    setFilter: (filter: Partial<SearchFilters>) => void;
    sendMessage: (content: string) => Promise<void>;
    markAsRead: (conversationId: string) => void;
    updateConversationDetails: (conversationId: string, data: Partial<Conversation>) => Promise<void>;
    setDraftMessage: (message: string) => void;
    loadMoreMessages: (conversationId: string) => Promise<void>;
}

export const useInboxStore = create<InboxState>((set, get) => ({
    conversations: [],
    messages: {},
    selectedConversationId: null,
    filters: {
        status: 'all',
        query: ''
    },
    isLoading: false,
    draftMessage: '',
    hasMoreMessages: {},
    isLoadingMore: false,
    unsubConversations: () => { },
    unsubMessages: () => { },

    setDraftMessage: (message) => set({ draftMessage: message }),

    init: () => {
        const { unsubConversations } = get();
        // Avoid duplicate subscriptions
        unsubConversations();

        set({ isLoading: true });

        const unsubscribe = InboxService.subscribeToConversations((conversations) => {
            set({ conversations, isLoading: false });
        });

        set({ unsubConversations: unsubscribe });
    },

    selectConversation: (id) => {
        const { unsubMessages } = get();

        // Unsubscribe from previous conversation messages
        unsubMessages();

        if (!id) {
            set({ selectedConversationId: null });
            return;
        }

        // Initial fetch limit is 50 (set in subscribeToMessages)
        // hasMore defaults to true, will be corrected after first load
        set((state) => ({
            hasMoreMessages: { ...state.hasMoreMessages, [id]: true },
        }));

        // Subscribing to new conversation
        const unsubscribe = InboxService.subscribeToMessages(id, (newMessages) => {
            set((state) => ({
                messages: {
                    ...state.messages,
                    [id]: newMessages
                },
                // If initial fetch returned less than 50, no more messages
                hasMoreMessages: {
                    ...state.hasMoreMessages,
                    [id]: newMessages.length >= 50,
                },
            }));

            // Auto-mark as read when new messages arrive for the currently open conversation
            const currentConv = get().conversations.find(c => c.id === id);
            if (currentConv && currentConv.unreadCount > 0) {
                InboxService.markAsRead(id);
            }
        });

        const conversation = get().conversations.find(c => c.id === id);
        if (conversation && conversation.unreadCount > 0) {
            get().markAsRead(id);
        }

        set({
            selectedConversationId: id,
            unsubMessages: unsubscribe
        });
    },

    setFilter: (newFilter) => set((state) => ({
        filters: { ...state.filters, ...newFilter }
    })),

    sendMessage: async (content) => {
        const { selectedConversationId, messages } = get();
        if (!selectedConversationId) return;

        // Optimistic: insert a temporary message immediately
        const optimisticId = `optimistic_${Date.now()}`;
        const optimisticMessage: Message = {
            id: optimisticId,
            conversationId: selectedConversationId,
            content,
            type: 'text',
            direction: 'out',
            status: 'pending',
            createdAt: new Date(),
        };

        const prevMessages = messages[selectedConversationId] || [];
        set((state) => ({
            messages: {
                ...state.messages,
                [selectedConversationId]: [...prevMessages, optimisticMessage],
            },
        }));

        try {
            // Let InboxService resolve the real senderId via getCurrentUserId()
            await InboxService.sendMessage(selectedConversationId, content);
            // Realtime subscription will replace the optimistic message with the real one
        } catch (error) {
            console.error('Failed to send message:', error);
            // Rollback: remove the optimistic message
            set((state) => ({
                messages: {
                    ...state.messages,
                    [selectedConversationId]: (state.messages[selectedConversationId] || [])
                        .filter(m => m.id !== optimisticId),
                },
            }));
        }
    },

    markAsRead: async (conversationId) => {
        try {
            await InboxService.markAsRead(conversationId);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    },

    updateConversationDetails: async (conversationId, data) => {
        const previousConversation = get().conversations.find(c => c.id === conversationId);

        // Optimistic UI update for sidepanel actions (Ganho/Perdido/Aberto etc.)
        set((state) => ({
            conversations: state.conversations.map((conv) =>
                conv.id === conversationId
                    ? {
                        ...conv,
                        ...data,
                        updatedAt: new Date(),
                    }
                    : conv
            ),
        }));

        try {
            await InboxService.updateConversationDetails(conversationId, data);
        } catch (error) {
            console.error('Failed to update conversation details:', error);

            // Rollback optimistic update on failure
            if (previousConversation) {
                set((state) => ({
                    conversations: state.conversations.map((conv) =>
                        conv.id === conversationId ? previousConversation : conv
                    ),
                }));
            }
        }
    },

    loadMoreMessages: async (conversationId) => {
        const { messages, hasMoreMessages, isLoadingMore } = get();

        // Guard: already loading or no more messages
        if (isLoadingMore || !hasMoreMessages[conversationId]) return;

        const currentMsgs = messages[conversationId] || [];
        if (currentMsgs.length === 0) return;

        // Get oldest message timestamp as cursor
        const oldestMessage = currentMsgs[0];
        const cursor = oldestMessage.createdAt instanceof Date
            ? oldestMessage.createdAt.toISOString()
            : String(oldestMessage.createdAt);

        set({ isLoadingMore: true });

        try {
            const { messages: olderMessages, hasMore } = await InboxService.fetchOlderMessages(
                conversationId,
                cursor,
                30
            );

            set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: [...olderMessages, ...(state.messages[conversationId] || [])],
                },
                hasMoreMessages: {
                    ...state.hasMoreMessages,
                    [conversationId]: hasMore,
                },
                isLoadingMore: false,
            }));
        } catch (error) {
            console.error('Failed to load more messages:', error);
            set({ isLoadingMore: false });
        }
    },
}));
