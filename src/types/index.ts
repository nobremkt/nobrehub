// Unified Types for Nobre CRM
// Uses hyphen format ('high-ticket') for frontend consistency with AI Studio prototype
// Backend API returns underscore format - conversion handled in api.ts

export type PipelineType = 'high-ticket' | 'low-ticket';

export const PIPELINE_LABELS: Record<PipelineType, string> = {
  'high-ticket': 'High Ticket',
  'low-ticket': 'Low Ticket'
};

export type LeadSource = 'website' | 'whatsapp' | 'instagram' | 'linkedin' | 'referral' | 'ads' | 'other';

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Site Oficial',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  referral: 'Indicação',
  ads: 'Tráfego Pago',
  other: 'Outros'
};

export type LeadStatus = string;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  // High Ticket
  novo: 'Novo Lead',
  qualificado: 'Qualificado',
  apresentacao: 'Apresentação',
  fechamento: 'Fechamento',
  contrato: 'Contrato',

  // Low Ticket
  lead: 'Entrada',
  conversao: 'Conversão',
  checkout: 'Checkout',
  recuperacao: 'Recuperação',
  pago: 'Pago',

  // Common
  perdido: 'Perdido',
};

// Main Lead interface - unified with Contact
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  source?: LeadSource;
  status: LeadStatus;
  pipeline: PipelineType;
  value?: number;
  tags?: string[];
  notes?: string;
  assignedTo?: string;
  assignedAgentId?: string; // For chat assignment
  scoreAi?: number;
  lastMessage?: string;
  chatStatus?: 'open' | 'pending' | 'closed';
  language?: string;
  origin?: string; // Lead source display
  createdAt?: Date;
  updatedAt?: Date;
}

// Alias for backward compatibility
export type Contact = Lead;

export type AgentRole = 'admin' | 'sdr' | 'closer' | 'manager';

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  status: 'online' | 'offline' | 'busy';
  activeChats: number;
  completedChats: number;
  permissions: {
    dashboard: boolean;
    leads: boolean;
    team: boolean;
    chat: boolean;
    flows: boolean;
  };
}

export interface Message {
  id: string;
  text: string;
  direction: 'in' | 'out';
  timestamp: string;
  type: 'text' | 'audio' | 'image';
  agentName?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: Lead[];
}

export type ViewType = 'kanban' | 'leads' | 'chat' | 'flows' | 'analytics' | 'team';

export const HIGH_TICKET_STAGES = [
  { id: 'novo', name: 'Novo Lead', color: 'rose' },
  { id: 'qualificado', name: 'Qualificado', color: 'emerald' },
  { id: 'apresentacao', name: 'Apresentação', color: 'amber' },
  { id: 'fechamento', name: 'Fechamento', color: 'blue' },
  { id: 'contrato', name: 'Contrato', color: 'purple' },
  { id: 'perdido', name: 'Perdido', color: 'slate' },
];

export const LOW_TICKET_STAGES = [
  { id: 'lead', name: 'Entrada', color: 'rose' },
  { id: 'conversao', name: 'Conversão', color: 'emerald' },
  { id: 'checkout', name: 'Checkout', color: 'amber' },
  { id: 'recuperacao', name: 'Recuperação', color: 'orange' },
  { id: 'pago', name: 'Pago', color: 'emerald' },
];

export const CLOSERS_HIGH_TICKET = ['Ana Julia'];
export const CLOSERS_LOW_TICKET = ['Marcos'];

// Utility to convert between frontend (hyphen) and backend (underscore) formats
export const pipelineToBackend = (pipeline: PipelineType): string => {
  return pipeline.replace('-', '_');
};

export const pipelineFromBackend = (pipeline: string): PipelineType => {
  return pipeline.replace('_', '-') as PipelineType;
};
