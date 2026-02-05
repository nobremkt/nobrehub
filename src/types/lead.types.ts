/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPES: LEAD
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Status do negócio fechado
export type DealStatus = 'open' | 'won' | 'lost';

// Status do cliente no pós-vendas (para filtros do inbox)
export type ClientStatus =
    | 'aguardando_projeto'    // Projeto em produção
    | 'aguardando_alteracao'  // Alteração solicitada
    | 'entregue'              // Entregue, aguardando aprovação
    | 'aguardando_pagamento'  // Aprovado, aguardando pagamento
    | 'concluido';            // 100% finalizado

// Em qual setor/inbox o cliente está
export type ClientSector = 'vendas' | 'pos_vendas' | 'distribution';

export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone: string;
    company?: string;
    pipeline: 'high-ticket' | 'low-ticket';
    status: string;
    order: number; // Posição do lead dentro da coluna
    estimatedValue?: number;
    tags: string[];
    responsibleId: string;
    customFields?: Record<string, unknown>;
    notes?: string;
    lostReason?: string;
    lostAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    // ═══════════════ PÓS-VENDAS ═══════════════

    // Pós-venda responsável
    postSalesId?: string;
    postSalesAssignedAt?: Date;
    postSalesDistributionStatus?: 'pending' | 'assigned';

    // Negócio fechado
    dealStatus?: DealStatus;
    dealValue?: number;
    dealClosedAt?: Date;
    dealProductId?: string;
    dealNotes?: string;

    // Status do cliente no pós-vendas
    clientStatus?: ClientStatus;

    // Setor atual (vendas ou pós-vendas)
    currentSector?: ClientSector;

    // Projetos vinculados (cliente pode ter múltiplos)
    projectIds?: string[];

    // Histórico de atendimento (para lista de distribuição)
    previousPostSalesIds?: string[];
    previousProducerIds?: string[];

    // Temperatura do lead
    temperature?: 'cold' | 'warm' | 'hot';
}

export interface LeadActivity {
    id: string;
    leadId: string;
    type: 'message' | 'call' | 'email' | 'note' | 'status_change' | 'assignment';
    description: string;
    userId: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

export interface PipelineStage {
    id: string;
    name: string;
    color: string;
    order: number;
    pipeline: 'high-ticket' | 'low-ticket';
    isDefault?: boolean;
}

export interface LossReason {
    id: string;
    name: string;
    isActive: boolean;
}
