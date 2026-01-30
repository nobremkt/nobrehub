import { create } from 'zustand';
import { Lead, PipelineStage } from '@/types/lead.types';

export type PipelineType = 'high-ticket' | 'low-ticket';

interface KanbanState {
    leads: Lead[];
    stages: PipelineStage[];
    activePipeline: PipelineType;

    // Actions
    setLeads: (leads: Lead[]) => void;
    setStages: (stages: PipelineStage[]) => void;
    moveLead: (leadId: string, newStatus: string) => void;
    reorderLead: (leadId: string, targetStatus: string, newIndex: number) => void;
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

const MOCK_LEADS: Lead[] = [
    {
        id: 'lead-1',
        name: 'João Silva',
        company: 'Tech Solutions LTDA',
        pipeline: 'venda',
        status: 'ht-novo',
        order: 0,
        estimatedValue: 15000,
        tags: ['Quente', 'Indicação'],
        responsibleId: 'user1',
        phone: '11999999999',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'lead-2',
        name: 'Maria Santos',
        company: 'Marketing Pro',
        pipeline: 'venda',
        status: 'ht-proposta',
        order: 0,
        estimatedValue: 25000,
        tags: ['Empresa'],
        responsibleId: 'user1',
        phone: '11988888888',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 1800000),
    },
    {
        id: 'lead-3',
        name: 'Pedro Oliveira',
        company: 'Construtora ABC',
        pipeline: 'venda',
        status: 'ht-fechado',
        order: 0,
        estimatedValue: 45000,
        tags: ['Grande Porte'],
        responsibleId: 'user2',
        phone: '11977777777',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 43200000),
    },
    {
        id: 'lead-4',
        name: 'Ana Costa',
        company: 'Design Studio',
        pipeline: 'venda',
        status: 'ht-novo',
        order: 1,
        estimatedValue: 8500,
        tags: ['Novo'],
        responsibleId: 'user1',
        phone: '11966666666',
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 3600000),
    },
    {
        id: 'lead-5',
        name: 'Carlos Mendes',
        company: 'Agência Digital',
        pipeline: 'venda',
        status: 'ht-qualificacao',
        order: 0,
        estimatedValue: 12000,
        tags: ['Urgente'],
        responsibleId: 'user1',
        phone: '11955555555',
        createdAt: new Date(Date.now() - 10800000),
        updatedAt: new Date(Date.now() - 5400000),
    },
    {
        id: 'lead-6',
        name: 'Fernanda Lima',
        company: 'E-commerce Plus',
        pipeline: 'pos-venda',
        status: 'lt-entrada',
        order: 0,
        estimatedValue: 297,
        tags: ['Curso'],
        responsibleId: 'user1',
        phone: '11944444444',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'lead-7',
        name: 'Ricardo Souza',
        company: '',
        pipeline: 'pos-venda',
        status: 'lt-interesse',
        order: 0,
        estimatedValue: 497,
        tags: ['Mentoria'],
        responsibleId: 'user2',
        phone: '11933333333',
        createdAt: new Date(Date.now() - 1800000),
        updatedAt: new Date(),
    },
];

export const useKanbanStore = create<KanbanState>((set, get) => ({
    leads: MOCK_LEADS,
    stages: MOCK_STAGES,
    activePipeline: 'high-ticket',

    setLeads: (leads) => set({ leads }),
    setStages: (stages) => set({ stages }),

    // Move simples (apenas muda coluna, adiciona no final)
    moveLead: (leadId, newStatus) => {
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
    },

    // Reordenação completa (muda coluna E posição)
    reorderLead: (leadId, targetStatus, newIndex) => {
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
