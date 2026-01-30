import { create } from 'zustand';
import { Conversation, Message, SearchFilters } from '../types';
import { InboxService } from '../services/InboxService';

interface InboxState {
    conversations: Conversation[];
    messages: Record<string, Message[]>; // conversationId -> messages
    selectedConversationId: string | null;
    filters: SearchFilters;
    isLoading: boolean;

    // Subscriptions handling
    unsubConversations: () => void;
    unsubMessages: () => void;

    // Actions
    init: () => void;
    selectConversation: (id: string | null) => void;
    setFilter: (filter: Partial<SearchFilters>) => void;
    sendMessage: (content: string) => Promise<void>;
    markAsRead: (conversationId: string) => void;
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
    unsubConversations: () => { },
    unsubMessages: () => { },

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

        // Check if we already have messages for this conversation (optional optimization, but we want realtime)
        // Subscribing to new conversation
        const unsubscribe = InboxService.subscribeToMessages(id, (newMessages) => {
            set((state) => ({
                messages: {
                    ...state.messages,
                    [id]: newMessages
                }
            }));
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
        const { selectedConversationId } = get();
        if (!selectedConversationId) return;

        try {
            await InboxService.sendMessage(selectedConversationId, content, 'agent');
            // No need to update state manually, subscription will catch it
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    },

    markAsRead: async (conversationId) => {
        try {
            await InboxService.markAsRead(conversationId);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }
}));
