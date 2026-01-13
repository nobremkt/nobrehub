
export type PipelineType = 'high-ticket' | 'low-ticket' | 'producao' | 'pos-venda';

export interface BoardStageConfig {
  id: string;
  name: string;
  color: 'rose' | 'emerald' | 'amber' | 'blue' | 'purple' | 'slate' | 'orange' | 'indigo';
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  language: string;
  scoreAi: number;
  status: string;
  origin?: string;
  tags?: string[];
  lastMessage?: string;
  assignedAgentId?: string;
  chatStatus: 'open' | 'pending' | 'closed';
  pipeline: PipelineType;
  value?: number;
  notes?: string;
}

export type AgentRole = 'Vendas' | 'Produção' | 'Pós-Venda';

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  status: 'online' | 'offline' | 'busy';
  activeLeads: number;
  avatar?: string;
  boardConfig?: BoardStageConfig[];
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
  deals: Contact[];
}

export type ViewType = 'kanban' | 'leads' | 'chat' | 'flows' | 'analytics' | 'team' | 'personal_workspace';
