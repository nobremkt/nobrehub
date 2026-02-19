/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - INBOX SERVICE (COMPOSITION BARREL)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Composes sub-services into a single InboxService object.
 * Sub-services:
 *   - inboxMappers          → row ↔ frontend type mapping
 *   - inboxMessageService   → send, template, media, schedule
 *   - inboxDistributionService → round-robin lead distribution
 *
 * Conversation subscriptions, CRUD, and management methods remain here.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { Conversation, Message } from '../types';
import { rowToConversation, rowToMessage } from './inboxMappers';
import { InboxMessageService } from './inboxMessageService';
import { InboxDistributionService } from './inboxDistributionService';

export const InboxService = {
    // ─── Re-exported sub-services ────────────────────────────────────────
    ...InboxMessageService,
    ...InboxDistributionService,

    // ═════════════════════════════════════════════════════════════════════
    // CONVERSATION SUBSCRIPTIONS (realtime)
    // ═════════════════════════════════════════════════════════════════════

    subscribeToConversations: (callback: (conversations: Conversation[]) => void) => {
        const fetchConversations = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[InboxService] Error fetching conversations:', error);
                return;
            }
            callback((data || []).map(rowToConversation));
        };

        fetchConversations();

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const debouncedFetch = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchConversations, 300);
        };

        const channel = supabase
            .channel('inbox-conversations')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => { debouncedFetch(); }
            )
            .subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    },

    subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void) => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) {
                console.error('[InboxService] Error fetching messages:', error);
                return;
            }
            callback((data || []).map(rowToMessage));
        };

        fetchMessages();

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const debouncedFetch = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchMessages, 300);
        };

        const channel = supabase
            .channel(`inbox-messages-${conversationId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                () => { debouncedFetch(); }
            )
            .subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    },

    fetchOlderMessages: async (
        conversationId: string,
        beforeTimestamp: string,
        limit: number = 30
    ): Promise<{ messages: Message[]; hasMore: boolean }> => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .lt('created_at', beforeTimestamp)
            .order('created_at', { ascending: false })
            .limit(limit + 1);

        if (error) {
            console.error('[InboxService] Error fetching older messages:', error);
            return { messages: [], hasMore: false };
        }

        const rows = data || [];
        const hasMore = rows.length > limit;
        const sliced = hasMore ? rows.slice(0, limit) : rows;

        return {
            messages: sliced.reverse().map(rowToMessage),
            hasMore,
        };
    },

    subscribeToConversationByLeadId: (
        leadId: string,
        callback: (conversation: Conversation | null) => void
    ) => {
        const fetchConversation = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('lead_id', leadId)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('[InboxService] Error fetching conversation by leadId:', error);
                callback(null);
                return;
            }
            callback(data ? rowToConversation(data) : null);
        };

        fetchConversation();

        const channel = supabase
            .channel(`inbox-conv-lead-${leadId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'conversations', filter: `lead_id=eq.${leadId}` },
                () => { fetchConversation(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    // ═════════════════════════════════════════════════════════════════════
    // CONVERSATION CRUD
    // ═════════════════════════════════════════════════════════════════════

    createConversation: async (leadData: {
        leadId?: string;
        leadName: string;
        leadPhone: string;
        leadEmail?: string;
        leadCompany?: string;
        tags?: string[];
    }): Promise<string> => {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                lead_id: leadData.leadId || null,
                name: leadData.leadName,
                phone: leadData.leadPhone,
                email: leadData.leadEmail || '',
                tags: leadData.tags || [],
                notes: '',
                unread_count: 0,
                channel: 'whatsapp',
                status: 'open',
                context: 'sales',
                last_message_preview: null,
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    findOrCreateConversation: async (leadData: {
        leadId?: string;
        leadName: string;
        leadPhone: string;
        leadEmail?: string;
        leadCompany?: string;
    }): Promise<string> => {
        const normalizePhone = (phone: string) => phone?.replace(/\D/g, '') || '';

        if (leadData.leadId) {
            const { data: byLeadId } = await supabase
                .from('conversations')
                .select('id')
                .eq('lead_id', leadData.leadId)
                .eq('status', 'open')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (byLeadId) return byLeadId.id;
        }

        if (leadData.leadPhone) {
            const normalized = normalizePhone(leadData.leadPhone);
            const { data: allConvs } = await supabase
                .from('conversations')
                .select('id, phone')
                .eq('status', 'open')
                .order('updated_at', { ascending: false });

            const byPhone = allConvs?.find(c =>
                normalizePhone(c.phone) === normalized
            );

            if (byPhone) return byPhone.id;
        }

        return InboxService.createConversation(leadData);
    },

    // ═════════════════════════════════════════════════════════════════════
    // CONVERSATION MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════

    toggleFavorite: async (conversationId: string) => {
        const { data } = await supabase
            .from('conversations')
            .select('is_favorite')
            .eq('id', conversationId)
            .single();

        if (!data) return;

        await supabase
            .from('conversations')
            .update({ is_favorite: !data.is_favorite, updated_at: new Date().toISOString() })
            .eq('id', conversationId);
    },

    togglePin: async (conversationId: string) => {
        const { data } = await supabase
            .from('conversations')
            .select('is_pinned')
            .eq('id', conversationId)
            .single();

        if (!data) return;

        await supabase
            .from('conversations')
            .update({ is_pinned: !data.is_pinned, updated_at: new Date().toISOString() })
            .eq('id', conversationId);
    },

    updateConversationDetails: async (conversationId: string, data: Partial<Conversation>) => {
        const convUpdates: Record<string, unknown> = {};
        if (data.leadName !== undefined) convUpdates.name = data.leadName;
        if (data.leadPhone !== undefined) convUpdates.phone = data.leadPhone;
        if (data.leadEmail !== undefined) convUpdates.email = data.leadEmail;
        if (data.leadCompany !== undefined) convUpdates.company = data.leadCompany;
        if (data.tags !== undefined) convUpdates.tags = data.tags;
        if (data.notes !== undefined) convUpdates.notes = data.notes;
        if (data.status !== undefined) convUpdates.status = data.status;
        if (data.assignedTo !== undefined) convUpdates.assigned_to = data.assignedTo || null;
        if (data.context !== undefined) convUpdates.context = data.context;
        if (data.postSalesId !== undefined) convUpdates.post_sales_id = data.postSalesId || null;
        if (data.dealStatus !== undefined) convUpdates.deal_status = data.dealStatus;
        if (data.lossReason !== undefined) convUpdates.loss_reason = data.lossReason || null;
        if (data.isFavorite !== undefined) convUpdates.is_favorite = data.isFavorite;
        if (data.isPinned !== undefined) convUpdates.is_pinned = data.isPinned;
        convUpdates.updated_at = new Date().toISOString();

        await supabase
            .from('conversations')
            .update(convUpdates)
            .eq('id', conversationId);

        const { data: conv } = await supabase
            .from('conversations')
            .select('lead_id')
            .eq('id', conversationId)
            .single();

        if (conv?.lead_id) {
            try {
                const leadUpdates: Record<string, unknown> = {};
                if (data.leadName !== undefined) leadUpdates.name = data.leadName;
                if (data.leadPhone !== undefined) leadUpdates.phone = data.leadPhone;
                if (data.leadEmail !== undefined) leadUpdates.email = data.leadEmail;
                if (data.leadCompany !== undefined) leadUpdates.company = data.leadCompany;
                if (data.tags !== undefined) leadUpdates.tags = data.tags;
                if (data.notes !== undefined) leadUpdates.notes = data.notes;
                if (data.dealStatus !== undefined) leadUpdates.deal_status = data.dealStatus;
                if (data.lossReason !== undefined) leadUpdates.lost_reason_id = data.lossReason || null;

                if (Object.keys(leadUpdates).length > 0) {
                    leadUpdates.updated_at = new Date().toISOString();
                    await supabase
                        .from('leads')
                        .update(leadUpdates)
                        .eq('id', conv.lead_id);
                }
            } catch (error) {
                console.error('[InboxService] Failed to sync to Lead:', error);
            }
        }
    },

    assignConversation: async (conversationId: string, userId: string | null, updatedBy?: string) => {
        await supabase
            .from('conversations')
            .update({
                assigned_to: userId,
                updated_by: updatedBy || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
    },

    toggleConversationStatus: async (conversationId: string, updatedBy?: string) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('status')
            .eq('id', conversationId)
            .single();

        if (error || !data) return 'open';

        const newStatus = data.status === 'open' ? 'closed' : 'open';

        await supabase
            .from('conversations')
            .update({
                status: newStatus,
                updated_by: updatedBy || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);

        return newStatus;
    },

    transferToPostSales: async (conversationId: string, updatedBy?: string) => {
        await supabase
            .from('conversations')
            .update({
                context: 'post_sales',
                status: 'open',
                assigned_to: null,
                updated_by: updatedBy || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
    },

    updateDealStatus: async (
        conversationId: string,
        dealStatus: 'open' | 'won' | 'lost',
        updatedBy?: string,
        lossReason?: string
    ) => {
        await supabase
            .from('conversations')
            .update({
                deal_status: dealStatus,
                loss_reason: dealStatus === 'lost' ? (lossReason || null) : null,
                updated_by: updatedBy || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
    },

    markAsRead: async (conversationId: string) => {
        await supabase
            .from('conversations')
            .update({ unread_count: 0 })
            .eq('id', conversationId);
    },

    /**
     * Distribute all unassigned leads (wraps InboxDistributionService with
     * access to assignConversation from this barrel).
     */
    distributeUnassignedLeads: async (): Promise<{ distributed: number; errors: number }> => {
        return InboxDistributionService.distributeUnassignedLeads(InboxService.assignConversation);
    },
};
