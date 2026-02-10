/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPES: PROJECT (PRODUCTION)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Status do projeto na produção
export type ProjectStatus =
    | 'aguardando'           // Na lista, aguardando início
    | 'em-producao'          // Em produção
    | 'a-revisar'            // Aguardando revisão do líder
    | 'revisado'             // Revisado, pronto pra entregar
    | 'alteracao'            // (legacy) Manter backward compat
    | 'alteracao_interna'    // Líder revisou e pediu ajuste (não saiu da produção)
    | 'alteracao_cliente'    // Cliente solicitou alteração via pós-vendas
    | 'entregue'             // Enviado ao cliente
    | 'concluido';           // 100% finalizado

// Status na lista de distribuição
export type DistributionStatus = 'pending' | 'assigned' | 'suggested';

// Status de aprovação do cliente
export type ClientApprovalStatus = 'pending' | 'approved' | 'changes_requested';

// Status de pagamento
export type PaymentStatus = 'pending' | 'partial' | 'paid';

// Categoria de duração de vídeo (para pontuação)
export type VideoDurationCategory = '30s' | '60s' | '60plus';

// Tipo de revisão
export type RevisionSource = 'internal' | 'client';

// Entrada individual no histórico de revisões
export interface RevisionEntry {
    type: RevisionSource;
    reason?: string;
    requestedBy: string;       // userId
    requestedByName: string;   // nome legível
    requestedAt: Date;
}

export interface Project {
    id: string;
    name: string;
    leadId: string;
    leadName: string;
    driveLink?: string;
    dueDate: Date;
    producerId: string;
    producerName: string;
    status: ProjectStatus;
    priority?: 'normal' | 'high';
    notes?: string;
    checklist: ProjectChecklistItem[];

    // Extensibility fields
    source: 'manual' | 'automation' | string;
    externalId?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    statusPageToken?: string;               // Token público da página de status
    statusPageUrl?: string;                 // URL pública da página de status

    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    // ═══════════════ PONTUAÇÃO (METAS) ═══════════════

    productType?: string;                    // Tipo do produto (nome)
    productId?: string;                      // ID do produto na collection products
    durationCategory?: VideoDurationCategory; // Duração do vídeo (se aplicável)
    basePoints?: number;                     // Pontos base do produto
    extraPoints?: number;                    // Pontos extras (complexidade)
    totalPoints?: number;                    // basePoints + extraPoints

    // ═══════════════ DISTRIBUIÇÃO ═══════════════

    distributionStatus?: DistributionStatus;
    suggestedProducerId?: string;           // Produtor sugerido pela vendedora
    suggestedProducerName?: string;
    suggestionNotes?: string;               // Observações da vendedora
    assignedByLeaderId?: string;            // Líder que atribuiu
    assignedAt?: Date;                      // Quando foi atribuído

    // ═══════════════ PÓS-VENDAS ═══════════════

    postSalesId?: string;                   // Responsável pós-venda
    postSalesName?: string;
    postSalesAssignedAt?: Date;

    // Entrega ao cliente
    deliveredToClientAt?: Date;
    deliveredToClientBy?: string;

    // Aprovação do cliente
    clientApprovalStatus?: ClientApprovalStatus;
    clientApprovedAt?: Date;
    clientFeedback?: string;

    // Pagamento
    paymentStatus?: PaymentStatus;
    paymentReceivedAt?: Date;
    paymentReceivedBy?: string;

    // ═══════════════ REVISÕES ═══════════════

    revisionCount?: number;                 // (legacy) Total genérico
    internalRevisionCount?: number;         // Revisões internas (produção)
    clientRevisionCount?: number;           // Revisões do cliente (pós-vendas)
    revisionHistory?: RevisionEntry[];      // Log completo de todas as revisões
    lastRevisionRequestedAt?: Date;
    lastRevisionRequestedBy?: string;
}

export interface ProjectChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    order: number;
}

export interface ProjectHistory {
    id: string;
    projectId: string;
    action: 'created' | 'status_changed' | 'assigned' | 'delivered' | 'revision_requested';
    fromStatus?: ProjectStatus;
    toStatus?: ProjectStatus;
    userId: string;
    notes?: string;
    createdAt: Date;
}
