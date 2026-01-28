/**
 * Unified Data Models for Nobre CRM
 * Single source of truth for all shared types
 * Backend uses snake_case, frontend uses camelCase - conversion in supabaseApi.ts
 */

// ============ PIPELINE TYPES ============

export type PipelineType = 'high_ticket' | 'low_ticket' | 'production' | 'post_sales';

export const PIPELINE_LABELS: Record<PipelineType, string> = {
    high_ticket: 'High Ticket',
    low_ticket: 'Low Ticket',
    production: 'Produção',
    post_sales: 'Pós-Venda'
};

// ============ LEAD ============

export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone: string;
    company?: string;
    source?: string;
    pipeline?: PipelineType;
    statusHT?: string;
    statusLT?: string;
    statusProduction?: string;
    statusPostSales?: string;
    assignedTo?: string;
    assignedAgentId?: string;
    assignedAt?: string;
    estimatedValue?: number;
    tags?: string[];
    notes?: string;
    createdAt: string;
    updatedAt?: string;
    statusChangedAt?: string;
    contactReason?: string;
    lossReasonId?: string;
    lostAt?: string;
    lastMessageAt?: string;
    lastMessage?: string;
    lastMessageFrom?: 'in' | 'out';
    // Joined/nested data
    assignee?: { id: string; name: string; avatar?: string };
    lossReason?: { id: string; name: string; description?: string };
}

export interface CreateLeadData {
    name: string;
    email?: string;
    phone: string;
    company?: string;
    source?: string;
    pipeline: PipelineType;
    statusHT?: string;
    statusLT?: string;
    statusProduction?: string;
    statusPostSales?: string;
    estimatedValue?: number;
    tags?: string[];
    notes?: string;
}

// ============ USER ============

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    pipelineType?: string;
    isActive: boolean;
    avatar?: string;
    maxConcurrentChats?: number;
    currentChatCount?: number;
}

// ============ DASHBOARD ============

export interface DashboardStats {
    totalLeads: number;
    leadsToday: number;
    closedLeads: number;
    totalValue: number;
    highTicket: Array<{ status: string; count: number; value: number }>;
    lowTicket: Array<{ status: string; count: number; value: number }>;
}

// ============ LOSS REASONS ============

export interface LossReason {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

// ============ CONVERSATIONS ============

export interface Conversation {
    id: string;
    leadId: string;
    assignedTo?: string;
    assignedAgentId?: string;
    status: 'queued' | 'active' | 'hold' | 'closed' | 'open' | 'pending' | 'on_hold';
    channel: string;
    pipeline?: string;
    createdAt: string;
    updatedAt?: string;
    lastMessageAt?: string;
    metadata?: Record<string, unknown>;
    lead?: Lead;
    assignee?: User;
    assignedAgent?: { id: string; name: string };
    messages?: Array<{ id?: string; text?: string; content?: string; createdAt: string }>;
}

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    direction: 'in' | 'out';
    type: 'text' | 'image' | 'audio' | 'document' | 'template';
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    externalId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

// ============ DEALS ============

export interface Deal {
    id: string;
    leadId: string;
    productId?: string;
    product?: string | { id: string; name: string; price: number };
    origin?: string;
    value: number;
    status: 'open' | 'won' | 'lost' | string;
    stage?: string;
    pipeline?: string;
    ownerId?: string;
    owner?: { id: string; name: string };
    paymentMethod?: string;
    installments?: number;
    closedAt?: string;
    expectedCloseDate?: string;
    createdAt: string;
    updatedAt?: string;
}

// ============ CUSTOM FIELDS ============

export interface CustomField {
    id: string;
    name: string;
    key: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'email' | 'phone';
    entity: 'contact' | 'company' | 'deal';
    options?: string[];
    order: number;
    isVisible: boolean;
    isRequired: boolean;
    placeholder?: string;
    value?: string | null;
}

// ============ ACTIVITIES ============

export interface Activity {
    id: string;
    leadId: string;
    type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'task' | 'follow_up';
    title: string;
    description?: string;
    dueDate: string;
    status: 'pending' | 'completed' | 'skipped' | 'overdue';
    completedAt?: string;
    assignedTo?: string;
    templateId?: string;
    notes?: string;
    createdAt: string;
}

// ============ CHANNELS ============

export interface Channel {
    id: string;
    name: string;
    type: 'whatsapp_official' | 'whatsapp_api' | 'instagram' | 'email';
    isEnabled: boolean;
    status: 'connected' | 'disconnected' | 'error';
    number?: string;
    accountName?: string;
    config?: Record<string, unknown>;
}
