// API Service - Connects frontend to backend
// Cache bust: 2026-01-13T16:59:00 - Force new bundle hash for production login fix
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
console.log('[API] Build version: 2026-01-13-v2 | URL:', API_URL);
// Get stored token
const getToken = (): string | null => {
    return localStorage.getItem('token');
};

// Set token
export const setToken = (token: string): void => {
    localStorage.setItem('token', token);
};

// Remove token
export const removeToken = (): void => {
    localStorage.removeItem('token');
};

// API request helper
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
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
    config?: any;
}

export const getChannels = async () => {
    const response = await request<Channel[]>('/channels');
    return response;
};

export const createChannel = async (data: Partial<Channel>) => {
    const response = await request<Channel>('/channels', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response;
};

export const updateChannel = async (id: string, data: Partial<Channel>) => {
    const response = await request<Channel>(`/channels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return response;
};

export const toggleChannel = async (id: string, isEnabled: boolean) => {
    const response = await request<Channel>(`/channels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled }),
    });
    return response;
};

export const deleteChannel = async (id: string) => {
    await request(`/channels/${id}`, {
        method: 'DELETE',
    });
};

// ============ AUTH API ============

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: 'admin' | 'sdr' | 'closer_ht' | 'closer_lt';
        pipelineType?: 'high_ticket' | 'low_ticket';
    };
}

const MOCK_ADMIN: LoginResponse['user'] = {
    id: 'mock-admin-id',
    email: 'admin@nobremarketing.com',
    name: 'Admin Local (Mock)',
    role: 'admin',
    pipelineType: 'high_ticket'
};

export async function login(email: string, password: string): Promise<LoginResponse> {
    try {
        const data = await request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        return data;
    } catch (error) {
        console.error('🚨 LOGIN ERROR:', error);
        // In production, do NOT fallback to mock - show the real error
        throw error;
    }
}

export async function getCurrentUser(): Promise<LoginResponse['user']> {
    try {
        return await request<LoginResponse['user']>('/auth/me');
    } catch (error) {
        const token = getToken();
        if (token === 'mock-jwt-token-dev-mode') {
            console.warn('Using Mock User for session');
            return MOCK_ADMIN;
        }
        throw error;
    }
}

export function logout(): void {
    removeToken();
    // Force reload to clear states if needed, or simple redirect handled by context
}

// ============ LEADS API ============

export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone: string;
    company?: string;
    source: string;
    pipeline: 'high_ticket' | 'low_ticket' | 'production' | 'post_sales';
    statusHT?: string;
    statusLT?: string;
    statusProduction?: string;
    statusPostSales?: string;
    assignedTo?: string;
    assignedUser?: { id: string; name: string };
    estimatedValue: number;
    tags: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
    assignedAgentId?: string;
    lastMessage?: string;     // Last message preview for Kanban cards
    lastMessageFrom?: 'in' | 'out';
    lastMessageAt?: string;   // Timestamp of last message
    statusChangedAt?: string; // When status was last changed (for time in stage)
    contactReason?: string;   // Reason for contact (motivo do contato)
    lossReasonId?: string;    // ID of the loss reason
    lossReason?: { id: string; name: string; description?: string };
    lostAt?: string;          // When the lead was marked as lost
}

export interface CreateLeadData {
    name: string;
    email?: string;
    phone: string;
    company?: string;
    source?: string;
    pipeline: 'high_ticket' | 'low_ticket' | 'production' | 'post_sales';
    statusHT?: string;
    statusLT?: string;
    statusProduction?: string;
    statusPostSales?: string;
    estimatedValue?: number;
    tags?: string[];
    notes?: string;
}

// ============ MOCK DATA ============

