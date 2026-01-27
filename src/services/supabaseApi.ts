// Supabase API Service - Direct database queries replacing Railway backend
// This service provides the same API interface as api.ts but uses Supabase directly

import { supabase } from '../lib/supabase';

// Import types from centralized models
import type {
    Lead,
    CreateLeadData,
    DashboardStats,
    User,
    LossReason,
    Conversation,
    Deal,
    PipelineType
} from '../types/models';

// Re-export types for backward compatibility with components importing from supabaseApi
export type { Lead, CreateLeadData, DashboardStats, User, LossReason, Conversation, Deal, PipelineType };

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
 * Update lead stage with history tracking
 */
export interface StageChangeResult {
    lead: Lead;
    stageChange: { from: string; to: string; pipeline: string; changedBy: string; changedAt: string };
}

export async function supabaseUpdateLeadStage(id: string, stage: string, pipeline?: string): Promise<StageChangeResult> {
    console.log('📊 Supabase API: Updating lead stage', id, 'to', stage);

    // Get current lead to track previous stage
    const { data: currentLead, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    const pipelineType = pipeline || currentLead.pipeline || 'high_ticket';
    const statusField = pipelineType === 'high_ticket' ? 'status_ht' :
        pipelineType === 'low_ticket' ? 'status_lt' :
            pipelineType === 'production' ? 'status_production' : 'status_post_sales';
    const fromStage = currentLead[statusField] || 'novo';

    // Update lead status
    const { data: updated, error } = await supabase
        .from('leads')
        .update({
            [statusField]: stage,
            status_changed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Create history entry
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || 'system';

    await supabase.from('lead_history').insert({
        id: crypto.randomUUID(),
        lead_id: id,
        action: 'stage_changed',
        details: JSON.stringify({ from: fromStage, to: stage, pipeline: pipelineType }),
        created_by: userId,
        created_at: new Date().toISOString()
    });

    return {
        lead: toCamelCase(updated),
        stageChange: {
            from: fromStage,
            to: stage,
            pipeline: pipelineType,
            changedBy: userId,
            changedAt: new Date().toISOString()
        }
    };
}

/**
 * Get all unique tags from leads
 */
export async function supabaseGetAllTags(): Promise<string[]> {
    const { data, error } = await supabase.from('leads').select('tags');
    if (error) {
        console.error('Failed to fetch tags:', error);
        return ['quente', 'frio', 'decisor', 'indicação', 'urgente', 'novo', 'vip'];
    }
    const allTags = new Set<string>();
    (data || []).forEach((lead: any) => {
        if (lead.tags && Array.isArray(lead.tags)) {
            lead.tags.forEach((tag: string) => allTags.add(tag));
        }
    });
    return Array.from(allTags);
}

/**
 * Update lead tags
 */
export async function supabaseUpdateLeadTags(leadId: string, tags: string[]): Promise<Lead> {
    console.log('📊 Supabase API: Updating lead tags', leadId, tags);

    const { data, error } = await supabase
        .from('leads')
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single();

    if (error) {
        console.error('📊 Supabase API: Error updating lead tags', error);
        throw new Error(error.message);
    }

    return toCamelCase(data);
}

/**
 * Mark lead as lost with reason
 */
export async function supabaseMarkLeadAsLost(leadId: string, lossReasonId: string, notes?: string): Promise<Lead> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('leads')
        .update({
            loss_reason_id: lossReasonId,
            lost_at: now,
            notes: notes,
            updated_at: now
        })
        .eq('id', leadId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

/**
 * Get all loss reasons
 */
export async function supabaseGetLossReasons(): Promise<LossReason[]> {
    const { data, error } = await supabase.from('loss_reasons').select('*').eq('is_active', true).order('name');
    if (error) {
        console.error('Failed to fetch loss reasons:', error);
        // Return default reasons as fallback
        return [
            { id: '1', name: 'Sem interesse', isActive: true },
            { id: '2', name: 'Sem orçamento', isActive: true },
            { id: '3', name: 'Escolheu concorrente', isActive: true },
            { id: '4', name: 'Timing errado', isActive: true },
            { id: '5', name: 'Não respondeu', isActive: true },
            { id: '6', name: 'Outro', isActive: true },
        ];
    }
    return (data || []).map(toCamelCase);
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

// ============ CONVERSATIONS API ============

export async function supabaseGetActiveConversations(userId?: string): Promise<Conversation[]> {
    let query = supabase
        .from('conversations')
        .select(`
            *,
            lead:leads(*),
            assignee:users!conversations_assigned_to_fkey(id, name, avatar)
        `)
        .in('status', ['queued', 'active', 'hold'])
        .order('last_message_at', { ascending: false });

    if (userId) {
        query = query.or(`assigned_to.eq.${userId},assigned_to.is.null`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseGetConversation(id: string): Promise<Conversation> {
    const { data, error } = await supabase
        .from('conversations')
        .select(`*, lead:leads(*), assignee:users!conversations_assigned_to_fkey(id, name, avatar)`)
        .eq('id', id)
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseGetConversationByLead(leadId: string, createIfNotExists = false): Promise<Conversation | null> {
    const { data: existing } = await supabase
        .from('conversations')
        .select(`*, lead:leads(*)`)
        .eq('lead_id', leadId)
        .neq('status', 'closed')
        .single();

    if (existing) return toCamelCase(existing);

    if (createIfNotExists) {
        const now = new Date().toISOString();
        const { data: created, error } = await supabase
            .from('conversations')
            .insert({ id: crypto.randomUUID(), lead_id: leadId, status: 'queued', updated_at: now })
            .select(`*, lead:leads(*)`)
            .single();
        if (error) throw new Error(error.message);
        return toCamelCase(created);
    }
    return null;
}

export async function supabaseUpdateConversation(id: string, data: Partial<{ status: string; assignedTo: string }>): Promise<Conversation> {
    const { data: updated, error } = await supabase
        .from('conversations')
        .update({ ...toSnakeCase(data), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(updated);
}

export async function supabaseCloseConversation(id: string): Promise<void> {
    await supabase.from('conversations').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', id);
}

export async function supabaseHoldConversation(id: string): Promise<Conversation> {
    return supabaseUpdateConversation(id, { status: 'hold' });
}

export async function supabaseResumeConversation(id: string): Promise<Conversation> {
    return supabaseUpdateConversation(id, { status: 'active' });
}

export async function supabaseTransferConversation(id: string, toUserId: string): Promise<Conversation> {
    return supabaseUpdateConversation(id, { assignedTo: toUserId, status: 'active' } as any);
}

export async function supabaseGetAvailableAgents(pipeline?: string): Promise<User[]> {
    let query = supabase
        .from('users')
        .select('id, name, avatar, role, current_chat_count, max_concurrent_chats')
        .eq('is_active', true);

    if (pipeline) {
        query = query.eq('pipeline_type', pipeline);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Filter users who can take more chats
    return (data || [])
        .filter((u: any) => (u.current_chat_count || 0) < (u.max_concurrent_chats || 5))
        .map(toCamelCase);
}

// ============ DEALS API ============

export async function supabaseGetDeals(leadId?: string): Promise<Deal[]> {
    let query = supabase.from('deals').select('*').order('created_at', { ascending: false });
    if (leadId) query = query.eq('lead_id', leadId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseCreateDeal(data: Partial<Deal>): Promise<Deal> {
    const now = new Date().toISOString();
    const { data: created, error } = await supabase
        .from('deals')
        .insert({ id: crypto.randomUUID(), ...toSnakeCase(data), created_at: now, updated_at: now })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(created);
}

export async function supabaseUpdateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
    const { data: updated, error } = await supabase
        .from('deals')
        .update({ ...toSnakeCase(data), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(updated);
}

export async function supabaseDeleteDeal(id: string): Promise<void> {
    await supabase.from('deals').delete().eq('id', id);
}

// ============ PRODUCTS API ============

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    active: boolean;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export async function supabaseGetProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('name');
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseCreateProduct(data: Partial<Product>): Promise<Product> {
    const { data: created, error } = await supabase
        .from('products')
        .insert({ id: crypto.randomUUID(), ...toSnakeCase(data), is_active: true })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(created);
}

export async function supabaseUpdateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const { data: updated, error } = await supabase.from('products').update(toSnakeCase(data)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(updated);
}

export async function supabaseDeleteProduct(id: string): Promise<void> {
    await supabase.from('products').update({ is_active: false }).eq('id', id);
}

// ============ PIPELINE STAGES API ============

export interface PipelineStage {
    id: string;
    name: string;
    slug?: string;
    pipeline: string;
    order: number;
    color?: string;
    isDefault?: boolean;
    isSystem?: boolean;
    isActive?: boolean;
}

export async function supabaseGetPipelineStages(pipeline?: string): Promise<PipelineStage[]> {
    let query = supabase.from('pipeline_stages').select('*').order('order');
    if (pipeline) query = query.eq('pipeline', pipeline);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseCreatePipelineStage(data: Partial<PipelineStage>): Promise<PipelineStage> {
    const now = new Date().toISOString();
    const { data: created, error } = await supabase
        .from('pipeline_stages')
        .insert({ id: crypto.randomUUID(), ...toSnakeCase(data), created_at: now, updated_at: now })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(created);
}

export async function supabaseUpdatePipelineStage(id: string, data: Partial<PipelineStage>): Promise<PipelineStage> {
    const { data: updated, error } = await supabase
        .from('pipeline_stages')
        .update({ ...toSnakeCase(data), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(updated);
}

export async function supabaseDeletePipelineStage(id: string): Promise<void> {
    await supabase.from('pipeline_stages').delete().eq('id', id);
}

export async function supabaseReorderPipelineStages(stages: { id: string; order: number }[]): Promise<void> {
    for (const stage of stages) {
        await supabase.from('pipeline_stages').update({ order: stage.order }).eq('id', stage.id);
    }
}

// ============ SECTORS API ============

export interface Sector {
    id: string;
    name: string;
    description?: string;
}

export async function supabaseGetSectors(): Promise<Sector[]> {
    const { data, error } = await supabase.from('sectors').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseUpdateSector(id: string, data: Partial<Sector>): Promise<Sector> {
    const { data: updated, error } = await supabase.from('sectors').update(toSnakeCase(data)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(updated);
}

// ============ ORGANIZATION API ============

export interface Organization {
    id: string;
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    logoUrl?: string;
    logo_url?: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
}

export async function supabaseGetOrganization(): Promise<Organization | null> {
    const { data, error } = await supabase.from('organizations').select('*').limit(1).single();
    if (error) return null;
    return toCamelCase(data);
}

export async function supabaseUpdateOrganization(orgData: Partial<Organization>): Promise<Organization> {
    const { data: existing } = await supabase.from('organizations').select('id').limit(1).single();

    if (existing) {
        const { data: updated, error } = await supabase.from('organizations').update(toSnakeCase(orgData)).eq('id', existing.id).select().single();
        if (error) throw new Error(error.message);
        return toCamelCase(updated);
    } else {
        const { data: created, error } = await supabase.from('organizations').insert({ id: crypto.randomUUID(), ...toSnakeCase(orgData) }).select().single();
        if (error) throw new Error(error.message);
        return toCamelCase(created);
    }
}

// ============ NOTIFICATION PREFERENCES API ============

export interface NotificationPreferences {
    id?: string;
    userId?: string;
    emailLeads: boolean;
    emailDeals: boolean;
    emailActivities: boolean;
    emailSystem: boolean;
    pushLeads: boolean;
    pushDeals: boolean;
    pushActivities: boolean;
    pushMentions: boolean;
    whatsappLeads: boolean;
    whatsappUrgent: boolean;
}

export async function supabaseGetNotificationPreferences(): Promise<NotificationPreferences | null> {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;
    const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).single();
    if (error) return null;
    return toCamelCase(data);
}

export async function supabaseUpdateNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('User not authenticated');

    const { data: existing } = await supabase.from('notification_preferences').select('id').eq('user_id', userId).single();

    if (existing) {
        const { data: updated, error } = await supabase.from('notification_preferences').update({ ...toSnakeCase(prefs), updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
        if (error) throw new Error(error.message);
        return toCamelCase(updated);
    } else {
        const { data: created, error } = await supabase.from('notification_preferences').insert({ id: crypto.randomUUID(), user_id: userId, ...toSnakeCase(prefs) }).select().single();
        if (error) throw new Error(error.message);
        return toCamelCase(created);
    }
}

// ============ WHATSAPP API (via Edge Function) ============

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xedfkizltrervaltuzrx.supabase.co';

export async function supabaseSendWhatsAppMessage(to: string, text: string, conversationId?: string, leadId?: string): Promise<{ success: boolean; messageId?: string }> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, text, conversationId, leadId })
    });
    return response.json();
}

export async function supabaseSendWhatsAppTemplate(to: string, templateName: string, params?: { languageCode?: string; components?: any[] }, conversationId?: string, leadId?: string): Promise<{ success: boolean; messageId?: string }> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-api/send-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, templateName, ...params, conversationId, leadId })
    });
    return response.json();
}

export async function supabaseGetWhatsAppTemplates(): Promise<any[]> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-api/templates`);
    const data = await response.json();
    return data.templates || [];
}

export async function supabaseGetMessages(conversationId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

// ============ USERS MANAGEMENT ============

export async function supabaseCreateUser(data: { email: string; name: string; password: string; role?: string; sectorId?: string }): Promise<User> {
    const now = new Date().toISOString();
    // Simple password hash for demo (in production, use proper hashing)
    const passwordHash = btoa(data.password);

    const { data: created, error } = await supabase
        .from('users')
        .insert({
            id: crypto.randomUUID(),
            email: data.email,
            name: data.name,
            password_hash: passwordHash,
            role: data.role || 'sdr',
            sector_id: data.sectorId,
            is_active: true,
            created_at: now,
            updated_at: now
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(created);
}

// ============ ADDITIONAL SECTORS API ============

export async function supabaseDeleteSector(id: string): Promise<void> {
    const { error } = await supabase.from('sectors').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export async function supabaseGetSectorsWithCount(): Promise<any[]> {
    const { data, error } = await supabase
        .from('sectors')
        .select('*, users:users(id)')
        .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((sector: any) => ({
        ...toCamelCase(sector),
        _count: { users: sector.users?.length || 0 }
    }));
}

// ============ ADDITIONAL DEALS API ============

export async function supabaseGetLeadDeals(leadId: string): Promise<Deal[]> {
    const { data, error } = await supabase
        .from('deals')
        .select(`
            *,
            owner:users!deals_owner_id_fkey(id, name)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

// ============ SCHEDULED MESSAGES API ============

export interface ScheduledMessage {
    id: string;
    conversationId: string;
    content: string;
    scheduledFor: string;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    createdAt: string;
}

export async function supabaseCreateScheduledMessage(data: { conversationId: string; content: string; scheduledFor: string }): Promise<ScheduledMessage> {
    const now = new Date().toISOString();
    const { data: session } = await supabase.auth.getSession();
    const { data: created, error } = await supabase
        .from('scheduled_messages')
        .insert({
            id: crypto.randomUUID(),
            conversation_id: data.conversationId,
            content: data.content,
            scheduled_for: data.scheduledFor,
            status: 'pending',
            created_by: session?.session?.user?.id,
            created_at: now
        })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(created);
}

// ============ USERS WITH SECTOR API ============

export async function supabaseGetUsersWithSector(): Promise<User[]> {
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            sector:sectors!users_sector_id_fkey(id, name, color, description)
        `)
        .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseCreateSector(data: { name: string; description?: string; color: string }): Promise<any> {
    const now = new Date().toISOString();
    const { data: created, error } = await supabase
        .from('sectors')
        .insert({
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description,
            color: data.color,
            created_at: now,
            updated_at: now
        })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(created);
}

// ============ LEAD DETAILS API ============

export async function supabaseGetLeadConversations(leadId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('conversations')
        .select(`
            id, status, pipeline, channel, last_message_at,
            assigned_agent:users!conversations_assigned_agent_id_fkey(id, name),
            messages(text, created_at)
        `)
        .eq('lead_id', leadId)
        .order('last_message_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseGetLeadHistory(leadId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('lead_history')
        .select(`
            id, action, details, created_at,
            user:users!lead_history_created_by_fkey(id, name)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

// ============ PERMISSIONS API ============

export interface RoleAccess {
    id: string;
    role: string;
    permissions: string[];
}

export async function supabaseGetPermissions(): Promise<RoleAccess[]> {
    const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role');
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseUpdatePermissions(role: string, permissions: string[]): Promise<RoleAccess> {
    const { data: existing } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role)
        .single();

    if (existing) {
        const { data, error } = await supabase
            .from('role_permissions')
            .update({ permissions })
            .eq('role', role)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return toCamelCase(data);
    } else {
        const { data, error } = await supabase
            .from('role_permissions')
            .insert({ role, permissions })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return toCamelCase(data);
    }
}

// ============ CHANNELS API ============

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

export async function supabaseGetChannels(): Promise<Channel[]> {
    const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at');
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseCreateChannel(channelData: Partial<Channel>): Promise<Channel> {
    const { data, error } = await supabase
        .from('channels')
        .insert(toSnakeCase(channelData))
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseUpdateChannel(id: string, channelData: Partial<Channel>): Promise<Channel> {
    const { data, error } = await supabase
        .from('channels')
        .update(toSnakeCase(channelData))
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseToggleChannel(id: string, isEnabled: boolean): Promise<Channel> {
    const { data, error } = await supabase
        .from('channels')
        .update({ is_enabled: isEnabled })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseDeleteChannel(id: string): Promise<void> {
    const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
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
    value?: string | null;
}

export async function supabaseGetCustomFields(entity?: 'contact' | 'company' | 'deal'): Promise<CustomField[]> {
    let query = supabase.from('custom_fields').select('*').order('order');
    if (entity) query = query.eq('entity', entity);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseGetCustomFieldValues(leadId: string): Promise<CustomField[]> {
    const { data, error } = await supabase
        .from('custom_field_values')
        .select(`*, custom_field:custom_fields(*)`)
        .eq('lead_id', leadId);
    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({
        ...toCamelCase(item.custom_field),
        value: item.value
    }));
}

export async function supabaseSetCustomFieldValue(leadId: string, customFieldId: string, value: string): Promise<void> {
    const { error } = await supabase
        .from('custom_field_values')
        .upsert({
            lead_id: leadId,
            custom_field_id: customFieldId,
            value
        }, { onConflict: 'lead_id,custom_field_id' });
    if (error) throw new Error(error.message);
}

export async function supabaseCreateCustomField(fieldData: Omit<CustomField, 'id' | 'value'>): Promise<CustomField> {
    const { data, error } = await supabase
        .from('custom_fields')
        .insert(toSnakeCase(fieldData))
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseDeleteCustomField(id: string): Promise<void> {
    const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
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
    notes?: string;
    createdAt: string;
}

export async function supabaseGetLeadActivities(leadId: string, status?: string): Promise<Activity[]> {
    let query = supabase
        .from('activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: true });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseCreateActivity(activityData: {
    leadId: string;
    type: Activity['type'];
    title: string;
    description?: string;
    dueDate: string;
    assignedTo?: string;
}): Promise<Activity> {
    const { data, error } = await supabase
        .from('activities')
        .insert({
            lead_id: activityData.leadId,
            type: activityData.type,
            title: activityData.title,
            description: activityData.description,
            due_date: activityData.dueDate,
            assigned_to: activityData.assignedTo,
            status: 'pending'
        })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseCompleteActivity(id: string, notes?: string): Promise<Activity> {
    const { data, error } = await supabase
        .from('activities')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes
        })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseSkipActivity(id: string): Promise<Activity> {
    const { data, error } = await supabase
        .from('activities')
        .update({ status: 'skipped' })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

console.log('📊 Supabase API service initialized (Full)');
