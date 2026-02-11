/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES DISTRIBUTION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Service for post-sales client distribution and lifecycle management.
 * Migrated from Firebase Firestore to Supabase.
 */

import { supabase } from '@/config/supabase';
import { COLLECTIONS } from '@/config';
import { Lead, ClientStatus } from '@/types/lead.types';
import { Project } from '@/types/project.types';
import { ProjectStatusPageService } from '@/features/production/services/ProjectStatusPageService';

const LEADS_TABLE = COLLECTIONS.LEADS;
const PROJECTS_TABLE = COLLECTIONS.PRODUCTION_PROJECTS;

interface PostSalesWorkload {
    postSalesId: string;
    postSalesName: string;
    activeClients: number;
}

interface DistributionClient extends Lead {
    previousAttendant?: string;
}

const ACTIVE_CLIENT_STATUSES: ClientStatus[] = [
    'aguardando_projeto',
    'aguardando_alteracao',
    'entregue',
    'aguardando_pagamento'
];

const getLeadClientStatusFromProjects = (projects: Project[]): ClientStatus => {
    if (projects.length === 0) return 'aguardando_projeto';

    const hasAlteration = projects.some(
        project => project.status === 'alteracao' || project.status === 'alteracao_interna' || project.status === 'alteracao_cliente' || project.clientApprovalStatus === 'changes_requested'
    );
    if (hasAlteration) return 'aguardando_alteracao';

    const hasPendingPayment = projects.some(
        project => project.clientApprovalStatus === 'approved' && project.paymentStatus !== 'paid'
    );
    if (hasPendingPayment) return 'aguardando_pagamento';

    const hasDeliveredAwaitingApproval = projects.some(
        project => project.status === 'entregue' && project.clientApprovalStatus !== 'approved'
    );
    if (hasDeliveredAwaitingApproval) return 'entregue';

    return 'aguardando_projeto';
};

const mapRowToDistributionClient = (row: Record<string, unknown>): DistributionClient => {
    const previousPostSalesIds = (row.previous_post_sales_ids as string[]) || [];
    return {
        ...row,
        id: row.id as string,
        createdAt: new Date((row.created_at as string) || Date.now()),
        updatedAt: new Date((row.updated_at as string) || Date.now()),
        dealClosedAt: row.deal_closed_at ? new Date(row.deal_closed_at as string) : undefined,
        previousAttendant: previousPostSalesIds.length > 0
            ? previousPostSalesIds[previousPostSalesIds.length - 1]
            : undefined
    } as DistributionClient;
};

const mapRowToProject = (row: Record<string, unknown>): Project => {
    return {
        ...row,
        id: row.id as string,
        dueDate: row.due_date ? new Date(row.due_date as string) : new Date(),
        createdAt: new Date((row.created_at as string) || Date.now()),
        updatedAt: new Date((row.updated_at as string) || Date.now()),
        assignedAt: row.assigned_at ? new Date(row.assigned_at as string) : undefined,
        postSalesAssignedAt: row.post_sales_assigned_at ? new Date(row.post_sales_assigned_at as string) : undefined,
        deliveredToClientAt: row.delivered_to_client_at ? new Date(row.delivered_to_client_at as string) : undefined,
        clientApprovedAt: row.client_approved_at ? new Date(row.client_approved_at as string) : undefined,
        paymentReceivedAt: row.payment_received_at ? new Date(row.payment_received_at as string) : undefined,
        lastRevisionRequestedAt: row.last_revision_requested_at ? new Date(row.last_revision_requested_at as string) : undefined,
    } as Project;
};

export const PostSalesDistributionService = {
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

    updateClientStatus: async (leadId: string, status: ClientStatus): Promise<void> => {
        try {
            const { error } = await supabase
                .from(LEADS_TABLE)
                .update({
                    client_status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating client status:', error);
            throw error;
        }
    },

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

    syncLeadStatusFromProjects: async (leadId: string): Promise<void> => {
        const projects = await PostSalesDistributionService.getProjectsByLeadId(leadId);
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
            await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
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
                await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
                return;
            }

            // No projectId: directly mark lead as completed
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

    getClientsByAttendant: async (postSalesId: string): Promise<Lead[]> => {
        try {
            const { data, error } = await supabase
                .from(LEADS_TABLE)
                .select('*')
                .eq('post_sales_id', postSalesId)
                .in('client_status', [...ACTIVE_CLIENT_STATUSES, 'concluido'])
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(row => ({
                ...row,
                id: row.id,
                createdAt: new Date(row.created_at || Date.now()),
                updatedAt: new Date(row.updated_at || Date.now()),
                dealClosedAt: row.deal_closed_at ? new Date(row.deal_closed_at) : undefined
            })) as unknown as Lead[];
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

                const clients = (data || []).map(row => ({
                    ...row,
                    id: row.id,
                    createdAt: new Date(row.created_at || Date.now()),
                    updatedAt: new Date(row.updated_at || Date.now()),
                    dealClosedAt: row.deal_closed_at ? new Date(row.deal_closed_at) : undefined
                })) as unknown as Lead[];

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

    requestRevision: async (leadId: string, projectId: string, reason?: string): Promise<void> => {
        try {
            if (!projectId) {
                throw new Error('Project ID is required to request revision');
            }

            // Update lead
            const { error: leadError } = await supabase
                .from(LEADS_TABLE)
                .update({
                    client_status: 'aguardando_alteracao' as ClientStatus,
                    last_revision_requested_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId);

            if (leadError) throw leadError;

            // Get project data for revision counts
            const { data: project, error: getError } = await supabase
                .from(PROJECTS_TABLE)
                .select('client_revision_count, internal_revision_count')
                .eq('id', projectId)
                .single();

            if (getError) throw new Error('Project not found: ' + projectId);

            const currentClientRevisionCount = Number(project?.client_revision_count || 0);
            const currentInternalRevisionCount = Number(project?.internal_revision_count || 0);

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
                    internal_revision_count: currentInternalRevisionCount + 1,
                    client_revision_count: currentClientRevisionCount + 1,
                    client_approval_status: 'changes_requested',
                    updated_at: new Date().toISOString()
                })
                .eq('id', projectId);

            if (projectError) throw projectError;
            await ProjectStatusPageService.syncFromProjectId(projectId);
            await PostSalesDistributionService.updateClientStatus(leadId, 'aguardando_alteracao');
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

            // Update lead
            const { error: leadError } = await supabase
                .from(LEADS_TABLE)
                .update({
                    client_status: 'aguardando_pagamento' as ClientStatus,
                    client_approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId);

            if (leadError) throw leadError;

            // Update project
            const { error: projectError } = await supabase
                .from(PROJECTS_TABLE)
                .update({
                    client_approval_status: 'approved',
                    client_approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', projectId);

            if (projectError) throw projectError;
            await ProjectStatusPageService.syncFromProjectId(projectId);
            await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
        } catch (error) {
            console.error('Error approving client:', error);
            throw error;
        }
    }
};