const MOCK_LEADS: Lead[] = [
    {
        id: '1',
        name: 'Roberto Silva',
        email: 'roberto@empresa.com',
        phone: '(11) 99999-0001',
        company: 'Tech Solutions Ltd',
        source: 'linkedin',
        pipeline: 'high_ticket',
        statusHT: 'qualificado',
        estimatedValue: 15000,
        tags: ['quente', 'decisor'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Ana Souza',
        email: 'ana.souza@email.com',
        phone: '(21) 98888-0002',
        source: 'instagram',
        pipeline: 'low_ticket',
        statusLT: 'em_negociacao',
        estimatedValue: 297,
        tags: ['novo'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Construtora Elite',
        phone: '(41) 3333-4444',
        company: 'Elite Construções',
        source: 'referral',
        pipeline: 'high_ticket',
        statusHT: 'proposta',
        estimatedValue: 45000,
        tags: ['indicação', 'alto-valor'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const MOCK_STATS: DashboardStats = {
    totalLeads: 124,
    leadsToday: 12,
    closedLeads: 45,
    totalValue: 156000,
    highTicket: [
        { status: 'novo', count: 15, value: 0 },
        { status: 'qualificado', count: 8, value: 120000 },
        { status: 'fechamento', count: 3, value: 45000 }
    ],
    lowTicket: [
        { status: 'lead', count: 45, value: 0 },
        { status: 'checkout', count: 12, value: 3500 },
        { status: 'pago', count: 89, value: 26000 }
    ]
};

// ============ LEADS API ============

export async function getLeads(filters?: { pipeline?: string; status?: string }): Promise<Lead[]> {
    try {
        const params = new URLSearchParams();
        if (filters?.pipeline) params.set('pipeline', filters.pipeline);
        if (filters?.status) params.set('status', filters.status);
        const query = params.toString() ? `?${params.toString()}` : '';
        return await request<Lead[]>(`/leads${query}`);
    } catch (error) {
        console.warn('Using Mock Leads');
        await new Promise(resolve => setTimeout(resolve, 600)); // Simula delay
        let leads = [...MOCK_LEADS];
        if (filters?.pipeline) {
            leads = leads.filter(l => l.pipeline === filters.pipeline);
        }
        return leads;
    }
}

export async function getLead(id: string): Promise<Lead> {
    try {
        return await request<Lead>(`/leads/${id}`);
    } catch (error) {
        const lead = MOCK_LEADS.find(l => l.id === id);
        if (lead) return lead;
        throw error;
    }
}

export async function createLead(data: CreateLeadData): Promise<Lead> {
    try {
        return await request<Lead>('/leads', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.warn('Mock Create Lead');
        const newLead: Lead = {
            id: Math.random().toString(36).substr(2, 9),
            ...data,
            source: data.source || 'manual',
            statusHT: data.statusHT || 'novo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estimatedValue: data.estimatedValue || 0,
            tags: data.tags || []
        } as any;
        MOCK_LEADS.push(newLead);
        return newLead;
    }
}

export async function updateLead(id: string, data: Partial<CreateLeadData>): Promise<Lead> {
    try {
        return await request<Lead>(`/leads/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.warn('Mock Update Lead');
        // Simple mock update
        return {
            ...MOCK_LEADS[0],
            ...data
        } as Lead;
    }
}

export async function updateLeadStatus(id: string, status: string): Promise<Lead> {
    return request<Lead>(`/leads/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }).catch(() => MOCK_LEADS[0]);
}

// Update lead stage with transactional audit log
export interface StageChangeResult {
    lead: Lead;
    stageChange: {
        from: string;
        to: string;
        pipeline: string;
        changedBy: string;
        changedAt: string;
    };
}

export async function updateLeadStage(id: string, stage: string, pipeline?: 'high_ticket' | 'low_ticket'): Promise<StageChangeResult> {
    return request<StageChangeResult>(`/leads/${id}/stage`, {
        method: 'PUT',
        body: JSON.stringify({ stage, pipeline }),
    }).catch(() => ({
        lead: MOCK_LEADS[0],
        stageChange: { from: 'novo', to: stage, pipeline: pipeline || 'high_ticket', changedBy: 'mock', changedAt: new Date().toISOString() }
    }));
}

export async function assignLead(id: string, userId: string): Promise<Lead> {
    return request<Lead>(`/leads/${id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ userId }),
    }).catch(() => MOCK_LEADS[0]);
}

export async function deleteLead(id: string): Promise<void> {
    await request(`/leads/${id}`, { method: 'DELETE' }).catch(() => { });
}

// ============ USERS API ============

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    pipelineType?: string;
    isActive: boolean;
}

export async function getUsers(): Promise<User[]> {
    try {
        return await request<User[]>('/users');
    } catch (error) {
        return [
            { id: '1', name: 'Admin Mock', email: 'admin@nobre.com', role: 'admin', isActive: true },
            { id: '2', name: 'SDR Mock', email: 'sdr@nobre.com', role: 'sdr', isActive: true }
        ];
    }
}

export async function getClosers(pipeline: string): Promise<User[]> {
    try {
        return await request<User[]>(`/users/closers/${pipeline}`);
    } catch (error) {
        return [
            { id: '3', name: 'Closer High Ticket', email: 'closer@nobre.com', role: 'closer_ht', isActive: true }
        ];
    }
}

// ============ ROUND ROBIN API ============

export interface RoundRobinAssignment {
    leadId: string;
    assignedTo: string;
    assignedUserName: string;
    pipeline: string;
}

export interface RoundRobinStats {
    pipeline: string;
    closers: Array<{
        id: string;
        name: string;
        leadsToday: number;
    }>;
}

export interface AutoAssignResult {
    total: number;
    assigned: number;
    results: RoundRobinAssignment[];
}

// Assign single lead via Round Robin
export async function assignLeadRoundRobin(leadId: string): Promise<RoundRobinAssignment> {
    return request<RoundRobinAssignment>(`/round-robin/assign/${leadId}`, {
        method: 'POST',
    }).catch(() => ({} as RoundRobinAssignment));
}

// Auto-assign all unassigned leads in a pipeline
export async function autoAssignLeads(pipeline: 'high_ticket' | 'low_ticket'): Promise<AutoAssignResult> {
    return request<AutoAssignResult>('/round-robin/auto-assign', {
        method: 'POST',
        body: JSON.stringify({ pipeline }),
    }).catch(() => ({ total: 0, assigned: 0, results: [] }));
}

// Get Round Robin distribution stats
export async function getRoundRobinStats(pipeline: 'high_ticket' | 'low_ticket'): Promise<RoundRobinStats> {
    return request<RoundRobinStats>(`/round-robin/stats/${pipeline}`).catch(() => ({ pipeline, closers: [] }));
}

// ============ WHATSAPP API ============

export interface WhatsAppMessage {
    id: string;
    text: string;
    direction: 'in' | 'out';
    timestamp: string;
    type: 'text' | 'image' | 'audio' | 'template';
    status?: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
    leadId?: string;
}

export interface WhatsAppTemplate {
    id: string;
    name: string;
    status: string;
    language: string;
}

// Send a WhatsApp message
export async function sendWhatsAppMessage(to: string, text: string, leadId?: string): Promise<{ success: boolean; messageId?: string }> {
    try {
        return await request<{ success: boolean; messageId: string }>('/whatsapp/send', {
            method: 'POST',
            body: JSON.stringify({ to, text, leadId }),
        });
    } catch (error) {
        console.error('WhatsApp send failed:', error);
        return { success: false };
    }
}

// Send a WhatsApp template message
export async function sendWhatsAppTemplate(
    to: string,
    templateName: string,
    parameters?: string[]
): Promise<{ success: boolean; messageId?: string }> {
    try {
        return await request<{ success: boolean; messageId: string }>('/whatsapp/send-template', {
            method: 'POST',
            body: JSON.stringify({ to, templateName, parameters }),
        });
    } catch (error) {
        console.error('WhatsApp template send failed:', error);
        return { success: false };
    }
}

// Get conversation history for a phone number
export async function getWhatsAppMessages(phone: string): Promise<WhatsAppMessage[]> {
    try {
        const result = await request<{ messages: WhatsAppMessage[] }>(`/whatsapp/messages/${phone}`);
        return result.messages || [];
    } catch (error) {
        console.error('Failed to fetch WhatsApp messages:', error);
        return [];
    }
}

// Get available WhatsApp templates
export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    try {
        const result = await request<{ templates: WhatsAppTemplate[] }>('/whatsapp/templates');
        return result.templates || [];
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        return [];
    }
}

// ============ STATS/ANALYTICS API ============

export interface DashboardStats {
    totalLeads: number;
    leadsToday: number;
    closedLeads: number;
    totalValue: number;
    highTicket: Array<{ status: string; count: number; value: number }>;
    lowTicket: Array<{ status: string; count: number; value: number }>;
}

export interface PipelineStat {
    status: string;
    count: number;
    value: number;
}

export interface CloserStat {
    id: string;
    name: string;
    role: string;
    totalLeads: number;
    closedLeads: number;
    conversionRate: string | number;
    totalRevenue: number;
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        return await request<DashboardStats>('/stats/dashboard');
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        return {
            totalLeads: 0,
            leadsToday: 0,
            closedLeads: 0,
            totalValue: 0,
            highTicket: [],
            lowTicket: []
        };
    }
}

// Get pipeline breakdown
export async function getPipelineStats(pipeline: 'high_ticket' | 'low_ticket'): Promise<PipelineStat[]> {
    try {
        return await request<PipelineStat[]>(`/stats/pipeline?pipeline=${pipeline}`);
    } catch (error) {
        console.error('Failed to fetch pipeline stats:', error);
        return [];
    }
}

// Get closer performance stats
export async function getCloserStats(): Promise<CloserStat[]> {
    try {
        return await request<CloserStat[]>('/stats/closers');
    } catch (error) {
        console.error('Failed to fetch closer stats:', error);
        return [];
    }
}

// ============ CUSTOM FIELDS API ============

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
    value?: string | null; // Current value for a specific lead
}

// Get all custom fields (optionally filter by entity)
export async function getCustomFields(entity?: 'contact' | 'company' | 'deal'): Promise<CustomField[]> {
    try {
        const query = entity ? `?entity=${entity}` : '';
        return await request<CustomField[]>(`/custom-fields${query}`);
    } catch (error) {
        console.error('Failed to fetch custom fields:', error);
        return [];
    }
}

// Get custom field values for a specific lead
export async function getCustomFieldValues(leadId: string): Promise<CustomField[]> {
    try {
        return await request<CustomField[]>(`/custom-fields/values/${leadId}`);
    } catch (error) {
        console.error('Failed to fetch custom field values:', error);
        return [];
    }
}

// Set a single custom field value
export async function setCustomFieldValue(leadId: string, customFieldId: string, value: string): Promise<void> {
    await request('/custom-fields/values', {
        method: 'POST',
        body: JSON.stringify({ leadId, customFieldId, value }),
    });
}

// Bulk set custom field values
export async function setCustomFieldValues(leadId: string, values: { customFieldId: string; value: string }[]): Promise<CustomField[]> {
    return await request<CustomField[]>('/custom-fields/values/bulk', {
        method: 'POST',
        body: JSON.stringify({ leadId, values }),
    });
}

// Create a custom field (admin)
export async function createCustomField(data: Omit<CustomField, 'id' | 'value'>): Promise<CustomField> {
    return await request<CustomField>('/custom-fields', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Delete a custom field
export async function deleteCustomField(id: string): Promise<void> {
    await request(`/custom-fields/${id}`, {
        method: 'DELETE',
    });
}

// ============ ACTIVITIES API ============

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

export interface Playbook {
    id: string;
    name: string;
    description?: string;
    stageKey?: string;
    pipeline?: string;
    isActive: boolean;
    templates: ActivityTemplate[];
}

export interface ActivityTemplate {
    id: string;
    playbookId: string;
    type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'task' | 'follow_up';
    title: string;
    description?: string;
    daysFromStart: number;
    order: number;
    messageTemplate?: string;
}

// Get activities for a lead
export async function getLeadActivities(leadId: string, status?: string): Promise<Activity[]> {
    try {
        const query = status ? `?status=${status}` : '';
        return await request<Activity[]>(`/activities/lead/${leadId}${query}`);
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        return [];
    }
}

// Get my pending activities
export async function getMyPendingActivities(): Promise<Activity[]> {
    try {
        return await request<Activity[]>('/activities/my-pending');
    } catch (error) {
        console.error('Failed to fetch my activities:', error);
        return [];
    }
}

// Get overdue activities count
export async function getOverdueCount(): Promise<number> {
    try {
        const result = await request<{ count: number }>('/activities/overdue-count');
        return result.count;
    } catch (error) {
        return 0;
    }
}

// Create an activity
export async function createActivity(data: {
    leadId: string;
    type: Activity['type'];
    title: string;
    description?: string;
    dueDate: string;
    assignedTo?: string;
}): Promise<Activity> {
    return await request<Activity>('/activities', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Complete an activity
export async function completeActivity(id: string, notes?: string): Promise<Activity> {
    return await request<Activity>(`/activities/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
    });
}

// Skip an activity
export async function skipActivity(id: string): Promise<Activity> {
    return await request<Activity>(`/activities/${id}/skip`, {
        method: 'POST',
    });
}

// Get all playbooks
export async function getPlaybooks(): Promise<Playbook[]> {
    try {
        return await request<Playbook[]>('/activities/playbooks');
    } catch (error) {
        console.error('Failed to fetch playbooks:', error);
        return [];
    }
}

// Apply a playbook to a lead
export async function applyPlaybook(playbookId: string, leadId: string): Promise<{ activities: Activity[] }> {
    return await request<{ activities: Activity[] }>(`/activities/playbooks/${playbookId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ leadId }),
    });
}

// ============ LOSS REASONS API ============

export interface LossReason {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

// Get all loss reasons
export async function getLossReasons(): Promise<LossReason[]> {
    try {
        return await request<LossReason[]>('/loss-reasons');
    } catch (error) {
        console.error('Failed to fetch loss reasons:', error);
        // Return default reasons for now
        return [
            { id: '1', name: 'Sem interesse', isActive: true },
            { id: '2', name: 'Sem orçamento', isActive: true },
            { id: '3', name: 'Escolheu concorrente', isActive: true },
            { id: '4', name: 'Timing errado', isActive: true },
            { id: '5', name: 'Não respondeu', isActive: true },
            { id: '6', name: 'Outro', isActive: true },
        ];
    }
}

// Mark a lead as lost with a reason
export async function markLeadAsLost(leadId: string, lossReasonId: string, notes?: string): Promise<Lead> {
    return await request<Lead>(`/leads/${leadId}/lost`, {
        method: 'POST',
        body: JSON.stringify({ lossReasonId, notes }),
    });
}

// ============ TAGS API ============

// Update lead tags
export async function updateLeadTags(leadId: string, tags: string[]): Promise<Lead> {
    return await request<Lead>(`/leads/${leadId}/tags`, {
        method: 'PUT',
        body: JSON.stringify({ tags }),
    });
}

// Get all unique tags used in the system
export async function getAllTags(): Promise<string[]> {
    try {
        return await request<string[]>('/leads/tags/all');
    } catch (error) {
        console.error('Failed to fetch tags:', error);
        return ['quente', 'frio', 'decisor', 'indicação', 'urgente', 'novo', 'vip'];
    }
}

// Add a tag to a lead
export async function addTagToLead(leadId: string, tag: string): Promise<Lead> {
    return await request<Lead>(`/leads/${leadId}/tags/add`, {
        method: 'POST',
        body: JSON.stringify({ tag }),
    });
}

// Remove a tag from a lead
export async function removeTagFromLead(leadId: string, tag: string): Promise<Lead> {
    return await request<Lead>(`/leads/${leadId}/tags/remove`, {
        method: 'POST',
        body: JSON.stringify({ tag }),
    });
}
