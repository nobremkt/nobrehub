/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - LOSS REASON SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { LossReason } from '../types';

export const LossReasonService = {
    /**
     * Lista todos os motivos de perda
     */
    getLossReasons: async (): Promise<LossReason[]> => {
        const { data, error } = await supabase
            .from('loss_reasons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []).map(row => ({
            id: row.id,
            name: row.name,
            active: row.is_active ?? true,
            order: 0,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            updatedAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        }));
    },

    /**
     * Cria um novo motivo
     */
    createLossReason: async (reason: Omit<LossReason, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const { data, error } = await supabase
            .from('loss_reasons')
            .insert({
                name: reason.name,
                is_active: reason.active ?? true,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Atualiza um motivo existente
     */
    updateLossReason: async (id: string, updates: Partial<Omit<LossReason, 'id' | 'createdAt'>>): Promise<void> => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.active !== undefined) dbUpdates.is_active = updates.active;

        const { error } = await supabase
            .from('loss_reasons')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Remove um motivo
     */
    deleteLossReason: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('loss_reasons')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
