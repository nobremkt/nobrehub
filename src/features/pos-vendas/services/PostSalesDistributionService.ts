/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES DISTRIBUTION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Distribution-only: queue management, workload calculation, and assignment.
 * Client lifecycle methods moved to PostSalesClientService.ts.
 */

import { supabase } from '@/config/supabase';
import { ClientStatus } from '@/types/lead.types';
import {
    LEADS_TABLE,
    ACTIVE_CLIENT_STATUSES,
    PostSalesWorkload,
    DistributionClient,
    mapRowToDistributionClient,
} from './postSales.helpers';

// Re-export shared types for backward compatibility
export type { PostSalesWorkload, DistributionClient } from './postSales.helpers';

export const PostSalesDistributionService = {
    // ─── Queue ──────────────────────────────────────────────────────────────

    getDistributionQueue: async (): Promise<DistributionClient[]> => {
        try {
            const { data, error } = await supabase
                .from(LEADS_TABLE)
                .select('*')
                .eq('post_sales_distribution_status', 'pending')
                .eq('current_sector', 'distribution')
                .order('deal_closed_at', { ascending: true });

            if (error) throw error;
            return (data || []).map(mapRowToDistributionClient);
        } catch (error) {
            console.error('Error fetching post-sales distribution queue:', error);
            throw error;
        }
    },

    subscribeToDistributionQueue: (callback: (clients: DistributionClient[]) => void) => {
        const fetchQueue = async () => {
            try {
                const { data, error } = await supabase
                    .from(LEADS_TABLE)
                    .select('*')
                    .eq('post_sales_distribution_status', 'pending')
                    .eq('current_sector', 'distribution')
                    .order('deal_closed_at', { ascending: true });

                if (error) throw error;
                callback((data || []).map(mapRowToDistributionClient));
            } catch (error) {
                console.error('Error listening to post-sales distribution queue:', error);
            }
        };

        fetchQueue();

        const channel = supabase
            .channel('post_sales_distribution_queue')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: LEADS_TABLE,
            }, () => {
                fetchQueue();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    // ─── Workload ───────────────────────────────────────────────────────────

    calculatePostSalesWorkload: async (postSalesId: string): Promise<PostSalesWorkload> => {
        try {
            const { data, error } = await supabase
                .from(LEADS_TABLE)
                .select('id', { count: 'exact' })
                .eq('post_sales_id', postSalesId)
                .in('client_status', ACTIVE_CLIENT_STATUSES);

            if (error) throw error;

            return {
                postSalesId,
                postSalesName: '',
                activeClients: data?.length || 0
            };
        } catch (error) {
            console.error('Error calculating post-sales workload:', error);
            throw error;
        }
    },

    getAllPostSalesWorkload: async (postSalesIds: string[]): Promise<PostSalesWorkload[]> => {
        return Promise.all(
            postSalesIds.map(id => PostSalesDistributionService.calculatePostSalesWorkload(id))
        );
    },

    // ─── Assignment ─────────────────────────────────────────────────────────

    syncConversationAssignment: async (leadId: string, postSalesId: string): Promise<void> => {
        try {
            const { data } = await supabase
                .from('conversations')
                .select('id')
                .eq('lead_id', leadId)
                .limit(1);

            if (!data || data.length === 0) return;

            const { error } = await supabase
                .from('conversations')
                .update({
                    assigned_to: postSalesId,
                    post_sales_id: postSalesId,
                    context: 'post_sales',
                    status: 'open',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', data[0].id);

            if (error) throw error;
        } catch (error) {
            console.error('Error syncing post-sales conversation assignment:', error);
        }
    },

    assignToPostSales: async (
        leadId: string,
        postSalesId: string,
        _postSalesName: string
    ): Promise<void> => {
        try {
            // Get current lead to check for previous postSalesId
            const { data: lead } = await supabase
                .from(LEADS_TABLE)
                .select('post_sales_id, previous_post_sales_ids')
                .eq('id', leadId)
                .single();

            const previousPostSalesId = lead?.post_sales_id;
            const previousIds: string[] = (lead?.previous_post_sales_ids as string[]) || [];

            const updates: Record<string, unknown> = {
                post_sales_id: postSalesId,
                post_sales_distribution_status: 'assigned',
                post_sales_assigned_at: new Date().toISOString(),
                current_sector: 'pos_vendas',
                client_status: 'aguardando_projeto' as ClientStatus,
                updated_at: new Date().toISOString()
            };

            // Append previous postSalesId to array (replaces arrayUnion)
            if (previousPostSalesId && previousPostSalesId !== postSalesId) {
                updates.previous_post_sales_ids = [...previousIds, previousPostSalesId];
            }

            const { error } = await supabase
                .from(LEADS_TABLE)
                .update(updates)
                .eq('id', leadId);

            if (error) throw error;
            await PostSalesDistributionService.syncConversationAssignment(leadId, postSalesId);
        } catch (error) {
            console.error('Error assigning client to post-sales:', error);
            throw error;
        }
    },

    autoAssignClient: async (
        leadId: string,
        postSalesIds: string[]
    ): Promise<{ postSalesId: string; postSalesName: string } | null> => {
        try {
            if (postSalesIds.length === 0) return null;

            const workloads = await PostSalesDistributionService.getAllPostSalesWorkload(postSalesIds);
            workloads.sort((a, b) => a.activeClients - b.activeClients);

            const selected = workloads[0];
            if (!selected) return null;

            await PostSalesDistributionService.assignToPostSales(
                leadId,
                selected.postSalesId,
                selected.postSalesName
            );

            return {
                postSalesId: selected.postSalesId,
                postSalesName: selected.postSalesName
            };
        } catch (error) {
            console.error('Error auto-assigning client:', error);
            throw error;
        }
    },

    autoAssignAllPending: async (postSalesIds: string[]): Promise<number> => {
        try {
            const queue = await PostSalesDistributionService.getDistributionQueue();
            let assigned = 0;

            for (const client of queue) {
                const result = await PostSalesDistributionService.autoAssignClient(client.id, postSalesIds);
                if (result) assigned++;
            }

            return assigned;
        } catch (error) {
            console.error('Error auto-assigning all clients:', error);
            throw error;
        }
    },
};
