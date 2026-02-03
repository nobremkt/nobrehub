/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPES: LEAD
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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
