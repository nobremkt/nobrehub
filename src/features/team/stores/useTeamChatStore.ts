import { create } from 'zustand';
import { TeamChat, TeamMessage, ChatParticipant } from '../types/chat';
import { TeamChatService } from '../services/teamChatService';

interface TeamChatState {
    currentUserId: string | null;
    chats: TeamChat[];
    messages: TeamMessage[];
    activeChatId: string | null;
    activeChat: TeamChat | null;
    isLoadingChats: boolean;
    isLoadingMessages: boolean;

    // Subscriptions
    chatsUnsubscribe: object | null;
    messagesUnsubscribe: object | null;

    // Actions
    init: (userId: string) => void;
    selectChat: (chatId: string) => void;
    clearSelection: () => void; // Added this
    sendMessage: (content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
    createPrivateChat: (otherUser: ChatParticipant) => Promise<string>;
    createGroupChat: (name: string, participants: ChatParticipant[]) => Promise<string>;
    cleanup: () => void;
}

export const useTeamChatStore = create<TeamChatState>((set, get) => ({
    currentUserId: null,
    chats: [],
    messages: [],
    activeChatId: null,
    activeChat: null,
    isLoadingChats: false,
    isLoadingMessages: false,
    chatsUnsubscribe: null,
    messagesUnsubscribe: null,

    init: (userId: string) => {
        const state = get();
        if (state.currentUserId === userId && state.chatsUnsubscribe) {
            return;
        }

        state.cleanup();

        set({ isLoadingChats: true, currentUserId: userId });

        const unsub = TeamChatService.subscribeToUserChats(userId, (chats) => {
            set({
                chats,
                isLoadingChats: false
            });

            const activeId = get().activeChatId;
            if (activeId) {
                const refreshedActive = chats.find(c => c.id === activeId);
                if (refreshedActive) {
                    set({ activeChat: refreshedActive });
                }
            }
        });

        set({ chatsUnsubscribe: unsub });
    },

    selectChat: (chatId: string) => {
        const state = get();

        if (state.activeChatId === chatId) return;

        if (state.messagesUnsubscribe) {
            // @ts-ignore
            state.messagesUnsubscribe();
            set({ messagesUnsubscribe: null });
        }

        const chat = state.chats.find(c => c.id === chatId) || null;

        set({
            activeChatId: chatId,
            activeChat: chat,
            messages: [],
            isLoadingMessages: true
        });

        const unsub = TeamChatService.subscribeToMessages(chatId, (messages) => {
            set({
                messages,
                isLoadingMessages: false
            });
        });

        set({ messagesUnsubscribe: unsub });
    },

    clearSelection: () => {
        const state = get();
        if (state.messagesUnsubscribe) {
            // @ts-ignore
            state.messagesUnsubscribe();
        }
        set({
            activeChatId: null,
            activeChat: null,
            messages: [],
            messagesUnsubscribe: null
        });
    },

    sendMessage: async (content: string, type = 'text') => {
        const { activeChat, activeChatId, currentUserId } = get();

        if (!activeChatId || !currentUserId || !activeChat) return;

        try {
            await TeamChatService.sendMessage(activeChatId, currentUserId, content, type, activeChat.participants);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    },

    createPrivateChat: async (otherUser: ChatParticipant) => {
        const { currentUserId } = get();
        if (!currentUserId) throw new Error("No user logged in");

        const chatId = await TeamChatService.createPrivateChat(currentUserId, otherUser);
        get().selectChat(chatId);
        return chatId;
    },

    createGroupChat: async (name: string, participants: ChatParticipant[]) => {
        const { currentUserId } = get();
        if (!currentUserId) throw new Error("No user logged in");

        const chatId = await TeamChatService.createGroupChat(currentUserId, name, participants);
        get().selectChat(chatId);
        return chatId;
    },

    cleanup: () => {
        const { chatsUnsubscribe, messagesUnsubscribe } = get();
        // @ts-ignore
        if (chatsUnsubscribe) chatsUnsubscribe();
        // @ts-ignore
        if (messagesUnsubscribe) messagesUnsubscribe();

        set({
            currentUserId: null,
            chats: [],
            messages: [],
            activeChatId: null,
            activeChat: null,
            chatsUnsubscribe: null,
            messagesUnsubscribe: null
        });
    }
}));
