/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PRODUCTION SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { Project } from '@/types/project.types';
import { ProjectStatusPageService } from './ProjectStatusPageService';
import type { Database } from '@/types/supabase';

// ─── Supabase Row Types ──────────────────────────────────────────────
type ProjectRow = Database['public']['Tables']['projects']['Row'] & {
    // Columns exist in DB but may not be in auto-generated types
    lead_name?: string | null;
    producer_name?: string | null;
    post_sales_name?: string | null;
    suggested_producer_name?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────

/** Converte row do Supabase (snake_case) → Project (camelCase) */
function rowToProject(row: ProjectRow): Project {
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
        checklist: [], // Carregado separadamente se necessário
        source: row.source ?? 'manual',

        statusPageToken: row.status_page_token ?? undefined,
        statusPageUrl: row.status_page_url ?? undefined,

        deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),

        // Pontuação
        productType: row.product_type ?? undefined,
        productId: row.product_id ?? undefined,
        durationCategory: row.duration_category as Project['durationCategory'],
        basePoints: row.base_points ?? 0,
        extraPoints: row.extra_points ?? 0,
        totalPoints: row.total_points ?? 0,

        // Distribuição
        distributionStatus: row.distribution_status as Project['distributionStatus'],
        suggestedProducerId: row.suggested_producer_id ?? undefined,
        suggestedProducerName: row.suggested_producer_name ?? undefined,
        suggestionNotes: row.suggestion_notes ?? undefined,
        assignedByLeaderId: row.assigned_by_leader_id ?? undefined,
        assignedAt: row.assigned_at ? new Date(row.assigned_at) : undefined,

        // Pós-vendas
        postSalesId: row.post_sales_id ?? undefined,
        postSalesName: row.post_sales_name ?? undefined,
        postSalesAssignedAt: row.post_sales_assigned_at ? new Date(row.post_sales_assigned_at) : undefined,

        // Entrega & Aprovação
        deliveredToClientAt: row.delivered_to_client_at ? new Date(row.delivered_to_client_at) : undefined,
        deliveredToClientBy: row.delivered_to_client_by ?? undefined,
        clientApprovalStatus: row.client_approval_status as Project['clientApprovalStatus'],
        clientApprovedAt: row.client_approved_at ? new Date(row.client_approved_at) : undefined,
        clientFeedback: row.client_feedback ?? undefined,
        paymentStatus: row.payment_status as Project['paymentStatus'],
        paymentReceivedAt: row.payment_received_at ? new Date(row.payment_received_at) : undefined,
        paymentReceivedBy: row.payment_received_by ?? undefined,

        // Revisões
        internalRevisionCount: row.internal_revision_count ?? 0,
        clientRevisionCount: row.client_revision_count ?? 0,
    };
}

/** Converte campos parciais do Project → updates do banco (snake_case) */
function projectToDbUpdates(updates: Partial<Project>): Record<string, unknown> {
    const db: Record<string, unknown> = {};

    if (updates.name !== undefined) db.name = updates.name;
    if (updates.leadId !== undefined) db.lead_id = updates.leadId;
    if (updates.driveLink !== undefined) db.drive_link = updates.driveLink;
    if (updates.dueDate !== undefined) db.due_date = updates.dueDate instanceof Date ? updates.dueDate.toISOString() : updates.dueDate;
    if (updates.producerId !== undefined) db.producer_id = updates.producerId;
    if (updates.status !== undefined) db.status = updates.status;
    if (updates.priority !== undefined) db.priority = updates.priority;
    if (updates.notes !== undefined) db.notes = updates.notes;
    if (updates.source !== undefined) db.source = updates.source;

    if (updates.statusPageToken !== undefined) db.status_page_token = updates.statusPageToken;
    if (updates.statusPageUrl !== undefined) db.status_page_url = updates.statusPageUrl;
    if (updates.deliveredAt !== undefined) db.delivered_at = updates.deliveredAt instanceof Date ? updates.deliveredAt.toISOString() : updates.deliveredAt;

    // Pontuação
    if (updates.productType !== undefined) db.product_type = updates.productType;
    if (updates.productId !== undefined) db.product_id = updates.productId;
    if (updates.durationCategory !== undefined) db.duration_category = updates.durationCategory;
    if (updates.basePoints !== undefined) db.base_points = updates.basePoints;
    if (updates.extraPoints !== undefined) db.extra_points = updates.extraPoints;

    // Distribuição
    if (updates.distributionStatus !== undefined) db.distribution_status = updates.distributionStatus;
    if (updates.suggestedProducerId !== undefined) db.suggested_producer_id = updates.suggestedProducerId;
    if (updates.suggestedProducerName !== undefined) db.suggested_producer_name = updates.suggestedProducerName;
    if (updates.suggestionNotes !== undefined) db.suggestion_notes = updates.suggestionNotes;
    if (updates.assignedByLeaderId !== undefined) db.assigned_by_leader_id = updates.assignedByLeaderId;
    if (updates.assignedAt !== undefined) db.assigned_at = updates.assignedAt instanceof Date ? updates.assignedAt.toISOString() : updates.assignedAt;

    // Pós-vendas
    if (updates.postSalesId !== undefined) db.post_sales_id = updates.postSalesId;
    if (updates.postSalesName !== undefined) db.post_sales_name = updates.postSalesName;
    if (updates.postSalesAssignedAt !== undefined) db.post_sales_assigned_at = updates.postSalesAssignedAt instanceof Date ? updates.postSalesAssignedAt.toISOString() : updates.postSalesAssignedAt;

    // Entrega & Aprovação
    if (updates.deliveredToClientAt !== undefined) db.delivered_to_client_at = updates.deliveredToClientAt instanceof Date ? updates.deliveredToClientAt.toISOString() : updates.deliveredToClientAt;
    if (updates.deliveredToClientBy !== undefined) db.delivered_to_client_by = updates.deliveredToClientBy;
    if (updates.clientApprovalStatus !== undefined) db.client_approval_status = updates.clientApprovalStatus;
    if (updates.clientApprovedAt !== undefined) db.client_approved_at = updates.clientApprovedAt instanceof Date ? updates.clientApprovedAt.toISOString() : updates.clientApprovedAt;
    if (updates.clientFeedback !== undefined) db.client_feedback = updates.clientFeedback;
    if (updates.paymentStatus !== undefined) db.payment_status = updates.paymentStatus;
    if (updates.paymentReceivedAt !== undefined) db.payment_received_at = updates.paymentReceivedAt instanceof Date ? updates.paymentReceivedAt.toISOString() : updates.paymentReceivedAt;
    if (updates.paymentReceivedBy !== undefined) db.payment_received_by = updates.paymentReceivedBy;

    // Revisões
    if (updates.internalRevisionCount !== undefined) db.internal_revision_count = updates.internalRevisionCount;
    if (updates.clientRevisionCount !== undefined) db.client_revision_count = updates.clientRevisionCount;

    return db;
}

