/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - SOCIAL MEDIA SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { SocialMediaClient, SocialMediaPost, SocialMediaClientFormData, PostStatus } from '../types/socialMedia';

// ─── Row → Frontend type mappers ─────────────────────────────────────────────

const mapRowToClient = (row: Record<string, unknown>): SocialMediaClient => ({
    id: row.id as string,
    clientName: (row.client_name as string) || '',
    contact: (row.contact as string) || '',
    companyName: (row.company_name as string) || '',
    instagramUsername: (row.instagram_username as string) || undefined,
    instagramUrl: (row.instagram_url as string) || undefined,
    paymentDate: row.payment_date ? new Date(row.payment_date as string) : null,
    planDuration: (row.plan_duration as number) || 1,
    planType: (row.plan_type as SocialMediaClient['planType']) || 'outro',
    postStartDate: new Date((row.post_start_date as string) || Date.now()),
    contractEndDate: row.contract_end_date ? new Date(row.contract_end_date as string) : null,
    value: (row.value as number) || null,
    status: (row.status as SocialMediaClient['status']) || 'active',
    createdAt: new Date((row.created_at as string) || Date.now()),
    updatedAt: new Date((row.updated_at as string) || Date.now()),
});

const mapRowToPost = (row: Record<string, unknown>): SocialMediaPost => ({
    id: row.id as string,
    clientId: row.client_id as string,
    scheduledDate: new Date((row.scheduled_date as string) || Date.now()),
    status: (row.status as PostStatus) || 'pending',
    notes: (row.notes as string) || '',
    createdAt: new Date((row.created_at as string) || Date.now()),
});

export const SocialMediaService = {
    /**
     * Subscribe to all clients (initial fetch + realtime)
     */
    subscribeToClients(callback: (clients: SocialMediaClient[]) => void): () => void {
        // Initial fetch
        supabase
            .from('social_media_clients')
            .select('*')
            .order('client_name', { ascending: true })
            .then(({ data }) => {
                callback((data || []).map(row => mapRowToClient(row)));
            });

        // Realtime subscription
        const channel = supabase
            .channel('social_media_clients_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'social_media_clients'
            }, () => {
                // Re-fetch on any change
                supabase
                    .from('social_media_clients')
                    .select('*')
                    .order('client_name', { ascending: true })
                    .then(({ data }) => {
                        callback((data || []).map(row => mapRowToClient(row)));
                    });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Create a new client
     */
    async createClient(data: SocialMediaClientFormData): Promise<string> {
        const now = new Date().toISOString();

        const { data: inserted, error } = await supabase
            .from('social_media_clients')
            .insert({
                client_name: data.clientName,
                contact: data.contact,
                company_name: data.companyName,
                instagram_username: data.instagramUsername || null,
                instagram_url: data.instagramUrl || null,
                payment_date: data.paymentDate ? data.paymentDate.toISOString() : null,
                plan_duration: data.planDuration,
                plan_type: data.planType,
                post_start_date: data.postStartDate.toISOString(),
                contract_end_date: data.contractEndDate ? data.contractEndDate.toISOString() : null,
                value: data.value ?? null,
                status: 'active',
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (error) throw error;
        return inserted.id;
    },

    /**
     * Update a client
     */
    async updateClient(clientId: string, data: Partial<SocialMediaClientFormData & { status: 'active' | 'inactive' }>): Promise<void> {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (data.clientName !== undefined) payload.client_name = data.clientName;
        if (data.contact !== undefined) payload.contact = data.contact;
        if (data.companyName !== undefined) payload.company_name = data.companyName;
        if (data.instagramUsername !== undefined) payload.instagram_username = data.instagramUsername || null;
        if (data.instagramUrl !== undefined) payload.instagram_url = data.instagramUrl || null;
        if (data.paymentDate !== undefined) payload.payment_date = data.paymentDate ? data.paymentDate.toISOString() : null;
        if (data.planDuration !== undefined) payload.plan_duration = data.planDuration;
        if (data.planType !== undefined) payload.plan_type = data.planType;
        if (data.postStartDate !== undefined) payload.post_start_date = data.postStartDate.toISOString();
        if (data.contractEndDate !== undefined) payload.contract_end_date = data.contractEndDate ? data.contractEndDate.toISOString() : null;
        if (data.value !== undefined) payload.value = data.value ?? null;
        if (data.status !== undefined) payload.status = data.status;

        const { error } = await supabase
            .from('social_media_clients')
            .update(payload)
            .eq('id', clientId);

        if (error) throw error;
    },

    /**
     * Delete a client (cascade deletes posts via FK)
     */
    async deleteClient(clientId: string): Promise<void> {
        const { error } = await supabase
            .from('social_media_clients')
            .delete()
            .eq('id', clientId);

        if (error) throw error;
    },

    /**
     * Subscribe to posts for a specific client
     */
    subscribeToClientPosts(clientId: string, callback: (posts: SocialMediaPost[]) => void): () => void {
        // Initial fetch
        supabase
            .from('social_media_posts')
            .select('*')
            .eq('client_id', clientId)
            .order('scheduled_date', { ascending: true })
            .then(({ data }) => {
                callback((data || []).map(row => mapRowToPost(row)));
            });

        // Realtime
        const channel = supabase
            .channel(`social_media_posts_${clientId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'social_media_posts',
                filter: `client_id=eq.${clientId}`
            }, () => {
                supabase
                    .from('social_media_posts')
                    .select('*')
                    .eq('client_id', clientId)
                    .order('scheduled_date', { ascending: true })
                    .then(({ data }) => {
                        callback((data || []).map(row => mapRowToPost(row)));
                    });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Create a post for a client
     */
    async createPost(clientId: string, scheduledDate: Date, notes?: string): Promise<string> {
        const { data, error } = await supabase
            .from('social_media_posts')
            .insert({
                client_id: clientId,
                scheduled_date: scheduledDate.toISOString(),
                status: 'pending',
                notes: notes || '',
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Update post status
     */
    async updatePost(clientId: string, postId: string, data: { status?: PostStatus; notes?: string }): Promise<void> {
        const payload: Record<string, unknown> = {};
        if (data.status !== undefined) payload.status = data.status;
        if (data.notes !== undefined) payload.notes = data.notes;

        const { error } = await supabase
            .from('social_media_posts')
            .update(payload)
            .eq('id', postId)
            .eq('client_id', clientId);

        if (error) throw error;
    },

    /**
     * Delete a post
     */
    async deletePost(clientId: string, postId: string): Promise<void> {
        const { error } = await supabase
            .from('social_media_posts')
            .delete()
            .eq('id', postId)
            .eq('client_id', clientId);

        if (error) throw error;
    },
};
