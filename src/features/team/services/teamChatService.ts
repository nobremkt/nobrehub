import {
    getRealtimeDb,
    getFirebaseStorage
} from '@/config/firebase';
import {
    ref,
    push,
    get,
    child,
    update,
    onValue,
    query,
    orderByChild,
    limitToLast
} from 'firebase/database';
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';
import { TeamChat, TeamMessage, ChatParticipant } from '../types/chat';

const DB_CHATS = 'chats';
const DB_MESSAGES = 'messages';
const DB_USER_CHATS = 'user_chats';

export const TeamChatService = {
    /**
     * Create a new 1-on-1 private chat or return existing
     */
    createPrivateChat: async (currentUserId: string, otherUser: ChatParticipant): Promise<string> => {
        const db = getRealtimeDb();

        // 1. Check if chat already exists
        const sortedIds = [currentUserId, otherUser.id].sort();
        const chatKey = `${sortedIds[0]}_${sortedIds[1]}`;

        const chatRef = ref(db, `${DB_CHATS}/${chatKey}`);
        const chatSnap = await get(chatRef);

        const now = Date.now();

        if (chatSnap.exists()) {
            // Self-healing: Ensure it's visible for both users even if it existed
            const healUpdates: Record<string, any> = {};
            healUpdates[`/${DB_USER_CHATS}/${currentUserId}/${chatKey}/hidden`] = false;
            healUpdates[`/${DB_USER_CHATS}/${otherUser.id}/${chatKey}/hidden`] = false;

            await update(ref(db), healUpdates);
            return chatKey;
        }

        // 2. Create new chat
        const newChat: TeamChat = {
            id: chatKey,
            type: 'private',
            participants: [currentUserId, otherUser.id],
            updatedAt: now,
            participantDetails: {
                [currentUserId]: { id: currentUserId, name: 'User', email: '', photoUrl: '' },
                [otherUser.id]: otherUser
            }
        };

        const updates: Record<string, any> = {};
        updates[`/${DB_CHATS}/${chatKey}`] = newChat;
        updates[`/${DB_USER_CHATS}/${currentUserId}/${chatKey}`] = { ...newChat, hidden: false };
        updates[`/${DB_USER_CHATS}/${otherUser.id}/${chatKey}`] = { ...newChat, hidden: false };

        await update(ref(db), updates);
        return chatKey;
    },

    /**
     * Create a group chat
     */
    createGroupChat: async (currentUserId: string, name: string, participants: ChatParticipant[]): Promise<string> => {
        const db = getRealtimeDb();
        const newChatKey = push(child(ref(db), DB_CHATS)).key;

        if (!newChatKey) throw new Error("Failed to generate key");

        const allParticipantIds = [currentUserId, ...participants.map(p => p.id)];
        const now = Date.now();

        const newChat: TeamChat = {
            id: newChatKey,
            type: 'group',
            name,
            participants: allParticipantIds,
            updatedAt: now,
            createdBy: currentUserId,
            admins: [currentUserId]
        };

        const updates: Record<string, any> = {};
        updates[`/${DB_CHATS}/${newChatKey}`] = newChat;

        // Add to each user's list
        allParticipantIds.forEach(uid => {
            updates[`/${DB_USER_CHATS}/${uid}/${newChatKey}`] = newChat;
        });

        await update(ref(db), updates);
        return newChatKey;
    },

    /**
     * Upload an attachment
     */
    uploadAttachment: async (file: Blob | File, path: string): Promise<string> => {
        const storage = getFirebaseStorage();
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    },

    /**
     * Send a message
     */
    sendMessage: async (chatId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' | 'audio' = 'text', participants: string[]): Promise<void> => {
        const db = getRealtimeDb();
        const newMessageKey = push(child(ref(db), `${DB_MESSAGES}/${chatId}`)).key;

        if (!newMessageKey) return;

        const timestamp = Date.now();

        const message: TeamMessage = {
            id: newMessageKey,
            chatId,
            senderId,
            content,
            type,
            createdAt: timestamp
        };

        // First, get the chat data to ensure we have complete info
        const chatSnapshot = await get(ref(db, `${DB_CHATS}/${chatId}`));
        const chatData = chatSnapshot.val() as TeamChat | null;

        const updates: Record<string, any> = {};

        // 1. Add Message
        updates[`/${DB_MESSAGES}/${chatId}/${newMessageKey}`] = message;

        // 2. Update Chat Metadata (Last Message)
        const lastMessageSnippet = {
            content: type === 'text' ? content : (type === 'audio' ? 'Áudio' : (type === 'image' ? 'Imagem' : 'Arquivo')),
            senderId,
            createdAt: timestamp,
            type
        };

        updates[`/${DB_CHATS}/${chatId}/lastMessage`] = lastMessageSnippet;
        updates[`/${DB_CHATS}/${chatId}/updatedAt`] = timestamp;

        // 3. Update User Chats (Denormalized for list view)
        // CRITICAL: Ensure each participant has the full chat object, not just partial updates
        participants.forEach(uid => {
            const userChatPath = `/${DB_USER_CHATS}/${uid}/${chatId}`;

            // If we have the full chat data, set it entirely (self-healing)
            if (chatData) {
                updates[`${userChatPath}`] = {
                    ...chatData,
                    lastMessage: lastMessageSnippet,
                    updatedAt: timestamp,
                    hidden: false
                };
            } else {
                // Fallback: Just update the specific fields (may create incomplete records)
                updates[`${userChatPath}/lastMessage`] = lastMessageSnippet;
                updates[`${userChatPath}/updatedAt`] = timestamp;
                updates[`${userChatPath}/hidden`] = false;
                updates[`${userChatPath}/id`] = chatId;
                updates[`${userChatPath}/participants`] = participants;
                updates[`${userChatPath}/type`] = chatId.includes('_') ? 'private' : 'group';
            }
        });

        await update(ref(db), updates);
    },

    /**
     * Subscribe to user's chat list
     */
    subscribeToUserChats: (userId: string, callback: (chats: TeamChat[]) => void) => {
        const db = getRealtimeDb();
        const userChatsRef = query(ref(db, `${DB_USER_CHATS}/${userId}`), orderByChild('updatedAt'));

        const unsubscribe = onValue(userChatsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }

            // Convert object to array and sort desc
            const chats = Object.values(data)
                .map((c: any) => c as TeamChat)
                // @ts-ignore
                .filter(c => !c.hidden)
                .filter(c => !c.hidden)
                .sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return b.updatedAt - a.updatedAt;
                });

            callback(chats);
        });

        return unsubscribe;
    },

    /**
     * Toggle Pin Chat
     */
    togglePinChat: async (userId: string, chatId: string, pinned: boolean) => {
        const db = getRealtimeDb();
        const updates: Record<string, any> = {};
        updates[`/${DB_USER_CHATS}/${userId}/${chatId}/pinned`] = pinned;
        await update(ref(db), updates);
    },

    /**
     * Subscribe to messages in a chat
     */
    subscribeToMessages: (chatId: string, callback: (messages: TeamMessage[]) => void) => {
        const db = getRealtimeDb();
        // Load last 100 messages mostly
        const messagesRef = query(ref(db, `${DB_MESSAGES}/${chatId}`), limitToLast(100));

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }

            const messages = Object.values(data)
                .map((m: any) => m as TeamMessage)
                .sort((a, b) => a.createdAt - b.createdAt);

            callback(messages);
        });

        return unsubscribe;
    },

    /**
     * Mark chat as read (locally for now, or update sync)
     */
    markAsRead: async (_chatId: string, _userId: string) => {
        // Implementation for read receipts would go here
    },

    /**
     * Update Group Info (Name, Photo)
     */
    updateGroupInfo: async (chatId: string, updates: { name?: string; photoUrl?: string }) => {
        const db = getRealtimeDb();
        const chatRef = ref(db, `${DB_CHATS}/${chatId}`);
        const chatSnap = await get(chatRef);

        if (!chatSnap.exists()) throw new Error("Chat not found");
        const chatData = chatSnap.val() as TeamChat;

        const dbUpdates: Record<string, any> = {};

        // 1. Update main chat
        if (updates.name) dbUpdates[`/${DB_CHATS}/${chatId}/name`] = updates.name;
        if (updates.photoUrl) dbUpdates[`/${DB_CHATS}/${chatId}/photoUrl`] = updates.photoUrl;

        // 2. Update all participants
        chatData.participants.forEach(uid => {
            if (updates.name) dbUpdates[`/${DB_USER_CHATS}/${uid}/${chatId}/name`] = updates.name;
            if (updates.photoUrl) dbUpdates[`/${DB_USER_CHATS}/${uid}/${chatId}/photoUrl`] = updates.photoUrl;
        });

        await update(ref(db), dbUpdates);
    },

    /**
     * Add Participants to Group
     */
    addParticipants: async (chatId: string, newParticipantIds: string[]) => {
        const db = getRealtimeDb();
        const chatRef = ref(db, `${DB_CHATS}/${chatId}`);
        const chatSnap = await get(chatRef);

        if (!chatSnap.exists()) throw new Error("Chat not found");
        const chatData = chatSnap.val() as TeamChat;

        const currentParticipants = chatData.participants || [];
        // Filter out already existing
        const uniqueNewIds = newParticipantIds.filter(id => !currentParticipants.includes(id));
        if (uniqueNewIds.length === 0) return;

        const updatedParticipants = [...currentParticipants, ...uniqueNewIds];

        const dbUpdates: Record<string, any> = {};

        // 1. Update main chat participants list
        dbUpdates[`/${DB_CHATS}/${chatId}/participants`] = updatedParticipants;

        // 2. Add chat to new participants' list
        const updatedChatObj = { ...chatData, participants: updatedParticipants };
        uniqueNewIds.forEach(uid => {
            dbUpdates[`/${DB_USER_CHATS}/${uid}/${chatId}`] = updatedChatObj;
        });

        // 3. Update existing participants' chat object to include new members
        currentParticipants.forEach(uid => {
            dbUpdates[`/${DB_USER_CHATS}/${uid}/${chatId}/participants`] = updatedParticipants;
        });

        await update(ref(db), dbUpdates);
    },

    /**
     * Remove Participant from Group
     */
    removeParticipant: async (chatId: string, userIdToRemove: string) => {
        const db = getRealtimeDb();
        const chatRef = ref(db, `${DB_CHATS}/${chatId}`);
        const chatSnap = await get(chatRef);

        if (!chatSnap.exists()) throw new Error("Chat not found");
        const chatData = chatSnap.val() as TeamChat;

        const currentParticipants = chatData.participants || [];
        const updatedParticipants = currentParticipants.filter(id => id !== userIdToRemove);

        // Remove admins entitlement if removed
        const currentAdmins = chatData.admins || [];
        const updatedAdmins = currentAdmins.filter(id => id !== userIdToRemove);

        const dbUpdates: Record<string, any> = {};

        if (updatedParticipants.length === 0) {
            // DELETE GROUP: No participants left
            dbUpdates[`/${DB_CHATS}/${chatId}`] = null;
            dbUpdates[`/${DB_MESSAGES}/${chatId}`] = null; // Optional: Clean up messages
            dbUpdates[`/${DB_USER_CHATS}/${userIdToRemove}/${chatId}`] = null;
        } else {
            // NORMAL REMOVAL

            // 1. Update main chat
            dbUpdates[`/${DB_CHATS}/${chatId}/participants`] = updatedParticipants;
            dbUpdates[`/${DB_CHATS}/${chatId}/admins`] = updatedAdmins;

            // 2. Remove chat from the removed user
            dbUpdates[`/${DB_USER_CHATS}/${userIdToRemove}/${chatId}`] = null;

            // 3. Update remaining participants
            updatedParticipants.forEach(uid => {
                dbUpdates[`/${DB_USER_CHATS}/${uid}/${chatId}/participants`] = updatedParticipants;
                dbUpdates[`/${DB_USER_CHATS}/${uid}/${chatId}/admins`] = updatedAdmins;
            });
        }

        await update(ref(db), dbUpdates);
    },

    /**
     * Toggle Admin Status
     */
    toggleAdminStatus: async (chatId: string, userId: string, isAdmin: boolean) => {
        const db = getRealtimeDb();
        const chatRef = ref(db, `${DB_CHATS}/${chatId}`);
        const chatSnap = await get(chatRef);

        if (!chatSnap.exists()) throw new Error("Chat not found");
        const chatData = chatSnap.val() as TeamChat;

        const currentAdmins = chatData.admins || [];
        let updatedAdmins = [];

        if (isAdmin) {
            if (!currentAdmins.includes(userId)) updatedAdmins = [...currentAdmins, userId];
            else updatedAdmins = currentAdmins;
        } else {
            updatedAdmins = currentAdmins.filter(id => id !== userId);
        }

        const dbUpdates: Record<string, any> = {};

        // 1. Update main chat
        dbUpdates[`/${DB_CHATS}/${chatId}/admins`] = updatedAdmins;

        // 2. Update all participants
        const participants = chatData.participants || [];
        participants.forEach(uid => {
            dbUpdates[`/${DB_USER_CHATS}/${uid}/${chatId}/admins`] = updatedAdmins;
        });

        await update(ref(db), dbUpdates);
    }
};
