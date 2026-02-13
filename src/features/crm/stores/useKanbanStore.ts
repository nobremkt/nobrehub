import { create } from 'zustand';
import { Lead, PipelineStage } from '@/types/lead.types';
import { LeadService } from '../services/LeadService';
import { PipelineService } from '@/features/settings/services/PipelineService';

export type PipelineType = 'high-ticket' | 'low-ticket';

interface KanbanState {
    leads: Lead[];
    stages: PipelineStage[];
    activePipeline: PipelineType;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchLeads: () => Promise<void>;
    fetchStages: () => Promise<void>;
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

export const useKanbanStore = create<KanbanState>((set, get) => ({
    leads: [],
    stages: [],
    activePipeline: 'high-ticket',
    isLoading: false,
    error: null,

    fetchStages: async () => {
        try {
            let stages = await PipelineService.getStages();
            // Se não existirem stages no Firestore, faz seed dos padrão
            if (stages.length === 0) {
                stages = await PipelineService.seedDefaultStages();
            }
            set({ stages });
        } catch (error: unknown) {
            console.error('Failed to fetch pipeline stages:', error);
        }
    },

    fetchLeads: async () => {
        set({ isLoading: true, error: null });
        try {
            // Carrega stages junto se ainda não carregou
            if (get().stages.length === 0) {
                await get().fetchStages();
            }
            const leads = await LeadService.getLeads();
            set({ leads, isLoading: false });
        } catch (error: unknown) {
            console.error('Failed to fetch leads:', error);
            set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
        }
    },

    addLead: async (leadData) => {
        try {
            const newLead = await LeadService.createLead(leadData);
            set(state => ({ leads: [newLead, ...state.leads] }));
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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
            const minOrder = leadsInTarget.length > 0
                ? Math.min(...leadsInTarget.map(l => l.order)) - 1
                : 0;

            return {
                leads: state.leads.map((lead) =>
                    lead.id === leadId
                        ? { ...lead, status: newStatus, order: minOrder, updatedAt: new Date() }
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
        return get().stages
            .filter(stage => stage.pipeline === pipeline)
            .sort((a, b) => a.order - b.order);
    },

    getLeadsByStage: (stageId) => {
        return get().leads
            .filter(lead => lead.status === stageId)
            .sort((a, b) => a.order - b.order);
    }
}));
