import { create } from 'zustand';
import { TeamChat, TeamMessage, ChatParticipant } from '../types/chat';
import { TeamChatService } from '../services/teamChatService';
import { playMessageSound } from '@/utils/notificationUtils';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

// ─── Notification Helper ───────────────────────────────────────────────────────

function getMessagePreview(msg: { type: string; content: string }): string {
    switch (msg.type) {
        case 'text': return msg.content;
        case 'image': return '📷 Imagem';
        case 'audio': return '🎤 Áudio';
        default: return '📎 Arquivo';
    }
}

function handleNewChatNotification(chat: TeamChat, _userId: string): void {
    const lastMsg = chat.lastMessage;
    if (!lastMsg) return;

    const senderDetail = chat.participantDetails?.[lastMsg.senderId];
    const senderName = senderDetail?.name || 'Alguém';

    // Resolve sender photo from collaborator store
    const collaborators = useCollaboratorStore.getState().collaborators;
    const senderCollab = collaborators.find(
        c => c.authUid === lastMsg.senderId || c.id === lastMsg.senderId
    );
    const senderPhoto = senderCollab?.profilePhotoUrl || senderDetail?.photoUrl;
    const chatName = chat.type === 'group' && chat.name ? chat.name : senderName;

    useNotificationStore.getState().addNotification({
        type: 'teamchat',
        title: chat.type === 'group'
            ? `${senderName} em ${chatName}`
            : `Nova mensagem de ${senderName}`,
        body: getMessagePreview(lastMsg),
        link: `/equipe/chat/${chat.id}`,
        senderName,
        senderPhotoUrl: senderPhoto,
        chatId: chat.id,
    }, { playSound: false });
}

// ─── Store ─────────────────────────────────────────────────────────────────────

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
    sendMessage: (content: string | File | Blob, type?: 'text' | 'image' | 'file' | 'audio') => Promise<void>;
    createPrivateChat: (otherUser: ChatParticipant) => Promise<string>;
    createGroupChat: (name: string, participants: ChatParticipant[]) => Promise<string>;
    updateGroupInfo: (chatId: string, updates: { name?: string; photo?: File | string }) => Promise<void>;
    addParticipants: (chatId: string, participants: string[]) => Promise<void>;
    removeParticipant: (chatId: string, userId: string) => Promise<void>;
    toggleAdminStatus: (chatId: string, userId: string, isAdmin: boolean) => Promise<void>;
    togglePin: (chatId: string) => Promise<void>;
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
            const prevState = get();

            // Notification Logic regarding "Track messages"
            if (!prevState.isLoadingChats) {
                chats.forEach(chat => {
                    const oldChat = prevState.chats.find(c => c.id === chat.id);
                    const isNewUpdate = !oldChat || chat.updatedAt > oldChat.updatedAt;

                    if (isNewUpdate && chat.lastMessage && chat.lastMessage.senderId !== userId) {
                        const isChatActive = prevState.activeChatId === chat.id;

                        if (!isChatActive) {
                            playMessageSound();
                            handleNewChatNotification(chat, userId);
                        }
                    }
                });
            }

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

    sendMessage: async (content: string | File | Blob, type = 'text') => {
        const { activeChat, activeChatId, currentUserId } = get();

        if (!activeChatId || !currentUserId || !activeChat) return;

        try {
            let finalContent = content;

            if (content instanceof File || content instanceof Blob) {
                // Upload
                const fileName = (content instanceof File) ? content.name : `audio_${Date.now()}.webm`;
                const path = `chats/${activeChatId}/${Date.now()}_${fileName}`;
                finalContent = await TeamChatService.uploadAttachment(content, path);
            }

            await TeamChatService.sendMessage(activeChatId, currentUserId, finalContent as string, type as any, activeChat.participants);
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

    updateGroupInfo: async (chatId, updates) => {
        let photoUrl: string | undefined = undefined;

        if (updates.photo) {
            if (updates.photo instanceof File) {
                const path = `chats/${chatId}/group_photo_${Date.now()}`;
                photoUrl = await TeamChatService.uploadAttachment(updates.photo, path);
            } else {
                photoUrl = updates.photo;
            }
        }

        await TeamChatService.updateGroupInfo(chatId, {
            name: updates.name,
            photoUrl
        });
    },

    addParticipants: async (chatId, participants) => {
        await TeamChatService.addParticipants(chatId, participants);
    },

    removeParticipant: async (chatId, userId) => {
        await TeamChatService.removeParticipant(chatId, userId);
    },

    toggleAdminStatus: async (chatId, userId, isAdmin) => {
        await TeamChatService.toggleAdminStatus(chatId, userId, isAdmin);
    },

    togglePin: async (chatId: string) => {
        const { currentUserId, chats } = get();
        if (!currentUserId) return;
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            await TeamChatService.togglePinChat(currentUserId, chatId, !chat.pinned);
        }
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
