import { supabase } from '@/config/supabase';
import { Lead, ClientStatus } from '@/types/lead.types';
import { Project } from '@/types/project.types';
import { ProjectStatusPageService } from '@/features/production/services/ProjectStatusPageService';

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

const rowToLead = (row: any): DistributionClient => {
    return {
        id: row.id,
        name: row.name || '',
        email: row.email ?? undefined,
        phone: row.phone || '',
        company: row.company ?? undefined,
        pipeline: row.pipeline as Lead['pipeline'],
        status: row.stage_id ?? '',
        order: row.order ?? 0,
        estimatedValue: row.estimated_value ?? undefined,
        tags: row.tags ?? [],
        responsibleId: row.responsible_id ?? '',
        customFields: row.custom_fields ?? undefined,
        notes: row.notes ?? undefined,
        temperature: row.temperature as Lead['temperature'],
        source: row.source ?? undefined,

        dealStatus: row.deal_status as Lead['dealStatus'],
        dealValue: row.deal_value ?? undefined,
        dealClosedAt: row.deal_closed_at ? new Date(row.deal_closed_at) : undefined,
        dealProductId: row.deal_product_id ?? undefined,
        dealNotes: row.deal_notes ?? undefined,

        lostReason: row.lost_reason_id ?? undefined,
        lostAt: row.lost_at ? new Date(row.lost_at) : undefined,

        postSalesId: row.post_sales_id ?? undefined,
        postSalesAssignedAt: row.post_sales_assigned_at ? new Date(row.post_sales_assigned_at) : undefined,
        postSalesDistributionStatus: row.post_sales_distribution_status as Lead['postSalesDistributionStatus'],
        clientStatus: row.client_status as Lead['clientStatus'],
        currentSector: row.current_sector as Lead['currentSector'],
        previousPostSalesIds: row.previous_post_sales_ids ?? undefined,

        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),

        previousAttendant: row.previous_post_sales_ids?.length > 0
            ? row.previous_post_sales_ids[row.previous_post_sales_ids.length - 1]
            : undefined
    } as DistributionClient;
};

const rowToProject = (row: any): Project => {
    return {
        id: row.id,
        name: row.name,
        leadId: row.lead_id,
        leadName: row.lead_name || '',
        driveLink: row.drive_link ?? undefined,
        dueDate: row.due_date ? new Date(row.due_date) : new Date(),
        producerId: row.producer_id ?? '',
        producerName: row.producer_name || '',
        status: row.status as Project['status'],
        priority: row.priority as Project['priority'],
        notes: row.notes ?? undefined,
        checklist: [],
        source: row.source ?? 'manual',

        statusPageToken: row.status_page_token ?? undefined,
        statusPageUrl: row.status_page_url ?? undefined,

        deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),

        basePoints: row.base_points ?? 0,
        totalPoints: row.total_points ?? 0,

        distributionStatus: row.distribution_status as Project['distributionStatus'],
        assignedAt: row.assigned_at ? new Date(row.assigned_at) : undefined,

        postSalesId: row.post_sales_id ?? undefined,
        postSalesName: row.post_sales_name ?? undefined,
        postSalesAssignedAt: row.post_sales_assigned_at ? new Date(row.post_sales_assigned_at) : undefined,

        deliveredToClientAt: row.delivered_to_client_at ? new Date(row.delivered_to_client_at) : undefined,
        deliveredToClientBy: row.delivered_to_client_by ?? undefined,
        clientApprovalStatus: row.client_approval_status as Project['clientApprovalStatus'],
        clientApprovedAt: row.client_approved_at ? new Date(row.client_approved_at) : undefined,
        paymentStatus: row.payment_status as Project['paymentStatus'],
        paymentReceivedAt: row.payment_received_at ? new Date(row.payment_received_at) : undefined,
        paymentReceivedBy: row.payment_received_by ?? undefined,

        clientRevisionCount: row.client_revision_count ?? 0,
        internalRevisionCount: row.internal_revision_count ?? 0,
        lastRevisionRequestedAt: row.last_revision_requested_at ? new Date(row.last_revision_requested_at) : undefined,
    } as Project;
};

const leadToDbUpdates = (updates: Partial<Lead>): Record<string, unknown> => {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.clientStatus !== undefined) dbUpdates.client_status = updates.clientStatus;
    if (updates.postSalesId !== undefined) dbUpdates.post_sales_id = updates.postSalesId;
    if (updates.postSalesAssignedAt !== undefined) {
        dbUpdates.post_sales_assigned_at = updates.postSalesAssignedAt instanceof Date
            ? updates.postSalesAssignedAt.toISOString()
            : updates.postSalesAssignedAt;
    }
    if (updates.postSalesDistributionStatus !== undefined) {
        dbUpdates.post_sales_distribution_status = updates.postSalesDistributionStatus;
    }
    if (updates.currentSector !== undefined) dbUpdates.current_sector = updates.currentSector;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.previousPostSalesIds !== undefined) dbUpdates.previous_post_sales_ids = updates.previousPostSalesIds;

    dbUpdates.updated_at = new Date().toISOString();
    return dbUpdates;
};

