import {
    getFirestoreDb,
    getFirebaseStorage
} from '@/config/firebase';
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
    writeBatch,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';
import { TeamChat, TeamMessage, ChatParticipant } from '../types/chat';

// ═══════════════════════════════════════════════════════════════════════════════
// FIRESTORE COLLECTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const COL_TEAM_CHATS = 'team_chats';
const COL_USER_CHAT_META = 'user_chat_meta';
const SUBCOL_MESSAGES = 'messages';

export const TeamChatService = {
    /**
     * Create a new 1-on-1 private chat or return existing
     */
    createPrivateChat: async (currentUserId: string, otherUser: ChatParticipant): Promise<string> => {
        const db = getFirestoreDb();

        // 1. Check if chat already exists (deterministic key for private chats)
        const sortedIds = [currentUserId, otherUser.id].sort();
        const chatKey = `${sortedIds[0]}_${sortedIds[1]}`;

        const chatRef = doc(db, COL_TEAM_CHATS, chatKey);
        const chatSnap = await getDoc(chatRef);

        const now = Timestamp.now();

        if (chatSnap.exists()) {
            // Self-healing: Ensure it's visible for both users
            const batch = writeBatch(db);
            batch.set(
                doc(db, COL_USER_CHAT_META, currentUserId, 'chats', chatKey),
                { hidden: false }, { merge: true }
            );
            batch.set(
                doc(db, COL_USER_CHAT_META, otherUser.id, 'chats', chatKey),
                { hidden: false }, { merge: true }
            );
            await batch.commit();
            return chatKey;
        }

        // 2. Create new chat
        const newChat = {
            type: 'private',
            participants: [currentUserId, otherUser.id],
            updatedAt: now,
            createdAt: now,
            participantDetails: {
                [currentUserId]: { id: currentUserId, name: 'User', email: '', photoUrl: '' },
                [otherUser.id]: otherUser
            }
        };

        const batch = writeBatch(db);

        // Create main chat doc (with deterministic key)
        batch.set(chatRef, newChat);

        // Create user meta for both users
        batch.set(doc(db, COL_USER_CHAT_META, currentUserId, 'chats', chatKey), {
            hidden: false,
            pinned: false,
            updatedAt: now,
        });
        batch.set(doc(db, COL_USER_CHAT_META, otherUser.id, 'chats', chatKey), {
            hidden: false,
            pinned: false,
            updatedAt: now,
        });

        await batch.commit();
        return chatKey;
    },

    /**
     * Create a group chat
     */
    createGroupChat: async (currentUserId: string, name: string, participants: ChatParticipant[]): Promise<string> => {
        const db = getFirestoreDb();

        const allParticipantIds = [currentUserId, ...participants.map(p => p.id)];
        const now = Timestamp.now();

        const newChat = {
            type: 'group',
            name,
            participants: allParticipantIds,
            updatedAt: now,
            createdAt: now,
            createdBy: currentUserId,
            admins: [currentUserId],
        };

        // Create main chat doc (auto-generated key)
        const chatDocRef = await addDoc(collection(db, COL_TEAM_CHATS), newChat);
        const chatId = chatDocRef.id;

        // Create user meta for all participants
        const batch = writeBatch(db);
        allParticipantIds.forEach(uid => {
            batch.set(doc(db, COL_USER_CHAT_META, uid, 'chats', chatId), {
                hidden: false,
                pinned: false,
                updatedAt: now,
            });
        });
        await batch.commit();

        return chatId;
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
        const db = getFirestoreDb();

        const now = Timestamp.now();

        const message = {
            chatId,
            senderId,
            content,
            type,
            createdAt: now,
        };

        // 1. Add message to subcollection
        await addDoc(collection(db, COL_TEAM_CHATS, chatId, SUBCOL_MESSAGES), message);

        // 2. Update chat metadata (lastMessage + updatedAt)
        const lastMessageSnippet = {
            content: type === 'text' ? content : (type === 'audio' ? 'Áudio' : (type === 'image' ? 'Imagem' : 'Arquivo')),
            senderId,
            createdAt: now,
            type,
        };

        await updateDoc(doc(db, COL_TEAM_CHATS, chatId), {
            lastMessage: lastMessageSnippet,
            updatedAt: now,
        });

        // 3. Update user meta (unhide + update timestamp)
        const batch = writeBatch(db);
        participants.forEach(uid => {
            batch.set(doc(db, COL_USER_CHAT_META, uid, 'chats', chatId), {
                hidden: false,
                updatedAt: now,
            }, { merge: true });
        });
        await batch.commit();
    },

    /**
     * Subscribe to user's chat list
     * Combines team_chats with user_chat_meta for personalized views
     */
    subscribeToUserChats: (userId: string, callback: (chats: TeamChat[]) => void) => {
        const db = getFirestoreDb();

        // Listen to user's chat meta to know which chats they're in
        const userMetaRef = collection(db, COL_USER_CHAT_META, userId, 'chats');

        const unsubscribe = onSnapshot(userMetaRef, async (metaSnapshot) => {
            if (metaSnapshot.empty) {
                callback([]);
                return;
            }

            // Get all chat IDs from user meta
            const chatMeta: Record<string, any> = {};
            metaSnapshot.docs.forEach(docSnap => {
                chatMeta[docSnap.id] = docSnap.data();
            });

            // Fetch the actual chat documents
            const chatIds = Object.keys(chatMeta).filter(id => !chatMeta[id].hidden);

            if (chatIds.length === 0) {
                callback([]);
                return;
            }

            // Fetch chats in batches of 10 (Firestore 'in' query limit)
            const allChats: TeamChat[] = [];
            const batches = [];
            for (let i = 0; i < chatIds.length; i += 10) {
                batches.push(chatIds.slice(i, i + 10));
            }

            for (const batchIds of batches) {
                const q = query(
                    collection(db, COL_TEAM_CHATS),
                    where('__name__', 'in', batchIds)
                );
                const chatSnapshot = await getDocs(q);
                chatSnapshot.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    const meta = chatMeta[docSnap.id] || {};
                    allChats.push({
                        id: docSnap.id,
                        ...data,
                        // Merge user-specific state
                        pinned: meta.pinned || false,
                        hidden: meta.hidden || false,
                        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
                    } as TeamChat);
                });
            }

            // Sort: pinned first, then by updatedAt desc
            allChats.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.updatedAt - a.updatedAt;
            });

            callback(allChats);
        });

        return unsubscribe;
    },

    /**
     * Toggle Pin Chat
     */
    togglePinChat: async (userId: string, chatId: string, pinned: boolean) => {
        const db = getFirestoreDb();
        await setDoc(
            doc(db, COL_USER_CHAT_META, userId, 'chats', chatId),
            { pinned },
            { merge: true }
        );
    },

    /**
     * Subscribe to messages in a chat
     */
    subscribeToMessages: (chatId: string, callback: (messages: TeamMessage[]) => void) => {
        const db = getFirestoreDb();
        const messagesRef = query(
            collection(db, COL_TEAM_CHATS, chatId, SUBCOL_MESSAGES),
            orderBy('createdAt', 'asc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
            const messages = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toMillis?.() || data.createdAt || 0,
                } as TeamMessage;
            });

            callback(messages);
        });

        return unsubscribe;
    },

    /**
     * Mark chat as read
     */
    markAsRead: async (_chatId: string, _userId: string) => {
        // Implementation for read receipts would go here
    },

    /**
     * Update Group Info (Name, Photo)
     */
    updateGroupInfo: async (chatId: string, updates: { name?: string; photoUrl?: string }) => {
        const db = getFirestoreDb();

        const chatRef = doc(db, COL_TEAM_CHATS, chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) throw new Error("Chat not found");

        const updateData: Record<string, any> = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.photoUrl) updateData.photoUrl = updates.photoUrl;
        updateData.updatedAt = Timestamp.now();

        await updateDoc(chatRef, updateData);
        // No need to update user_chat_meta — chat data is read from team_chats directly
    },

    /**
     * Add Participants to Group
     */
    addParticipants: async (chatId: string, newParticipantIds: string[]) => {
        const db = getFirestoreDb();

        const chatRef = doc(db, COL_TEAM_CHATS, chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) throw new Error("Chat not found");
        const chatData = chatSnap.data();

        const currentParticipants = chatData.participants || [];
        const uniqueNewIds = newParticipantIds.filter(id => !currentParticipants.includes(id));
        if (uniqueNewIds.length === 0) return;

        // 1. Update main chat with new participants
        await updateDoc(chatRef, {
            participants: arrayUnion(...uniqueNewIds),
            updatedAt: Timestamp.now(),
        });

        // 2. Create user meta for new participants
        const batch = writeBatch(db);
        uniqueNewIds.forEach(uid => {
            batch.set(doc(db, COL_USER_CHAT_META, uid, 'chats', chatId), {
                hidden: false,
                pinned: false,
                updatedAt: Timestamp.now(),
            });
        });
        await batch.commit();
    },

    /**
     * Remove Participant from Group
     */
    removeParticipant: async (chatId: string, userIdToRemove: string) => {
        const db = getFirestoreDb();

        const chatRef = doc(db, COL_TEAM_CHATS, chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) throw new Error("Chat not found");
        const chatData = chatSnap.data();

        const currentParticipants = chatData.participants || [];
        const updatedParticipants = currentParticipants.filter((id: string) => id !== userIdToRemove);

        if (updatedParticipants.length === 0) {
            // DELETE GROUP: No participants left
            // Delete messages subcollection (individually)
            const messagesSnap = await getDocs(collection(db, COL_TEAM_CHATS, chatId, SUBCOL_MESSAGES));
            const batch = writeBatch(db);
            messagesSnap.docs.forEach(msgDoc => batch.delete(msgDoc.ref));
            batch.delete(chatRef);
            batch.delete(doc(db, COL_USER_CHAT_META, userIdToRemove, 'chats', chatId));
            await batch.commit();
        } else {
            // NORMAL REMOVAL
            const batch = writeBatch(db);

            // 1. Update main chat
            batch.update(chatRef, {
                participants: arrayRemove(userIdToRemove),
                admins: arrayRemove(userIdToRemove),
                updatedAt: Timestamp.now(),
            });

            // 2. Remove user meta for removed user
            batch.delete(doc(db, COL_USER_CHAT_META, userIdToRemove, 'chats', chatId));

            await batch.commit();
        }
    },

    /**
     * Toggle Admin Status
     */
    toggleAdminStatus: async (chatId: string, userId: string, isAdmin: boolean) => {
        const db = getFirestoreDb();
        const chatRef = doc(db, COL_TEAM_CHATS, chatId);

        if (isAdmin) {
            await updateDoc(chatRef, {
                admins: arrayUnion(userId),
            });
        } else {
            await updateDoc(chatRef, {
                admins: arrayRemove(userId),
            });
        }
    }
};
