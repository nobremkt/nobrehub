/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - LEAD SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * CRUD + bulk ops de leads usando Supabase PostgreSQL.
 * Converte camelCase (frontend) ↔ snake_case (banco).
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { Lead } from '@/types/lead.types';
import type { Database } from '@/types/supabase';

// ─── Supabase Row Types ──────────────────────────────────────────────
type LeadRow = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];

// ─── Helpers ─────────────────────────────────────────────────────────

/** Converte row do banco (snake_case) → Lead (camelCase) */
export function rowToLead(row: LeadRow): Lead {
    return {
        id: row.id,
        name: row.name,
        email: row.email ?? undefined,
        phone: row.phone,
        company: row.company ?? undefined,
        pipeline: row.pipeline as Lead['pipeline'],
        status: row.stage_id ?? '',
        order: row.order ?? 0,
        estimatedValue: row.estimated_value ?? undefined,
        tags: row.tags ?? [],
        responsibleId: row.responsible_id ?? '',
        customFields: (row.custom_fields as Record<string, unknown>) ?? undefined,
        notes: row.notes ?? undefined,
        temperature: row.temperature as Lead['temperature'],
        source: row.source ?? undefined,

        // Deal
        dealStatus: row.deal_status as Lead['dealStatus'],
        dealValue: row.deal_value ?? undefined,
        dealClosedAt: row.deal_closed_at ? new Date(row.deal_closed_at) : undefined,
        dealProductId: row.deal_product_id ?? undefined,
        dealNotes: row.deal_notes ?? undefined,

        // Loss
        lostReason: row.lost_reason_id ?? undefined,
        lostAt: row.lost_at ? new Date(row.lost_at) : undefined,

        // Pós-vendas
        postSalesId: row.post_sales_id ?? undefined,
        postSalesAssignedAt: row.post_sales_assigned_at ? new Date(row.post_sales_assigned_at) : undefined,
        postSalesDistributionStatus: row.post_sales_distribution_status as Lead['postSalesDistributionStatus'],
        clientStatus: row.client_status as Lead['clientStatus'],
        currentSector: row.current_sector as Lead['currentSector'],
        previousPostSalesIds: row.previous_post_sales_ids ?? undefined,

        // Timestamps
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
}

/** Converte campos parciais do Lead (camelCase) → updates do banco (snake_case) */
function leadToDbUpdates(updates: Partial<Lead>): LeadUpdate {
    const db: Record<string, unknown> = {} as Record<string, unknown>;
    const has = (key: keyof Lead) => Object.prototype.hasOwnProperty.call(updates, key);

    if (updates.name !== undefined) db.name = updates.name;
    if (updates.email !== undefined) db.email = updates.email;
    if (updates.phone !== undefined) db.phone = updates.phone;
    if (updates.company !== undefined) db.company = updates.company;
    if (updates.pipeline !== undefined) db.pipeline = updates.pipeline;
    if (updates.status !== undefined) db.stage_id = updates.status;
    if (updates.order !== undefined) db.order = updates.order;
    if (updates.estimatedValue !== undefined) db.estimated_value = updates.estimatedValue;
    if (updates.tags !== undefined) db.tags = updates.tags;
    if (updates.responsibleId !== undefined) db.responsible_id = updates.responsibleId;
    if (updates.customFields !== undefined) db.custom_fields = updates.customFields;
    if (updates.notes !== undefined) db.notes = updates.notes;
    if (updates.temperature !== undefined) db.temperature = updates.temperature;
    if (updates.source !== undefined) db.source = updates.source;

    // Deal
    if (updates.dealStatus !== undefined) db.deal_status = updates.dealStatus;
    if (updates.dealValue !== undefined) db.deal_value = updates.dealValue;
    if (has('dealClosedAt')) {
        db.deal_closed_at = updates.dealClosedAt
            ? (updates.dealClosedAt instanceof Date ? updates.dealClosedAt.toISOString() : updates.dealClosedAt)
            : null;
    }
    if (updates.dealProductId !== undefined) db.deal_product_id = updates.dealProductId;
    if (updates.dealNotes !== undefined) db.deal_notes = updates.dealNotes;

    // Loss
    if (has('lostReason')) db.lost_reason_id = updates.lostReason || null;
    if (has('lostAt')) {
        db.lost_at = updates.lostAt
            ? (updates.lostAt instanceof Date ? updates.lostAt.toISOString() : updates.lostAt)
            : null;
    }

    // Pós-vendas
    if (updates.postSalesId !== undefined) db.post_sales_id = updates.postSalesId;
    if (updates.postSalesAssignedAt !== undefined) db.post_sales_assigned_at = updates.postSalesAssignedAt instanceof Date ? updates.postSalesAssignedAt.toISOString() : updates.postSalesAssignedAt;
    if (updates.postSalesDistributionStatus !== undefined) db.post_sales_distribution_status = updates.postSalesDistributionStatus;
    if (updates.clientStatus !== undefined) db.client_status = updates.clientStatus;
    if (updates.currentSector !== undefined) db.current_sector = updates.currentSector;
    if (updates.previousPostSalesIds !== undefined) db.previous_post_sales_ids = updates.previousPostSalesIds;

    return db as LeadUpdate;
}

// ─── Service ─────────────────────────────────────────────────────────

export const LeadService = {
    // ═══════════════════════════════════════════════════════════════════
    // CRUD
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Fetch all leads.
     */
    getLeads: async (): Promise<Lead[]> => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return (data ?? []).map(rowToLead);
    },

    /**
     * Fetch leads with pagination (for infinite scroll).
     */
    getLeadsPaginated: async (
        page: number = 0,
        pageSize: number = 20
    ): Promise<{ leads: Lead[]; total: number }> => {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            leads: (data ?? []).map(rowToLead),
            total: count ?? 0,
        };
    },

    /**
     * Search leads server-side (ILIKE across name, email, phone, company).
     */
    searchLeads: async (term: string, limit: number = 50): Promise<Lead[]> => {
        const pattern = `%${term}%`;
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},company.ilike.${pattern}`)
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data ?? []).map(rowToLead);
    },

    /**
     * Create a new lead.
     */
    createLead: async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
        const dbData = leadToDbUpdates(lead as Partial<Lead>);

        const { data, error } = await supabase
            .from('leads')
            .insert(dbData as LeadInsert)
            .select('*')
            .single();

        if (error) throw error;

        return rowToLead(data);
    },

    /**
     * Update an existing lead.
     */
    updateLead: async (id: string, updates: Partial<Lead>): Promise<void> => {
        const dbUpdates = leadToDbUpdates(updates);

        // Never update createdAt
        delete dbUpdates.created_at;

        const { error } = await supabase
            .from('leads')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Update or create a lead. If the lead doesn't exist, creates it with the provided data.
     * Used when transitioning from Inbox conversations to CRM leads.
     */
    updateOrCreateLead: async (
        id: string,
        updates: Partial<Lead>,
        createData?: { name: string; phone?: string; email?: string }
    ): Promise<void> => {
        // Check if lead exists
        const { data: existing } = await supabase
            .from('leads')
            .select('id, tags')
            .eq('id', id)
            .maybeSingle();

        if (existing) {
            // Lead exists — update
            const dbUpdates = leadToDbUpdates(updates);
            delete dbUpdates.created_at;

            const { error } = await supabase
                .from('leads')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
        } else if (createData) {
            // Lead doesn't exist — create with ID
            const merged = {
                ...leadToDbUpdates(updates),
                id,
                name: createData.name,
                phone: createData.phone || '',
                email: createData.email || null,
                pipeline: 'low-ticket',
                stage_id: updates.status || null,
                tags: ['Pós-Venda'],
                responsible_id: updates.responsibleId || null,
            };

            const { error } = await supabase
                .from('leads')
                .insert(merged);

            if (error) throw error;
        } else {
            console.warn('[LeadService] Lead not found and no createData provided:', id);
        }
    },

    /**
     * Delete a lead.
     */
    deleteLead: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ═══════════════════════════════════════════════════════════════════
    // Bulk Operations
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Assign responsible (vendedora or pós-venda) to multiple leads.
     */
    bulkAssignResponsible: async (
        leadIds: string[],
        responsibleId: string,
        field: 'responsibleId' | 'postSalesId'
    ): Promise<void> => {
        const dbField = field === 'responsibleId' ? 'responsible_id' : 'post_sales_id';

        // M7: Quando atribui pós-venda, seta campos complementares
        const extraFields = field === 'postSalesId' ? {
            current_sector: 'pos_vendas',
            client_status: 'aguardando_projeto',
            post_sales_distribution_status: 'assigned',
            post_sales_assigned_at: new Date().toISOString(),
        } : {};

        const updatePromises = leadIds.map(id =>
            supabase.from('leads').update({ [dbField]: responsibleId, ...extraFields }).eq('id', id)
                .then(({ error }) => { if (error) throw error; })
        );

        await Promise.all(updatePromises);
    },

    /**
     * Move multiple leads to a new pipeline/stage.
     */
    bulkMoveStage: async (
        leadIds: string[],
        pipeline: 'high-ticket' | 'low-ticket',
        status: string
    ): Promise<void> => {
        const updatePromises = leadIds.map(id =>
            supabase.from('leads').update({ pipeline, stage_id: status }).eq('id', id)
                .then(({ error }) => { if (error) throw error; })
        );

        await Promise.all(updatePromises);
    },

    /**
     * Mark multiple leads as lost.
     * C2: Aceita lostStageId para mover lead à coluna correta do Kanban.
     */
    bulkMarkAsLost: async (leadIds: string[], lossReasonId: string, lostStageId?: string): Promise<void> => {
        const now = new Date().toISOString();

        const updatePromises = leadIds.map(id =>
            supabase.from('leads').update({
                lost_reason_id: lossReasonId,
                lost_at: now,
                deal_status: 'lost',
                ...(lostStageId ? { stage_id: lostStageId } : {}),
            }).eq('id', id)
                .then(({ error }) => { if (error) throw error; })
        );

        await Promise.all(updatePromises);
    },

    /**
     * Delete multiple leads.
     * C3: Verifica vínculos — leads em pós-vendas ou distribuição são bloqueados.
     */
    bulkDelete: async (leadIds: string[]): Promise<{ deleted: string[]; blocked: string[] }> => {
        // Verificar leads protegidos (em pós-vendas ou distribuição)
        const { data: protectedLeads } = await supabase
            .from('leads')
            .select('id, current_sector')
            .in('id', leadIds)
            .or('current_sector.eq.pos_vendas,current_sector.eq.distribution');

        const blockedIds = new Set((protectedLeads || []).map((l: { id: string }) => l.id));
        const safeIds = leadIds.filter(id => !blockedIds.has(id));

        if (safeIds.length > 0) {
            const { error } = await supabase
                .from('leads')
                .delete()
                .in('id', safeIds);

            if (error) throw error;
        }

        return { deleted: safeIds, blocked: Array.from(blockedIds) };
    },

    /**
     * Remove tags from multiple leads.
     */
    bulkRemoveTags: async (leadIds: string[], tagsToRemove: string[], currentContacts: Lead[]): Promise<void> => {
        const tagsSet = new Set(tagsToRemove);

        const updatePromises = leadIds.map(id => {
            const contact = currentContacts.find(c => c.id === id);
            if (!contact) return Promise.resolve();

            const oldTags = contact.tags || [];
            const newTags = oldTags.filter(t => !tagsSet.has(t));

            return supabase
                .from('leads')
                .update({ tags: newTags })
                .eq('id', id)
                .then(({ error }) => { if (error) throw error; });
        });

        await Promise.all(updatePromises);
    },

    /**
     * Add a tag to multiple leads.
     */
    bulkAddTag: async (leadIds: string[], tagToAdd: string, currentContacts: Lead[]): Promise<void> => {
        const updatePromises = leadIds.map(id => {
            const contact = currentContacts.find(c => c.id === id);
            if (!contact) return Promise.resolve();

            const currentTags = contact.tags || [];
            if (currentTags.includes(tagToAdd)) return Promise.resolve();

            return supabase
                .from('leads')
                .update({ tags: [...currentTags, tagToAdd] })
                .eq('id', id)
                .then(({ error }) => { if (error) throw error; });
        });

        await Promise.all(updatePromises);
    },

    // ═══════════════════════════════════════════════════════════════════
    // Sync
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Sync leads from Inbox conversations.
     * Uses leadId as primary identifier, falls back to phone matching.
     * Updates existing leads instead of creating duplicates.
     */
    syncFromInbox: async (): Promise<number> => {
        const PAGE_SIZE = 500;

        // 1. Paginated fetch of all conversations
        const conversations: Record<string, unknown>[] = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .range(from, from + PAGE_SIZE - 1);

            if (error) throw error;
            if (!data || data.length === 0) break;

            conversations.push(...data);
            hasMore = data.length === PAGE_SIZE;
            from += PAGE_SIZE;
        }

        if (conversations.length === 0) return 0;

        // 2. Get all existing leads — build lookup maps
        const { data: allLeads, error: leadsError } = await supabase
            .from('leads')
            .select('id, phone, name, email, company, pipeline, stage_id');

        if (leadsError) throw leadsError;

        const existingById = new Map<string, (typeof allLeads)[number]>();
        const existingByPhone = new Map<string, (typeof allLeads)[number]>();

        (allLeads ?? []).forEach(lead => {
            existingById.set(lead.id, lead);
            if (lead.phone) {
                existingByPhone.set(lead.phone.replace(/\D/g, ''), lead);
            }
        });

        const processedPhones = new Set<string>();
        const promises: Promise<any>[] = [];
        let count = 0;

        // 3. Process each conversation
        for (const conv of conversations) {
            const convPhone = conv.phone as string | undefined;
            const convName = conv.name as string | undefined;
            const convLeadId = conv.lead_id as string | undefined;
            const convChannel = conv.channel as string | undefined;
            const convId = conv.id as string;

            if (!convPhone) continue;

            const normalizedPhone = convPhone.replace(/\D/g, '');
            const isWhatsApp = convChannel === 'whatsapp';
            const correctPipeline = isWhatsApp ? 'low-ticket' : 'high-ticket';

            let existing: (typeof allLeads)[number] | undefined;

            // Priority 1: Match by lead_id
            if (convLeadId && existingById.has(convLeadId)) {
                existing = existingById.get(convLeadId);
            }
            // Priority 2: Match by phone
            else if (existingByPhone.has(normalizedPhone)) {
                existing = existingByPhone.get(normalizedPhone);
            }

            if (existing) {
                const updates: Record<string, unknown> = {};

                if (convName && convName !== existing.name) updates.name = convName;
                if (convPhone && convPhone !== existing.phone) updates.phone = convPhone;

                if (Object.keys(updates).length > 0) {
                    promises.push(
                        supabase.from('leads').update(updates as LeadUpdate).eq('id', existing.id)
                            .then(({ error }) => { if (error) throw error; }) as Promise<void>
                    );
                    count++;
                }

                // Link conversation to lead if not already linked
                if (!convLeadId && existing) {
                    promises.push(
                        supabase.from('conversations').update({ lead_id: existing.id }).eq('id', convId)
                            .then(({ error }) => { if (error) throw error; }) as Promise<void>
                    );
                }
            } else {
                // Create new lead
                if (processedPhones.has(normalizedPhone)) continue;
                processedPhones.add(normalizedPhone);
                count++;

                promises.push(
                    (async () => {
                        const { data: newLead, error } = await supabase
                            .from('leads')
                            .insert({
                                name: convName || normalizedPhone,
                                phone: convPhone,
                                pipeline: correctPipeline,
                                tags: ['Importado Inbox'],
                            })
                            .select('id')
                            .single();

                        if (error) throw error;

                        // Link conversation
                        await supabase
                            .from('conversations')
                            .update({ lead_id: newLead.id })
                            .eq('id', convId);

                        existingById.set(newLead.id, { ...newLead, phone: convPhone, name: convName || '', email: null, company: null, pipeline: correctPipeline, stage_id: null });
                        existingByPhone.set(normalizedPhone, existingById.get(newLead.id)!);
                    })()
                );
            }
        }

        await Promise.all(promises);
        return count;
    },
};
