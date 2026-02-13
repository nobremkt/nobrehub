/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PRODUCTION DISTRIBUTION SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Gerencia a lista de distribuição de projetos para produtores
 * Só o líder de produção tem acesso a essas funções
 */

import { supabase } from '@/config/supabase';
import { Project, DistributionStatus } from '@/types/project.types';
import { ProjectStatusPageService } from './ProjectStatusPageService';
import type { Database } from '@/types/supabase';

// ─── Supabase Row Types ──────────────────────────────────────────────
type ProjectRow = Database['public']['Tables']['projects']['Row'] & {
    lead_name?: string | null;
    producer_name?: string | null;
    suggested_producer_name?: string | null;
};

// Tipo para informações de carga de trabalho do produtor
interface ProducerWorkload {
    producerId: string;
    producerName: string;
    activeProjects: number;  // Projetos não finalizados
    totalPoints: number;     // Soma dos pontos dos projetos ativos
}

// Tipo para projeto na lista de distribuição
interface DistributionProject extends Project {
    isHighlighted?: boolean; // Se tem sugestão de produtor
}

/** Converte row do Supabase → DistributionProject */
function rowToDistributionProject(row: ProjectRow): DistributionProject {
    return {
        id: row.id,
        name: row.name,
        leadId: row.lead_id,
        leadName: row.lead_name || '',
        driveLink: row.drive_link ?? undefined,
        dueDate: row.due_date ? new Date(row.due_date) : new Date(),
        producerId: row.producer_id ?? '',
        producerName: row.producer_name || '',
        status: row.status,
        priority: row.priority,
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

        distributionStatus: row.distribution_status as DistributionStatus,
        suggestedProducerId: row.suggested_producer_id ?? undefined,
        suggestedProducerName: row.suggested_producer_name ?? undefined,
        suggestionNotes: row.suggestion_notes ?? undefined,
        assignedByLeaderId: row.assigned_by_leader_id ?? undefined,
        assignedAt: row.assigned_at ? new Date(row.assigned_at) : undefined,

        isHighlighted: row.distribution_status === 'suggested',
    } as DistributionProject;
}

export const ProductionDistributionService = {
    /**
     * Busca projetos na lista de distribuição (pending ou suggested)
     * Só retorna projetos que ainda não foram atribuídos
     */
    getDistributionQueue: async (): Promise<DistributionProject[]> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .in('distribution_status', ['pending', 'suggested'])
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data ?? []).map(rowToDistributionProject);
    },

    /**
     * Subscribe em tempo real para a lista de distribuição
     */
    subscribeToDistributionQueue: (callback: (projects: DistributionProject[]) => void) => {
        // Fetch inicial
        ProductionDistributionService.getDistributionQueue().then(callback);

        const channel = supabase
            .channel('distribution-queue')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => {
                    ProductionDistributionService.getDistributionQueue().then(callback);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },

    /**
     * Calcula a carga de trabalho de um produtor
     * Considera projetos ativos (não finalizados) e seus pontos
     */
    calculateProducerWorkload: async (producerId: string): Promise<ProducerWorkload> => {
        // Projetos ativos = NÃO estão em 'entregue' ou 'concluido'
        const { data, error } = await supabase
            .from('projects')
            .select('producer_id, total_points, base_points')
            .eq('producer_id', producerId)
            .not('status', 'in', '("entregue","concluido")');

        if (error) throw error;

        const rows = data ?? [];
        let totalPoints = 0;
        rows.forEach((r) => {
            totalPoints += r.total_points || r.base_points || 1;
        });

        // Get producer name from users table
        let producerName = '';
        const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', producerId)
            .maybeSingle();
        if (userData) producerName = userData.name;

        return {
            producerId,
            producerName,
            activeProjects: rows.length,
            totalPoints,
        };
    },

    /**
     * Busca carga de trabalho de todos os produtores
     */
    getAllProducersWorkload: async (producerIds: string[]): Promise<ProducerWorkload[]> => {
        const workloads = await Promise.all(
            producerIds.map(id => ProductionDistributionService.calculateProducerWorkload(id))
        );
        return workloads;
    },

    /**
     * Atribui projeto manualmente para um produtor (líder decide)
     */
    assignToProducer: async (
        projectId: string,
        producerId: string,
        producerName: string,
        assignedByLeaderId: string
    ): Promise<void> => {
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('projects')
            .update({
                producer_id: producerId,
                producer_name: producerName,
                distribution_status: 'assigned' as DistributionStatus,
                assigned_by_leader_id: assignedByLeaderId,
                assigned_at: now,
                status: 'aguardando',
            })
            .eq('id', projectId);

        if (error) throw error;

        await ProjectStatusPageService.syncFromProjectId(projectId);
    },

    /**
     * Distribui automaticamente para o produtor com menor carga
     * NÃO distribui projetos com sugestão (esses são manuais)
     */
    autoAssignProject: async (
        projectId: string,
        producerIds: string[],
        assignedByLeaderId: string
    ): Promise<{ producerId: string; producerName: string } | null> => {
        // Check if project has suggestion
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('distribution_status, suggested_producer_id')
            .eq('id', projectId)
            .single();

        if (fetchError) throw fetchError;

        // Se tem sugestão, não distribui automaticamente
        if (project.distribution_status === 'suggested' && project.suggested_producer_id) {
            return null;
        }

        // Calcula carga de todos os produtores
        const workloads = await ProductionDistributionService.getAllProducersWorkload(producerIds);

        // Ordena por pontos totais (menor primeiro)
        workloads.sort((a, b) => a.totalPoints - b.totalPoints);

        const selected = workloads[0];
        if (!selected) throw new Error('No producers available');

        // Atribui
        await ProductionDistributionService.assignToProducer(
            projectId,
            selected.producerId,
            selected.producerName,
            assignedByLeaderId
        );

        return {
            producerId: selected.producerId,
            producerName: selected.producerName,
        };
    },

    /**
     * Distribui automaticamente todos os projetos pendentes (sem sugestão)
     */
    autoAssignAllPending: async (
        producerIds: string[],
        assignedByLeaderId: string
    ): Promise<number> => {
        const queue = await ProductionDistributionService.getDistributionQueue();

        // Filtra apenas projetos sem sugestão
        const pendingOnly = queue.filter(p => p.distributionStatus === 'pending');

        let assigned = 0;
        for (const project of pendingOnly) {
            const result = await ProductionDistributionService.autoAssignProject(
                project.id,
                producerIds,
                assignedByLeaderId
            );
            if (result) assigned++;
        }

        return assigned;
    },
};