const appendUnique = (items: string[] | undefined, value: string): string[] => {
    const current = items ?? [];
    if (current.includes(value)) return current;
    return [...current, value];
};

const getLeadById = async (leadId: string): Promise<DistributionClient | null> => {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return rowToLead(data);
};

export const PostSalesDistributionService = {
    getDistributionQueue: async (): Promise<DistributionClient[]> => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('post_sales_distribution_status', 'pending')
            .eq('current_sector', 'distribution')
            .order('deal_closed_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(rowToLead);
    },

    subscribeToDistributionQueue: (callback: (clients: DistributionClient[]) => void) => {
        const fetchQueue = async () => {
            const items = await PostSalesDistributionService.getDistributionQueue();
            callback(items);
        };

        fetchQueue().catch((error) => {
            console.error('Error loading post-sales distribution queue:', error);
        });

        const channel = supabase
            .channel('postsales-distribution-queue')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                fetchQueue().catch((error) => {
                    console.error('Error refreshing post-sales distribution queue:', error);
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    calculatePostSalesWorkload: async (postSalesId: string): Promise<PostSalesWorkload> => {
        const { count, error } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('post_sales_id', postSalesId)
            .in('client_status', ACTIVE_CLIENT_STATUSES);

        if (error) throw error;

        return {
            postSalesId,
            postSalesName: '',
            activeClients: count ?? 0
        };
    },

    getAllPostSalesWorkload: async (postSalesIds: string[]): Promise<PostSalesWorkload[]> => {
        return Promise.all(
            postSalesIds.map(id => PostSalesDistributionService.calculatePostSalesWorkload(id))
        );
    },

    syncConversationAssignment: async (leadId: string, postSalesId: string): Promise<void> => {
        try {
            const now = new Date().toISOString();

            const { error } = await supabase
                .from('conversations')
                .update({
                    assigned_to: postSalesId,
                    post_sales_id: postSalesId,
                    context: 'post_sales',
                    status: 'open',
                    updated_at: now,
                } as Record<string, unknown>)
                .eq('lead_id', leadId);

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
        const existingLead = await getLeadById(leadId);
        const previousPostSalesId = existingLead?.postSalesId;
        const previousPostSalesIds = existingLead?.previousPostSalesIds;

        const updates = leadToDbUpdates({
            postSalesId,
            postSalesDistributionStatus: 'assigned',
            postSalesAssignedAt: new Date(),
            currentSector: 'pos_vendas',
            clientStatus: 'aguardando_projeto'
        });

        if (previousPostSalesId && previousPostSalesId !== postSalesId) {
            updates.previous_post_sales_ids = appendUnique(previousPostSalesIds, previousPostSalesId);
        }

        const { error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', leadId);

        if (error) throw error;

        await PostSalesDistributionService.syncConversationAssignment(leadId, postSalesId);
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
        const { error } = await supabase
            .from('leads')
            .update(leadToDbUpdates({ clientStatus: status }))
            .eq('id', leadId);

        if (error) throw error;
    },

    getProjectsByLeadId: async (leadId: string): Promise<Project[]> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(rowToProject);
    },

    syncLeadStatusFromProjects: async (leadId: string): Promise<void> => {
        const projects = await PostSalesDistributionService.getProjectsByLeadId(leadId);
        if (projects.length === 0) return;

        const allConcluded = projects.every(
            project => project.status === 'concluido' || project.paymentStatus === 'paid'
        );

        if (allConcluded) {
            const currentLead = await getLeadById(leadId);
            const nextTags = appendUnique(currentLead?.tags, 'cliente');

            const now = new Date().toISOString();
            const { error } = await supabase
                .from('leads')
                .update({
                    client_status: 'concluido',
                    current_sector: 'vendas',
                    post_sales_distribution_status: null,
                    completed_at: now,
                    updated_at: now,
                    tags: nextTags,
                })
                .eq('id', leadId);

            if (error) throw error;
            return;
        }

        const { error } = await supabase
            .from('leads')
            .update(leadToDbUpdates({
                clientStatus: getLeadClientStatusFromProjects(projects),
                currentSector: 'pos_vendas',
                postSalesDistributionStatus: 'assigned',
            }))
            .eq('id', leadId);

        if (error) throw error;
    },

    markProjectAsDelivered: async (
        leadId: string,
        projectId: string,
        deliveredByPostSalesId?: string
    ): Promise<void> => {
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('projects')
            .update({
                status: 'entregue',
                client_approval_status: 'pending',
                delivered_to_client_at: now,
                delivered_to_client_by: deliveredByPostSalesId || '',
                updated_at: now,
            })
            .eq('id', projectId);

        if (error) throw error;

        await ProjectStatusPageService.syncFromProjectId(projectId);
        await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
    },

    completeClient: async (leadId: string, projectId?: string, paymentReceivedBy?: string): Promise<void> => {
        if (projectId) {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('projects')
                .update({
                    payment_status: 'paid',
                    payment_received_at: now,
                    payment_received_by: paymentReceivedBy || '',
                    status: 'concluido',
                    updated_at: now,
                })
                .eq('id', projectId);

            if (error) throw error;

            await ProjectStatusPageService.syncFromProjectId(projectId);
            await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
            return;
        }

        const currentLead = await getLeadById(leadId);
        const nextTags = appendUnique(currentLead?.tags, 'cliente');
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('leads')
            .update({
                client_status: 'concluido',
                current_sector: 'vendas',
                post_sales_distribution_status: null,
                completed_at: now,
                updated_at: now,
                tags: nextTags,
            })
            .eq('id', leadId);

        if (error) throw error;
    },

    getClientsByAttendant: async (postSalesId: string): Promise<Lead[]> => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('post_sales_id', postSalesId)
            .in('client_status', [...ACTIVE_CLIENT_STATUSES, 'concluido'])
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(rowToLead);
    },

    subscribeToClientsByAttendant: (postSalesId: string, callback: (clients: Lead[]) => void) => {
        const fetchClients = async () => {
            const clients = await PostSalesDistributionService.getClientsByAttendant(postSalesId);
            callback(clients);
        };

        fetchClients().catch((error) => {
            console.error('Error loading clients by attendant:', error);
        });

        const channel = supabase
            .channel(`postsales-clients-${postSalesId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                fetchClients().catch((error) => {
                    console.error('Error refreshing clients by attendant:', error);
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    requestRevision: async (leadId: string, projectId: string, reason?: string): Promise<void> => {
        if (!projectId) {
            throw new Error('Project ID is required to request revision');
        }

        const now = new Date().toISOString();

        const { error: leadError } = await supabase
            .from('leads')
            .update({
                client_status: 'aguardando_alteracao',
                last_revision_requested_at: now,
                updated_at: now,
            } as Record<string, unknown>)
            .eq('id', leadId);

        if (leadError) throw leadError;

        const { data: projectData, error: projectFetchError } = await supabase
            .from('projects')
            .select('id, revision_count, client_revision_count')
            .eq('id', projectId)
            .maybeSingle();

        if (projectFetchError) throw projectFetchError;
        if (!projectData) throw new Error(`Project not found: ${projectId}`);

        const currentClientRevisionCount = Number((projectData as any).client_revision_count || 0);
        const currentRevisionCount = Number((projectData as any).revision_count || 0);

        const { error: projectUpdateError } = await supabase
            .from('projects')
            .update({
                status: 'alteracao_cliente',
                revision_count: currentRevisionCount + 1,
                client_revision_count: currentClientRevisionCount + 1,
                last_revision_requested_at: now,
                client_approval_status: 'changes_requested',
                updated_at: now,
            } as Record<string, unknown>)
            .eq('id', projectId);

        if (projectUpdateError) throw projectUpdateError;

        const { error: historyError } = await supabase
            .from('revision_history')
            .insert({
                project_id: projectId,
                type: 'client',
                reason: reason || '',
                requested_by: null,
                requested_by_name: 'Pós-Vendas',
                created_at: now,
            });

        if (historyError) throw historyError;

        await ProjectStatusPageService.syncFromProjectId(projectId);
        await PostSalesDistributionService.updateClientStatus(leadId, 'aguardando_alteracao');
    },

    approveClient: async (leadId: string, projectId?: string): Promise<void> => {
        if (!projectId) {
            throw new Error('Project ID is required to approve client');
        }

        const now = new Date().toISOString();

        const { error: leadError } = await supabase
            .from('leads')
            .update({
                client_status: 'aguardando_pagamento',
                client_approved_at: now,
                updated_at: now,
            } as Record<string, unknown>)
            .eq('id', leadId);

        if (leadError) throw leadError;

        const { error: projectError } = await supabase
            .from('projects')
            .update({
                client_approval_status: 'approved',
                client_approved_at: now,
                updated_at: now,
            })
            .eq('id', projectId);

        if (projectError) throw projectError;

        await ProjectStatusPageService.syncFromProjectId(projectId);
        await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
    }
};
