/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TEAM CHAT SERVICE (SUPABASE)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Data in Supabase PostgreSQL:
 *   team_chat_channels              → Chat channels (private/group)
 *   team_chat_messages              → Messages (FK channel_id)
 *
 * Attachments still use Firebase Storage (as per migration plan).
 * Real-time via Supabase Realtime (postgres_changes).
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import {
    getFirebaseStorage
} from '@/config/firebase';
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';
import { TeamChat, TeamMessage, ChatParticipant } from '../types/chat';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS — row ↔ frontend type mapping
// ═══════════════════════════════════════════════════════════════════════════════

const rowToTeamChat = (row: any, userMeta?: { pinned?: boolean; hidden?: boolean }): TeamChat => ({
    id: row.id,
    type: row.type || 'private',
    participants: row.member_ids || [],
    name: row.name || undefined,
    photoUrl: row.photo_url || undefined,
    lastMessage: row.last_message_content ? {
        content: row.last_message_content,
        senderId: row.last_message_sender_id || '',
        createdAt: row.last_message_at ? new Date(row.last_message_at).getTime() : 0,
        type: row.last_message_type || 'text',
    } : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
    createdBy: row.created_by || undefined,
    admins: row.admin_ids || [],
    pinned: userMeta?.pinned || false,
    hidden: userMeta?.hidden || false,
});

const rowToTeamMessage = (row: any): TeamMessage => ({
    id: row.id,
    chatId: row.channel_id,
    senderId: row.sender_id,
    content: row.content || '',
    type: row.type || 'text',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    attachments: row.media_url ? [{ url: row.media_url, name: '', type: row.type || 'file' }] : undefined,
});

