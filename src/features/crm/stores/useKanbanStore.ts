import { create } from 'zustand';
import { Lead, PipelineStage } from '@/types/lead.types';
import { LeadService } from '../services/LeadService';

export type PipelineType = 'high-ticket' | 'low-ticket';

interface KanbanState {
    leads: Lead[];
    stages: PipelineStage[];
    activePipeline: PipelineType;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchLeads: () => Promise<void>;
    addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;

    setLeads: (leads: Lead[]) => void;
    setStages: (stages: PipelineStage[]) => void;

    moveLead: (leadId: string, newStatus: string) => Promise<void>;
    reorderLead: (leadId: string, targetStatus: string, newIndex: number) => Promise<void>;

    setActivePipeline: (pipeline: PipelineType) => void;

    // Getters
    getStagesByPipeline: (pipeline: PipelineType) => PipelineStage[];
    getLeadsByStage: (stageId: string) => Lead[];
}

const MOCK_STAGES: PipelineStage[] = [
    // High Ticket Pipeline
    { id: 'ht-novo', name: 'Novo Lead', color: '#6366F1', order: 0, pipeline: 'venda' },
    { id: 'ht-qualificacao', name: 'Qualificação', color: '#F59E0B', order: 1, pipeline: 'venda' },
    { id: 'ht-proposta', name: 'Proposta Enviada', color: '#8B5CF6', order: 2, pipeline: 'venda' },
    { id: 'ht-negociacao', name: 'Em Negociação', color: '#EC4899', order: 3, pipeline: 'venda' },
    { id: 'ht-fechado', name: 'Fechado Ganho', color: '#10B981', order: 4, pipeline: 'venda' },

    // Low Ticket Pipeline
    { id: 'lt-entrada', name: 'Entrada', color: '#3B82F6', order: 0, pipeline: 'pos-venda' },
    { id: 'lt-interesse', name: 'Demonstrou Interesse', color: '#F59E0B', order: 1, pipeline: 'pos-venda' },
    { id: 'lt-carrinho', name: 'Carrinho', color: '#8B5CF6', order: 2, pipeline: 'pos-venda' },
    { id: 'lt-compra', name: 'Compra Realizada', color: '#10B981', order: 3, pipeline: 'pos-venda' },
];

export const useKanbanStore = create<KanbanState>((set, get) => ({
    leads: [], // Initialize empty
    stages: MOCK_STAGES,
    activePipeline: 'high-ticket',
    isLoading: false,
    error: null,

    fetchLeads: async () => {
        set({ isLoading: true, error: null });
        try {
            const leads = await LeadService.getLeads();
            set({ leads, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch leads:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addLead: async (leadData) => {
        try {
            const newLead = await LeadService.createLead(leadData);
            set(state => ({ leads: [newLead, ...state.leads] }));
        } catch (error: any) {
            console.error('Failed to create lead:', error);
            throw error;
        }
    },

    updateLead: async (leadId, updates) => {
        // Optimistic update
        set((state) => ({
            leads: state.leads.map((lead) =>
                lead.id === leadId ? { ...lead, ...updates } : lead
            ),
        }));

        try {
            await LeadService.updateLead(leadId, updates);
        } catch (error: any) {
            console.error('Failed to update lead:', error);
            // Revert needed? Ideally yes, but skipping complex revert logic for now
            // Just fetching fresh data might be safer
            get().fetchLeads();
            throw error;
        }
    },

    setLeads: (leads) => set({ leads }),
    setStages: (stages) => set({ stages }),

    // Move simples (apenas muda coluna, adiciona no final)
    moveLead: async (leadId, newStatus) => {
        // Optimistic update
        const previousLeads = get().leads;

        set((state) => {
            const leadsInTarget = state.leads.filter(l => l.status === newStatus);
            const maxOrder = leadsInTarget.length > 0
                ? Math.max(...leadsInTarget.map(l => l.order)) + 1
                : 0;

            return {
                leads: state.leads.map((lead) =>
                    lead.id === leadId
                        ? { ...lead, status: newStatus, order: maxOrder, updatedAt: new Date() }
                        : lead
                ),
            };
        });

        // Sync with backend
        try {
            const updatedLead = get().leads.find(l => l.id === leadId);
            if (updatedLead) {
                await LeadService.updateLead(leadId, {
                    status: newStatus,
                    order: updatedLead.order
                });
            }
        } catch (error) {
            console.error('Failed to move lead:', error);
            set({ leads: previousLeads }); // Revert on error
            throw error;
        }
    },

    // Reordenação completa (muda coluna E posição)
    reorderLead: async (leadId, targetStatus, newIndex) => {
        // Optimistic update
        const previousLeads = get().leads;

        set((state) => {
            const leadToMove = state.leads.find(l => l.id === leadId);
            if (!leadToMove) return state;

            const sourceStatus = leadToMove.status;
            const isSameColumn = sourceStatus === targetStatus;

            // Pega todos os leads da coluna de destino (excluindo o que está sendo movido)
            let targetColumnLeads = state.leads
                .filter(l => l.status === targetStatus && l.id !== leadId)
                .sort((a, b) => a.order - b.order);

            // Insere o lead na nova posição
            targetColumnLeads.splice(newIndex, 0, { ...leadToMove, status: targetStatus });

            // Recalcula os orders da coluna de destino
            targetColumnLeads = targetColumnLeads.map((lead, index) => ({
                ...lead,
                order: index,
                updatedAt: lead.id === leadId ? new Date() : lead.updatedAt,
            }));

            // Se mudou de coluna, também precisa recalcular a coluna de origem
            let sourceColumnLeads: Lead[] = [];
            if (!isSameColumn) {
                sourceColumnLeads = state.leads
                    .filter(l => l.status === sourceStatus && l.id !== leadId)
                    .sort((a, b) => a.order - b.order)
                    .map((lead, index) => ({ ...lead, order: index }));
            }

            // Reconstrói o array de leads
            const otherLeads = state.leads.filter(l =>
                l.status !== targetStatus && (isSameColumn || l.status !== sourceStatus)
            );

            return {
                leads: [...otherLeads, ...targetColumnLeads, ...sourceColumnLeads],
            };
        });

        // Sync with backend
        try {
            // We need to update order for ALL affected leads in target column (and source if different)
            // Ideally, we batch these updates. For simplicity, we loop.
            const currentLeads = get().leads;

            // Leads in target status that need update
            const targetUpdates = currentLeads
                .filter(l => l.status === targetStatus)
                .map(l => LeadService.updateLead(l.id, { status: l.status, order: l.order }));

            await Promise.all(targetUpdates);

        } catch (error) {
            console.error('Failed to reorder lead:', error);
            set({ leads: previousLeads }); // Revert on error
            throw error;
        }
    },

    setActivePipeline: (pipeline) => set({ activePipeline: pipeline }),

    getStagesByPipeline: (pipeline) => {
        const pipelineKey = pipeline === 'high-ticket' ? 'venda' : 'pos-venda';
        return get().stages
            .filter(stage => stage.pipeline === pipelineKey)
            .sort((a, b) => a.order - b.order);
    },

    getLeadsByStage: (stageId) => {
        return get().leads
            .filter(lead => lead.status === stageId)
            .sort((a, b) => a.order - b.order);
    }
}));
