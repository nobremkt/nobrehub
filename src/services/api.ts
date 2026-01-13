// API Service - Connects frontend to backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    pipeline: 'high_ticket' | 'low_ticket';
    statusHT?: string;
    statusLT?: string;
    assignedTo?: string;
    assignedUser?: { id: string; name: string };
    estimatedValue: number;
    tags: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
    assignedAgentId?: string;
}

export interface CreateLeadData {
    name: string;
    email?: string;
    phone: string;
    company?: string;
    source?: string;
    pipeline: 'high_ticket' | 'low_ticket';
    statusHT?: string;
    statusLT?: string;
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

