// Miscellaneous APIs - Deals, Products, Pipeline, Messages, Settings, etc.
import { supabase, toCamelCase, toSnakeCase } from './utils';
import type { Deal, User } from '../../types/models';

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

export async function supabaseGetLeadDeals(leadId: string): Promise<Deal[]> {
    const { data, error } = await supabase
        .from('deals')
        .select(`*, owner:users!deals_owner_id_fkey(id, name)`)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
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
    const { data: created, error } = await supabase
        .from('pipeline_stages')
        .insert({ id: crypto.randomUUID(), ...toSnakeCase(data), created_at: new Date().toISOString() })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(created);
}

export async function supabaseUpdatePipelineStage(id: string, data: Partial<PipelineStage>): Promise<PipelineStage> {
    const { data: updated, error } = await supabase
        .from('pipeline_stages')
        .update(toSnakeCase(data))
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

export async function supabaseDeleteSector(id: string): Promise<void> {
    const { error } = await supabase.from('sectors').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export async function supabaseGetSectorsWithCount(): Promise<any[]> {
    const { data, error } = await supabase.from('sectors').select('*, users:users(id)').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((sector: any) => ({
        ...toCamelCase(sector),
        _count: { users: sector.users?.length || 0 }
    }));
}

export async function supabaseCreateSector(data: { name: string; description?: string; color: string }): Promise<any> {
    const now = new Date().toISOString();
    const { data: created, error } = await supabase
        .from('sectors')
        .insert({ id: crypto.randomUUID(), name: data.name, description: data.description, color: data.color, created_at: now, updated_at: now })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(created);
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
    const { data, error } = await supabase.from('organization').select('*').limit(1).single();
    if (error) return null;
    return toCamelCase(data);
}

export async function supabaseUpdateOrganization(orgData: Partial<Organization>): Promise<Organization> {
    const { data: existing } = await supabase.from('organization').select('id').limit(1).single();
    if (existing) {
        const { data: updated, error } = await supabase.from('organization').update(toSnakeCase(orgData)).eq('id', existing.id).select().single();
        if (error) throw new Error(error.message);
        return toCamelCase(updated);
    } else {
        const { data: created, error } = await supabase.from('organization').insert({ id: crypto.randomUUID(), ...toSnakeCase(orgData) }).select().single();
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
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return null;
    const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).single();
    if (error) return null;
    return toCamelCase(data);
}

export async function supabaseUpdateNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
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

// ============ WHATSAPP API ============
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xedfkizltrervaltuzrx.supabase.co';

export async function supabaseSendWhatsAppMessage(to: string, text: string, conversationId?: string, leadId?: string): Promise<{ success: boolean; messageId?: string }> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, text, conversationId, leadId })
    });
    const data = await response.json();
    if (!response.ok || (data && data.success === false)) {
        throw new Error(data.error || 'Falha ao enviar mensagem');
    }
    return data;
}

export async function supabaseSendWhatsAppTemplate(to: string, templateName: string, params?: { languageCode?: string; components?: any[] }, conversationId?: string, leadId?: string): Promise<{ success: boolean; messageId?: string }> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-api/send-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, templateName, ...params, conversationId, leadId })
    });
    const data = await response.json();
    if (!response.ok || (data && data.success === false)) {
        let errorMsg = 'Falha ao enviar template';
        if (data?.error) {
            if (typeof data.error === 'string') errorMsg = data.error;
            else if (typeof data.error === 'object') errorMsg = data.error.message || JSON.stringify(data.error);
        }
        throw new Error(errorMsg);
    }
    return data;
}

export async function supabaseGetWhatsAppTemplates(): Promise<any[]> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-api/templates`);
    const data = await response.json();
    if (!response.ok || (data && data.error)) {
        let errorMsg = 'Falha ao buscar templates';
        if (data?.error) {
            if (typeof data.error === 'string') errorMsg = data.error;
            else if (typeof data.error === 'object') errorMsg = data.error.message || JSON.stringify(data.error);
        }
        throw new Error(errorMsg);
    }
    return data.templates || [];
}

// ============ MESSAGES API ============
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

export async function supabaseGetUsersWithSector(): Promise<User[]> {
    const { data, error } = await supabase
        .from('users')
        .select(`*, sector:sectors!users_sector_id_fkey(id, name, color, description)`)
        .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

// ============ LEAD DETAILS API ============
export async function supabaseGetLeadConversations(leadId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('conversations')
        .select(`id, status, pipeline, channel, last_message_at, assigned_agent:users!conversations_assigned_agent_id_fkey(id, name), messages(text, created_at)`)
        .eq('lead_id', leadId)
        .order('last_message_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseGetLeadHistory(leadId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('lead_history')
        .select(`id, action, details, created_at, user:users!lead_history_created_by_fkey(id, name)`)
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

// ============ PERMISSIONS API ============
export interface RoleAccess {
    id: string;
    role: string;
    permissions: string[];
}

export async function supabaseGetPermissions(): Promise<RoleAccess[]> {
    const { data, error } = await supabase.from('role_access').select('*').order('role');
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseUpdatePermissions(role: string, permissions: string[]): Promise<RoleAccess> {
    const { data: existing } = await supabase.from('role_access').select('*').eq('role', role).single();
    if (existing) {
        const { data, error } = await supabase.from('role_access').update({ permissions }).eq('role', role).select().single();
        if (error) throw new Error(error.message);
        return toCamelCase(data);
    } else {
        const { data, error } = await supabase.from('role_access').insert({ role, permissions }).select().single();
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
    const { data, error } = await supabase.from('channels').select('*').order('created_at');
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseCreateChannel(channelData: Partial<Channel>): Promise<Channel> {
    const { data, error } = await supabase.from('channels').insert(toSnakeCase(channelData)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseUpdateChannel(id: string, channelData: Partial<Channel>): Promise<Channel> {
    const { data, error } = await supabase.from('channels').update(toSnakeCase(channelData)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseToggleChannel(id: string, isEnabled: boolean): Promise<Channel> {
    const { data, error } = await supabase.from('channels').update({ is_enabled: isEnabled }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseDeleteChannel(id: string): Promise<void> {
    const { error } = await supabase.from('channels').delete().eq('id', id);
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
    const { data, error } = await supabase.from('custom_field_values').select(`*, custom_field:custom_fields(*)`).eq('lead_id', leadId);
    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({
        ...toCamelCase(item.custom_field),
        value: item.value
    }));
}

export async function supabaseSetCustomFieldValue(leadId: string, customFieldId: string, value: string): Promise<void> {
    const { error } = await supabase.from('custom_field_values').upsert({ lead_id: leadId, custom_field_id: customFieldId, value }, { onConflict: 'lead_id,custom_field_id' });
    if (error) throw new Error(error.message);
}

export async function supabaseCreateCustomField(fieldData: Omit<CustomField, 'id' | 'value'>): Promise<CustomField> {
    const { data, error } = await supabase.from('custom_fields').insert(toSnakeCase(fieldData)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseDeleteCustomField(id: string): Promise<void> {
    const { error } = await supabase.from('custom_fields').delete().eq('id', id);
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
    let query = supabase.from('activities').select('*').eq('lead_id', leadId).order('due_date', { ascending: true });
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
        .update({ status: 'completed', completed_at: new Date().toISOString(), notes })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseSkipActivity(id: string): Promise<Activity> {
    const { data, error } = await supabase.from('activities').update({ status: 'skipped' }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data);
}
