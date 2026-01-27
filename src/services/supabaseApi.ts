// Supabase API Service - Direct database queries replacing Railway backend
// This service provides the same API interface as api.ts but uses Supabase directly

import { supabase } from '../lib/supabase';

// ============ TYPES ============

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
    assignedAt?: string;
    estimatedValue?: number;
    tags?: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
    contactReason?: string;
    lossReasonId?: string;
    lostAt?: string;
    // Joined data
    assignee?: { id: string; name: string; avatar?: string };
    lossReason?: { id: string; name: string; description?: string };
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

export interface DashboardStats {
    totalLeads: number;
    leadsToday: number;
    closedLeads: number;
    totalValue: number;
    highTicket: Array<{ status: string; count: number; value: number }>;
    lowTicket: Array<{ status: string; count: number; value: number }>;
}

// Helper to convert snake_case to camelCase
function toCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);

    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = toCamelCase(obj[key]);
        return acc;
    }, {} as any);
}

// Helper to convert camelCase to snake_case
function toSnakeCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toSnakeCase);

    return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        acc[snakeKey] = toSnakeCase(obj[key]);
        return acc;
    }, {} as any);
}

// ============ LEADS API ============

/**
 * Get all leads with optional filters
 */
export async function supabaseGetLeads(filters?: { pipeline?: string; status?: string }): Promise<Lead[]> {
    console.log('📊 Supabase API: Fetching leads', filters);

    let query = supabase
        .from('leads')
        .select(`
      *,
      assignee:users!leads_assigned_to_fkey(id, name, avatar),
      loss_reason:loss_reasons!leads_loss_reason_id_fkey(id, name, description)
    `)
        .order('created_at', { ascending: false });

    if (filters?.pipeline) {
        query = query.eq('pipeline', filters.pipeline);
    }

    if (filters?.status) {
        // Determine which status column to filter based on pipeline or use all
        query = query.or(`status_ht.eq.${filters.status},status_lt.eq.${filters.status},status_production.eq.${filters.status},status_post_sales.eq.${filters.status}`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('📊 Supabase API: Error fetching leads', error);
        throw new Error(error.message);
    }

    return (data || []).map(toCamelCase);
}

/**
 * Get a single lead by ID
 */
export async function supabaseGetLead(id: string): Promise<Lead> {
    console.log('📊 Supabase API: Fetching lead', id);

    const { data, error } = await supabase
        .from('leads')
        .select(`
      *,
      assignee:users!leads_assigned_to_fkey(id, name, avatar),
      loss_reason:loss_reasons!leads_loss_reason_id_fkey(id, name, description)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('📊 Supabase API: Error fetching lead', error);
        throw new Error(error.message);
    }

    return toCamelCase(data);
}

/**
 * Create a new lead
 */
export async function supabaseCreateLead(data: CreateLeadData): Promise<Lead> {
    console.log('📊 Supabase API: Creating lead', data);

    const now = new Date().toISOString();
    const leadData = {
        ...toSnakeCase(data),
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now
    };

    const { data: created, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

    if (error) {
        console.error('📊 Supabase API: Error creating lead', error);
        throw new Error(error.message);
    }

    return toCamelCase(created);
}

/**
 * Update an existing lead
 */
export async function supabaseUpdateLead(id: string, data: Partial<CreateLeadData>): Promise<Lead> {
    console.log('📊 Supabase API: Updating lead', id, data);

    const updateData = {
        ...toSnakeCase(data),
        updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('📊 Supabase API: Error updating lead', error);
        throw new Error(error.message);
    }

    return toCamelCase(updated);
}

/**
 * Update lead status
 */
export async function supabaseUpdateLeadStatus(id: string, status: string, pipeline?: string): Promise<Lead> {
    console.log('📊 Supabase API: Updating lead status', id, status);

    // First get the lead to know which pipeline it belongs to
    const lead = await supabaseGetLead(id);
    const targetPipeline = pipeline || lead.pipeline;

    // Determine which status column to update
    let statusColumn: string;
    switch (targetPipeline) {
        case 'high_ticket': statusColumn = 'status_ht'; break;
        case 'low_ticket': statusColumn = 'status_lt'; break;
        case 'production': statusColumn = 'status_production'; break;
        case 'post_sales': statusColumn = 'status_post_sales'; break;
        default: statusColumn = 'status_ht';
    }

    const updateData = {
        [statusColumn]: status,
        updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('📊 Supabase API: Error updating lead status', error);
        throw new Error(error.message);
    }

    return toCamelCase(updated);
}

/**
 * Delete a lead
 */
export async function supabaseDeleteLead(id: string): Promise<void> {
    console.log('📊 Supabase API: Deleting lead', id);

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('📊 Supabase API: Error deleting lead', error);
        throw new Error(error.message);
    }
}

/**
 * Assign lead to user
 */
export async function supabaseAssignLead(leadId: string, userId: string): Promise<Lead> {
    console.log('📊 Supabase API: Assigning lead', leadId, 'to user', userId);

    const { data: updated, error } = await supabase
        .from('leads')
        .update({
            assigned_to: userId,
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

    if (error) {
        console.error('📊 Supabase API: Error assigning lead', error);
        throw new Error(error.message);
    }

    return toCamelCase(updated);
}

// ============ DASHBOARD STATS ============

/**
 * Get dashboard statistics
 */
export async function supabaseGetDashboardStats(): Promise<DashboardStats> {
    console.log('📊 Supabase API: Fetching dashboard stats');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, pipeline, status_ht, status_lt, status_production, status_post_sales, estimated_value, created_at');

    if (error) {
        console.error('📊 Supabase API: Error fetching dashboard stats', error);
        throw new Error(error.message);
    }

    const allLeads = leads || [];

    // Calculate stats
    const totalLeads = allLeads.length;
    const leadsToday = allLeads.filter(l => new Date(l.created_at) >= today).length;

    // Count closed deals
    const closedLeads = allLeads.filter(l =>
        l.status_ht === 'fechado' || l.status_lt === 'pago' ||
        l.status_production === 'entregue' || l.status_post_sales === 'concluido'
    ).length;

    // Calculate total value
    const totalValue = allLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

    // Group by pipeline and status
    const htLeads = allLeads.filter(l => l.pipeline === 'high_ticket');
    const ltLeads = allLeads.filter(l => l.pipeline === 'low_ticket');

    // Aggregate HT status
    const htStatusMap = new Map<string, { count: number; value: number }>();
    htLeads.forEach(l => {
        const status = l.status_ht || 'novo';
        const current = htStatusMap.get(status) || { count: 0, value: 0 };
        htStatusMap.set(status, {
            count: current.count + 1,
            value: current.value + (Number(l.estimated_value) || 0)
        });
    });

    // Aggregate LT status
    const ltStatusMap = new Map<string, { count: number; value: number }>();
    ltLeads.forEach(l => {
        const status = l.status_lt || 'lead';
        const current = ltStatusMap.get(status) || { count: 0, value: 0 };
        ltStatusMap.set(status, {
            count: current.count + 1,
            value: current.value + (Number(l.estimated_value) || 0)
        });
    });

    return {
        totalLeads,
        leadsToday,
        closedLeads,
        totalValue,
        highTicket: Array.from(htStatusMap.entries()).map(([status, data]) => ({ status, ...data })),
        lowTicket: Array.from(ltStatusMap.entries()).map(([status, data]) => ({ status, ...data }))
    };
}

// ============ USERS API ============

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

/**
 * Get all users
 */
export async function supabaseGetUsers(): Promise<User[]> {
    console.log('📊 Supabase API: Fetching users');

    const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active, avatar, max_concurrent_chats, current_chat_count')
        .order('name');

    if (error) {
        console.error('📊 Supabase API: Error fetching users', error);
        throw new Error(error.message);
    }

    return (data || []).map(toCamelCase);
}

/**
 * Get a single user
 */
export async function supabaseGetUser(id: string): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active, avatar')
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return toCamelCase(data);
}

console.log('📊 Supabase API service initialized');
