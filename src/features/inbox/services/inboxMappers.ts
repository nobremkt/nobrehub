/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INBOX MAPPERS — row ↔ frontend type mapping
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useAuthStore } from '@/stores/useAuthStore';
import { Conversation, Message } from '../types';
import type { Database } from '@/types/supabase';

// ─── Supabase Row Types ──────────────────────────────────────────────
type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

/** Get the current authenticated user's Supabase UUID, or null. */
export const getCurrentUserId = (): string | null => {
    return useAuthStore.getState().user?.id || null;
};

export const rowToConversation = (row: ConversationRow): Conversation => ({
    id: row.id,
    leadId: row.lead_id || '',
    leadName: row.name || '',
    leadPhone: row.phone || '',
    leadEmail: row.email || '',
    leadCompany: row.company || '',
    tags: row.tags || [],
    notes: row.notes || '',
    lastMessage: row.last_message_preview
        ? { id: '', conversationId: row.id, content: row.last_message_preview, type: 'text', direction: 'in', status: 'read', createdAt: row.last_message_at ? new Date(row.last_message_at) : new Date() }
        : undefined,
    unreadCount: row.unread_count || 0,
    assignedTo: row.assigned_to || undefined,
    channel: (row.channel || 'whatsapp') as Conversation['channel'],
    status: (row.status || 'open') as Conversation['status'],
    context: (row.context || 'sales') as Conversation['context'],
    postSalesId: row.post_sales_id || undefined,
    isFavorite: row.is_favorite || false,
    isPinned: row.is_pinned || false,
    isBlocked: row.is_blocked || false,
    profilePicUrl: row.profile_pic_url || undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
});

export const rowToMessage = (row: MessageRow): Message => ({
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content || '',
    type: (row.type || 'text') as Message['type'],
    direction: row.sender_type === 'agent' ? 'out' : 'in',
    status: (row.status || 'sent') as Message['status'],
    senderId: row.sender_id || undefined,
    mediaUrl: row.media_url || undefined,
    mediaName: (row.metadata as Record<string, unknown> | null)?.mediaName as string | undefined,
    viewOnce: (row.metadata as Record<string, unknown> | null)?.viewOnce as boolean | undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
});