export const TeamChatService = {
    /**
     * Create a new 1-on-1 private chat or return existing
     */
    createPrivateChat: async (currentUserId: string, otherUser: ChatParticipant): Promise<string> => {
        // 1. Deterministic key for private chats
        const sortedIds = [currentUserId, otherUser.id].sort();
        const chatKey = `${sortedIds[0]}_${sortedIds[1]}`;

        // Check if chat already exists
        const { data: existing } = await supabase
            .from('team_chat_channels')
            .select('id')
            .eq('id', chatKey)
            .maybeSingle();

        if (existing) {
            return chatKey;
        }

        const now = new Date().toISOString();

        // 2. Create new chat
        const { error } = await supabase
            .from('team_chat_channels')
            .insert({
                id: chatKey,
                type: 'private',
                name: otherUser.name,
                member_ids: [currentUserId, otherUser.id],
                created_by: currentUserId,
                created_at: now,
            });

        if (error) throw error;
        return chatKey;
    },

    /**
     * Create a group chat
     */
    createGroupChat: async (currentUserId: string, name: string, participants: ChatParticipant[]): Promise<string> => {
        const allParticipantIds = [currentUserId, ...participants.map(p => p.id)];
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('team_chat_channels')
            .insert({
                type: 'group',
                name,
                member_ids: allParticipantIds,
                created_by: currentUserId,
                created_at: now,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Upload an attachment (still uses Firebase Storage)
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
        const now = new Date().toISOString();

        // 1. Get sender name from users table
        const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', senderId)
            .single();

        const senderName = userData?.name || 'Unknown';

        // 2. Insert message
        await supabase
            .from('team_chat_messages')
            .insert({
                channel_id: chatId,
                sender_id: senderId,
                sender_name: senderName,
                content,
                type,
                created_at: now,
            });

        // 3. Update channel metadata (last message snippet)
        const lastMessageContent = type === 'text' ? content : (type === 'audio' ? 'Áudio' : (type === 'image' ? 'Imagem' : 'Arquivo'));

        await supabase
            .from('team_chat_channels')
            .update({
                last_message_content: lastMessageContent,
                last_message_sender_id: senderId,
                last_message_at: now,
                last_message_type: type,
                updated_at: now,
            })
            .eq('id', chatId);
    },

    /**
     * Subscribe to user's chat list
     * Reads from team_chat_channels where member_ids contains the userId
     */
    subscribeToUserChats: (userId: string, callback: (chats: TeamChat[]) => void) => {
        const fetchChats = async () => {
            const { data, error } = await supabase
                .from('team_chat_channels')
                .select('*')
                .contains('member_ids', [userId])
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('[TeamChatService] Error fetching chats:', error);
                callback([]);
                return;
            }

            const chats = (data || []).map(row => rowToTeamChat(row));

            // Sort: pinned first, then by updatedAt desc
            chats.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.updatedAt - a.updatedAt;
            });

            callback(chats);
        };

        fetchChats();

        const channel = supabase
            .channel(`team-chats-${userId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'team_chat_channels' },
                () => { fetchChats(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Toggle Pin Chat
     * Since we don't have per-user metadata table, we store pinned state
     * in a JSONB column or handle client-side. For now, this is a no-op
     * placeholder that can be extended with a user_chat_preferences table.
     */
    togglePinChat: async (_userId: string, _chatId: string, _pinned: boolean) => {
        // TODO: Implement with a user_chat_preferences table or JSONB metadata
        // For now, pin state is managed client-side in the store
        console.log('[TeamChatService] togglePinChat: client-side only for now');
    },

    /**
     * Subscribe to messages in a chat
     */
    subscribeToMessages: (chatId: string, callback: (messages: TeamMessage[]) => void) => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('team_chat_messages')
                .select('*')
                .eq('channel_id', chatId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) {
                console.error('[TeamChatService] Error fetching messages:', error);
                callback([]);
                return;
            }

            callback((data || []).map(rowToTeamMessage));
        };

        fetchMessages();

        const channel = supabase
            .channel(`team-messages-${chatId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'team_chat_messages', filter: `channel_id=eq.${chatId}` },
                () => { fetchMessages(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Mark chat as read
     */
    markAsRead: async (_chatId: string, _userId: string) => {
        // Implementation for read receipts would go here
        // Could use a user_chat_read_state table
    },

    /**
     * Update Group Info (Name, Photo)
     */
    updateGroupInfo: async (chatId: string, updates: { name?: string; photoUrl?: string }) => {
        const updateData: Record<string, unknown> = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.photoUrl) updateData.photo_url = updates.photoUrl;
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('team_chat_channels')
            .update(updateData)
            .eq('id', chatId);

        if (error) throw error;
    },

    /**
     * Add Participants to Group
     */
    addParticipants: async (chatId: string, newParticipantIds: string[]) => {
        // 1. Get current members
        const { data: chat, error: chatError } = await supabase
            .from('team_chat_channels')
            .select('member_ids')
            .eq('id', chatId)
            .single();

        if (chatError || !chat) throw new Error('Chat not found');

        const currentMembers: string[] = chat.member_ids || [];
        const uniqueNew = newParticipantIds.filter(id => !currentMembers.includes(id));
        if (uniqueNew.length === 0) return;

        // 2. Update with merged array
        const { error } = await supabase
            .from('team_chat_channels')
            .update({
                member_ids: [...currentMembers, ...uniqueNew],
                updated_at: new Date().toISOString(),
            })
            .eq('id', chatId);

        if (error) throw error;
    },

    /**
     * Remove Participant from Group
     */
    removeParticipant: async (chatId: string, userIdToRemove: string) => {
        // 1. Get current chat
        const { data: chat, error: chatError } = await supabase
            .from('team_chat_channels')
            .select('member_ids, admin_ids')
            .eq('id', chatId)
            .single();

        if (chatError || !chat) throw new Error('Chat not found');

        const currentMembers: string[] = chat.member_ids || [];
        const updatedMembers = currentMembers.filter(id => id !== userIdToRemove);

        if (updatedMembers.length === 0) {
            // DELETE GROUP: No participants left
            // Delete messages first, then channel
            await supabase
                .from('team_chat_messages')
                .delete()
                .eq('channel_id', chatId);

            await supabase
                .from('team_chat_channels')
                .delete()
                .eq('id', chatId);
        } else {
            // NORMAL REMOVAL
            const currentAdmins: string[] = chat.admin_ids || [];
            const updatedAdmins = currentAdmins.filter(id => id !== userIdToRemove);

            await supabase
                .from('team_chat_channels')
                .update({
                    member_ids: updatedMembers,
                    admin_ids: updatedAdmins,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', chatId);
        }
    },

    /**
     * Toggle Admin Status
     */
    toggleAdminStatus: async (chatId: string, userId: string, isAdmin: boolean) => {
        // 1. Get current admins
        const { data: chat, error: chatError } = await supabase
            .from('team_chat_channels')
            .select('admin_ids')
            .eq('id', chatId)
            .single();

        if (chatError || !chat) throw new Error('Chat not found');

        const currentAdmins: string[] = chat.admin_ids || [];

        let updatedAdmins: string[];
        if (isAdmin) {
            updatedAdmins = currentAdmins.includes(userId) ? currentAdmins : [...currentAdmins, userId];
        } else {
            updatedAdmins = currentAdmins.filter(id => id !== userId);
        }

        await supabase
            .from('team_chat_channels')
            .update({ admin_ids: updatedAdmins })
            .eq('id', chatId);
    }
};
