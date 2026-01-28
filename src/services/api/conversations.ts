// Conversations API
import { supabase, toCamelCase, toSnakeCase } from './utils';
import type { Conversation } from '../../types/models';

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