// ─── Service ─────────────────────────────────────────────────────────

export const ProductionService = {
    /**
     * Busca projetos de um produtor específico
     */
    getProjectsByProducer: async (producerId: string): Promise<Project[]> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('producer_id', producerId)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return (data ?? []).map(rowToProject);
    },

    /**
     * Busca projetos globalmente (pelo nome) — agora com ILIKE nativo!
     */
    searchAllProjects: async (term: string): Promise<Project[]> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .or(`name.ilike.%${term}%`)
            .order('updated_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        return (data ?? []).map(rowToProject);
    },

    /**
     * Cria um novo projeto
     */
    createProject: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const statusPageToken = project.statusPageToken || ProjectStatusPageService.generateToken();
        const statusPageUrl = project.statusPageUrl || ProjectStatusPageService.buildStatusPageUrl(statusPageToken);

        const dbData = {
            ...projectToDbUpdates(project as Partial<Project>),
            status_page_token: statusPageToken,
            status_page_url: statusPageUrl,
        };

        const { data, error } = await supabase
            .from('projects')
            .insert(dbData as any)
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Atualiza um projeto existente
     */
    updateProject: async (id: string, updates: Partial<Project>): Promise<void> => {
        const dbUpdates = projectToDbUpdates(updates);

        const { error } = await supabase
            .from('projects')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;

        // Sync public status page
        await ProjectStatusPageService.syncFromProjectId(id);
    },

    /**
     * Exclui um projeto
     */
    deleteProject: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Subscribe em tempo real para projetos de um produtor (Supabase Realtime)
     */
    subscribeProjectsByProducer: (producerId: string, callback: (projects: Project[]) => void) => {
        // Fetch inicial
        ProductionService.getProjectsByProducer(producerId).then(callback);

        // Realtime channel
        const channel = supabase
            .channel(`projects-producer-${producerId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'projects', filter: `producer_id=eq.${producerId}` },
                () => {
                    // Refetch on any change
                    ProductionService.getProjectsByProducer(producerId).then(callback);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Busca todos os projetos vinculados a um lead
     */
    getProjectsByLeadId: async (leadId: string): Promise<Project[]> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []).map(rowToProject);
    },

    /**
     * Busca projeto vinculado a um lead específico (o mais recente)
     */
    getProjectByLeadId: async (leadId: string): Promise<Project | null> => {
        const projects = await ProductionService.getProjectsByLeadId(leadId);
        return projects[0] || null;
    },

    /**
     * Subscribe em tempo real para projetos de um lead
     */
    subscribeToProjectsByLeadId: (leadId: string, callback: (projects: Project[]) => void) => {
        // Fetch inicial
        ProductionService.getProjectsByLeadId(leadId).then(callback);

        const channel = supabase
            .channel(`projects-lead-${leadId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'projects', filter: `lead_id=eq.${leadId}` },
                () => {
                    ProductionService.getProjectsByLeadId(leadId).then(callback);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Subscribe em tempo real para UM projeto de um lead (o mais recente)
     */
    subscribeToProjectByLeadId: (leadId: string, callback: (project: Project | null) => void) => {
        return ProductionService.subscribeToProjectsByLeadId(leadId, (projects) => {
            callback(projects[0] || null);
        });
    },

    /**
     * Sincroniza os dados públicos da página de status de um projeto.
     */
    syncPublicStatusPage: async (projectId: string): Promise<void> => {
        await ProjectStatusPageService.syncFromProjectId(projectId);
    },

    /**
     * Busca um projeto por ID.
     */
    getProjectById: async (projectId: string): Promise<Project | null> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;
        return rowToProject(data);
    },
};
