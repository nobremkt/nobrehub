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

// ─── Helpers ─────────────────────────────────────────────────────────

/** Converte row do banco (snake_case) → Lead (camelCase) */
function rowToLead(row: any): Lead {
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
        customFields: row.custom_fields ?? undefined,
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
function leadToDbUpdates(updates: Partial<Lead>): Record<string, unknown> {
    const db: Record<string, unknown> = {};

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
    if (updates.dealClosedAt !== undefined) db.deal_closed_at = updates.dealClosedAt instanceof Date ? updates.dealClosedAt.toISOString() : updates.dealClosedAt;
    if (updates.dealProductId !== undefined) db.deal_product_id = updates.dealProductId;
    if (updates.dealNotes !== undefined) db.deal_notes = updates.dealNotes;

    // Loss
    if (updates.lostReason !== undefined) db.lost_reason_id = updates.lostReason;
    if (updates.lostAt !== undefined) db.lost_at = updates.lostAt instanceof Date ? updates.lostAt.toISOString() : updates.lostAt;

    // Pós-vendas
    if (updates.postSalesId !== undefined) db.post_sales_id = updates.postSalesId;
    if (updates.postSalesAssignedAt !== undefined) db.post_sales_assigned_at = updates.postSalesAssignedAt instanceof Date ? updates.postSalesAssignedAt.toISOString() : updates.postSalesAssignedAt;
    if (updates.postSalesDistributionStatus !== undefined) db.post_sales_distribution_status = updates.postSalesDistributionStatus;
    if (updates.clientStatus !== undefined) db.client_status = updates.clientStatus;
    if (updates.currentSector !== undefined) db.current_sector = updates.currentSector;
    if (updates.previousPostSalesIds !== undefined) db.previous_post_sales_ids = updates.previousPostSalesIds;

    return db;
}

// ─── Service ─────────────────────────────────────────────────────────

export const LeadService = {
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
     * Create a new lead.
     */
    createLead: async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
        const dbData = leadToDbUpdates(lead as Partial<Lead>);

        const { data, error } = await supabase
            .from('leads')
            .insert(dbData)
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

    /**
     * Sync leads from Inbox conversations.
     * Uses leadId as primary identifier, falls back to phone matching.
     * Updates existing leads instead of creating duplicates.
     */
    syncFromInbox: async (): Promise<number> => {
        // 1. Get all conversations from Supabase
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('*');

        if (convError) throw convError;
        if (!conversations || conversations.length === 0) return 0;

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
            if (!conv.phone) continue;

            const normalizedPhone = conv.phone.replace(/\D/g, '');
            const isWhatsApp = conv.channel === 'whatsapp';
            const correctPipeline = isWhatsApp ? 'low-ticket' : 'high-ticket';

            let existing: (typeof allLeads)[number] | undefined;

            // Priority 1: Match by lead_id
            if (conv.lead_id && existingById.has(conv.lead_id)) {
                existing = existingById.get(conv.lead_id);
            }
            // Priority 2: Match by phone
            else if (existingByPhone.has(normalizedPhone)) {
                existing = existingByPhone.get(normalizedPhone);
            }

            if (existing) {
                const updates: Record<string, unknown> = {};

                if (conv.name && conv.name !== existing.name) updates.name = conv.name;
                if (conv.phone && conv.phone !== existing.phone) updates.phone = conv.phone;

                if (Object.keys(updates).length > 0) {
                    promises.push(
                        supabase.from('leads').update(updates).eq('id', existing.id)
                            .then(({ error }) => { if (error) throw error; })
                    );
                    count++;
                }

                // Link conversation to lead if not already linked
                if (!conv.lead_id && existing) {
                    promises.push(
                        supabase.from('conversations').update({ lead_id: existing.id }).eq('id', conv.id)
                            .then(({ error }) => { if (error) throw error; })
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
                                name: conv.name || normalizedPhone,
                                phone: conv.phone,
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
                            .eq('id', conv.id);

                        existingById.set(newLead.id, { ...newLead, phone: conv.phone, name: conv.name, email: null, company: null, pipeline: correctPipeline, stage_id: null });
                        existingByPhone.set(normalizedPhone, existingById.get(newLead.id)!);
                    })()
                );
            }
        }

        await Promise.all(promises);
        return count;
    },

    /**
     * Assign responsible (vendedora or pós-venda) to multiple leads.
     */
    bulkAssignResponsible: async (
        leadIds: string[],
        responsibleId: string,
        field: 'responsibleId' | 'postSalesId'
    ): Promise<void> => {
        const dbField = field === 'responsibleId' ? 'responsible_id' : 'post_sales_id';

        const updatePromises = leadIds.map(id =>
            supabase.from('leads').update({ [dbField]: responsibleId }).eq('id', id)
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
     */
    bulkMarkAsLost: async (leadIds: string[], lossReasonId: string): Promise<void> => {
        const now = new Date().toISOString();

        const updatePromises = leadIds.map(id =>
            supabase.from('leads').update({
                lost_reason_id: lossReasonId,
                lost_at: now,
                deal_status: 'lost',
            }).eq('id', id)
                .then(({ error }) => { if (error) throw error; })
        );

        await Promise.all(updatePromises);
    },

    /**
     * Delete multiple leads.
     */
    bulkDelete: async (leadIds: string[]): Promise<void> => {
        const { error } = await supabase
            .from('leads')
            .delete()
            .in('id', leadIds);

        if (error) throw error;
    },
};
