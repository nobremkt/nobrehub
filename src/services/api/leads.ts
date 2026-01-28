// Leads API - Domain module for lead management
import { supabase, toCamelCase, toSnakeCase } from './utils';
import type { Lead, CreateLeadData, LossReason } from '../../types/models';

export async function supabaseGetLeads(filters?: { pipeline?: string; status?: string }): Promise<Lead[]> {
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
        query = query.or(`status_ht.eq.${filters.status},status_lt.eq.${filters.status},status_production.eq.${filters.status},status_post_sales.eq.${filters.status}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseGetLead(id: string): Promise<Lead> {
    const { data, error } = await supabase
        .from('leads')
        .select(`
      *,
      assignee:users!leads_assigned_to_fkey(id, name, avatar),
      loss_reason:loss_reasons!leads_loss_reason_id_fkey(id, name, description)
    `)
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseCreateLead(data: CreateLeadData): Promise<Lead> {
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

    if (error) throw new Error(error.message);
    return toCamelCase(created);
}

export async function supabaseUpdateLead(id: string, data: Partial<CreateLeadData>): Promise<Lead> {
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

    if (error) throw new Error(error.message);
    return toCamelCase(updated);
}

export async function supabaseUpdateLeadStatus(id: string, status: string, pipeline?: string): Promise<Lead> {
    const lead = await supabaseGetLead(id);
    const targetPipeline = pipeline || lead.pipeline;

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

    if (error) throw new Error(error.message);
    return toCamelCase(updated);
}

export async function supabaseDeleteLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export interface StageChangeResult {
    lead: Lead;
    stageChange: { from: string; to: string; pipeline: string; changedBy: string; changedAt: string };
}

export async function supabaseUpdateLeadStage(id: string, stage: string, pipeline?: string): Promise<StageChangeResult> {
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

export async function supabaseGetAllTags(): Promise<string[]> {
    const { data, error } = await supabase.from('leads').select('tags');
    if (error) {
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

export async function supabaseUpdateLeadTags(leadId: string, tags: string[]): Promise<Lead> {
    const { data, error } = await supabase
        .from('leads')
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

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

export async function supabaseGetLossReasons(): Promise<LossReason[]> {
    const { data, error } = await supabase.from('loss_reasons').select('*').eq('is_active', true).order('name');
    if (error) {
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

export async function supabaseAssignLead(leadId: string, userId: string): Promise<Lead> {
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

    if (error) throw new Error(error.message);
    return toCamelCase(updated);
}
