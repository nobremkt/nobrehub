/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST-SALES CLIENT SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Client lifecycle management: project tracking, delivery, completion,
 * revision requests, and approval workflows.
 */

import { supabase } from '@/config/supabase';
import { Lead, ClientStatus } from '@/types/lead.types';
import type { Database } from '@/types/supabase';
import { rowToLead } from '@/features/crm/services/LeadService';
import { Project } from '@/types/project.types';
import { ProjectStatusPageService } from '@/features/production/services/ProjectStatusPageService';
import {
    LEADS_TABLE,
    PROJECTS_TABLE,
    ACTIVE_CLIENT_STATUSES,
    getLeadClientStatusFromProjects,
    mapRowToProject,
} from './postSales.helpers';

type LeadRow = Database['public']['Tables']['leads']['Row'];

export const PostSalesClientService = {
    // ─── Project Queries ────────────────────────────────────────────────────

    getProjectsByLeadId: async (leadId: string): Promise<Project[]> => {
        try {
            const { data, error } = await supabase
                .from(PROJECTS_TABLE)
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapRowToProject);
        } catch (error) {
            console.error('Error fetching projects by leadId:', error);
            return [];
        }
    },

    // ─── Status Synchronization ─────────────────────────────────────────────

    syncLeadStatusFromProjects: async (leadId: string): Promise<void> => {
        const projects = await PostSalesClientService.getProjectsByLeadId(leadId);
        if (projects.length === 0) return;

        const allConcluded = projects.every(
            project => project.status === 'concluido' || project.paymentStatus === 'paid'
        );

        if (allConcluded) {
            // Get current tags to append 'cliente'
            const { data: lead } = await supabase
                .from(LEADS_TABLE)
                .select('tags')
                .eq('id', leadId)
                .single();

            const currentTags: string[] = (lead?.tags as string[]) || [];
            const newTags = currentTags.includes('cliente') ? currentTags : [...currentTags, 'cliente'];

            const { error } = await supabase
                .from(LEADS_TABLE)
                .update({
                    client_status: 'concluido' as ClientStatus,
                    current_sector: 'vendas',
                    post_sales_distribution_status: null,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    tags: newTags
                })
                .eq('id', leadId);

            if (error) throw error;
            return;
        }

        const { error } = await supabase
            .from(LEADS_TABLE)
            .update({
                client_status: getLeadClientStatusFromProjects(projects),
                current_sector: 'pos_vendas',
                post_sales_distribution_status: 'assigned',
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) throw error;
    },

    // ─── Delivery & Completion ──────────────────────────────────────────────

    markProjectAsDelivered: async (
        leadId: string,
        projectId: string,
        deliveredByPostSalesId?: string
    ): Promise<void> => {
        try {
            const { error } = await supabase
                .from(PROJECTS_TABLE)
                .update({
                    status: 'entregue',
                    client_approval_status: 'pending',
                    delivered_to_client_at: new Date().toISOString(),
                    delivered_to_client_by: deliveredByPostSalesId || '',
                    updated_at: new Date().toISOString()
                })
                .eq('id', projectId);

            if (error) throw error;
            await ProjectStatusPageService.syncFromProjectId(projectId);
            await PostSalesClientService.syncLeadStatusFromProjects(leadId);
        } catch (error) {
            console.error('Error marking project as delivered:', error);
            throw error;
        }
    },

    completeClient: async (leadId: string, projectId?: string, paymentReceivedBy?: string): Promise<void> => {
        try {
            if (projectId) {
                const { error } = await supabase
                    .from(PROJECTS_TABLE)
                    .update({
                        payment_status: 'paid',
                        payment_received_at: new Date().toISOString(),
                        payment_received_by: paymentReceivedBy || '',
                        status: 'concluido',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', projectId);

                if (error) throw error;
                await ProjectStatusPageService.syncFromProjectId(projectId);
                await PostSalesClientService.syncLeadStatusFromProjects(leadId);
                return;
            }

            // No projectId: directly mark lead as completed
            // H4: Check for pending projects before completing
            const { data: activeProjects } = await supabase
                .from(PROJECTS_TABLE)
                .select('id, status, payment_status')
                .eq('lead_id', leadId)
                .not('status', 'eq', 'concluido');

            const hasPending = (activeProjects || []).some(
                (p: { status: string; payment_status: string | null }) => p.payment_status !== 'paid'
            );
            if (hasPending) {
                throw new Error('Lead tem projetos pendentes. Conclua-os primeiro.');
            }

            const { data: lead } = await supabase
                .from(LEADS_TABLE)
                .select('tags')
                .eq('id', leadId)
                .single();

            const currentTags: string[] = (lead?.tags as string[]) || [];
            const newTags = currentTags.includes('cliente') ? currentTags : [...currentTags, 'cliente'];

            const { error } = await supabase
                .from(LEADS_TABLE)
                .update({
                    client_status: 'concluido' as ClientStatus,
                    current_sector: 'vendas',
                    post_sales_distribution_status: null,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    tags: newTags
                })
                .eq('id', leadId);

            if (error) throw error;
        } catch (error) {
            console.error('Error completing client:', error);
            throw error;
        }
    },

    // ─── Client Queries & Subscriptions ─────────────────────────────────────

    getClientsByAttendant: async (postSalesId: string): Promise<Lead[]> => {
        try {
            const { data, error } = await supabase
                .from(LEADS_TABLE)
                .select('*')
                .eq('post_sales_id', postSalesId)
                .in('client_status', [...ACTIVE_CLIENT_STATUSES, 'concluido'])
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((row) => rowToLead(row as LeadRow));
        } catch (error) {
            console.error('Error fetching clients by attendant:', error);
            throw error;
        }
    },

    subscribeToClientsByAttendant: (postSalesId: string, callback: (clients: Lead[]) => void) => {
        const fetchClients = async () => {
            try {
                const { data, error } = await supabase
                    .from(LEADS_TABLE)
                    .select('*')
                    .eq('post_sales_id', postSalesId)
                    .in('client_status', [...ACTIVE_CLIENT_STATUSES, 'concluido'])
                    .order('updated_at', { ascending: false });

                if (error) throw error;

                const clients = (data || []).map((row) => rowToLead(row as LeadRow));

                callback(clients);
            } catch (error) {
                console.error('Error in clients subscription:', error);
            }
        };

        fetchClients();

        const channel = supabase
            .channel(`post_sales_clients_${postSalesId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: LEADS_TABLE,
            }, () => {
                fetchClients();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    // ─── Revision & Approval ────────────────────────────────────────────────

    requestRevision: async (leadId: string, projectId: string, reason?: string): Promise<void> => {
        try {
            if (!projectId) {
                throw new Error('Project ID is required to request revision');
            }

            // Update lead (keep non-status fields; status will be synced from projects)
            const { error: leadError } = await supabase
                .from(LEADS_TABLE)
                .update({
                    last_revision_requested_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId);

            if (leadError) throw leadError;

            // Get project data for revision counts
            const { data: project, error: getError } = await supabase
                .from(PROJECTS_TABLE)
                .select('client_revision_count')
                .eq('id', projectId)
                .single();

            if (getError) throw new Error('Project not found: ' + projectId);

            const currentClientRevisionCount = Number(project?.client_revision_count || 0);

            // Insert into revision_history table
            await supabase
                .from('revision_history')
                .insert({
                    project_id: projectId,
                    type: 'client',
                    reason: reason || '',
                    requested_by_name: 'Pós-Vendas',
                });

            const { error: projectError } = await supabase
                .from(PROJECTS_TABLE)
                .update({
                    status: 'alteracao_cliente',
                    client_revision_count: currentClientRevisionCount + 1,
                    client_approval_status: 'changes_requested',
                    updated_at: new Date().toISOString()
                })
                .eq('id', projectId);

            if (projectError) throw projectError;
            await ProjectStatusPageService.syncFromProjectId(projectId);
            // Derive client_status from project states
            await PostSalesClientService.syncLeadStatusFromProjects(leadId);
        } catch (error) {
            console.error('Error requesting revision:', error);
            throw error;
        }
    },

    approveClient: async (leadId: string, projectId?: string): Promise<void> => {
        try {
            if (!projectId) {
                throw new Error('Project ID is required to approve client');
            }

            // Update lead (keep non-status fields; status will be synced from projects)
            const { error: leadError } = await supabase
                .from(LEADS_TABLE)
                .update({
                    client_approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId);

            if (leadError) throw leadError;

            // Update project — B3: set to 'concluido' on client approval
            const { error: projectError } = await supabase
                .from(PROJECTS_TABLE)
                .update({
                    status: 'concluido',
                    client_approval_status: 'approved',
                    client_approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', projectId);

            if (projectError) throw projectError;
            await ProjectStatusPageService.syncFromProjectId(projectId);
            await PostSalesClientService.syncLeadStatusFromProjects(leadId);
        } catch (error) {
            console.error('Error approving client:', error);
            throw error;
        }
    },

    /**
     * U3: Fetch client counts per status for a list of attendant IDs.
     * Returns a map: attendantId → { aguardando_projeto, aguardando_alteracao, entregue, aguardando_pagamento, total }
     */
    getClientCountsForTeam: async (attendantIds: string[]): Promise<Record<string, {
        aguardando_projeto: number;
        aguardando_alteracao: number;
        entregue: number;
        aguardando_pagamento: number;
        total: number;
    }>> => {
        const result: Record<string, { aguardando_projeto: number; aguardando_alteracao: number; entregue: number; aguardando_pagamento: number; total: number }> = {};

        // Initialize all attendants
        for (const id of attendantIds) {
            result[id] = { aguardando_projeto: 0, aguardando_alteracao: 0, entregue: 0, aguardando_pagamento: 0, total: 0 };
        }

        if (attendantIds.length === 0) return result;

        try {
            const { data, error } = await supabase
                .from(LEADS_TABLE)
                .select('post_sales_id, client_status')
                .in('post_sales_id', attendantIds)
                .in('client_status', ACTIVE_CLIENT_STATUSES);

            if (error) throw error;

            for (const row of data || []) {
                const atId = row.post_sales_id as string;
                const status = row.client_status as ClientStatus;
                if (result[atId] && status !== 'concluido') {
                    if (status in result[atId]) {
                        (result[atId] as Record<string, number>)[status]++;
                    }
                    result[atId].total++;
                }
            }
        } catch (error) {
            console.error('Error fetching team client counts:', error);
        }

        return result;
    }
};
