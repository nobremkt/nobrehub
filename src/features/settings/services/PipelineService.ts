/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PIPELINE SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { PipelineStage } from '../types';

export const PipelineService = {
    /**
     * Lista todos os stages de pipeline
     */
    getStages: async (): Promise<PipelineStage[]> => {
        const { data, error } = await supabase
            .from('pipeline_stages')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        return (data ?? []).map(row => ({
            id: row.id,
            name: row.name,
            color: row.color,
            order: row.order,
            pipeline: row.pipeline as 'high-ticket' | 'low-ticket',
            isSystemStage: row.is_system_stage ?? false,
            active: row.active ?? true,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        }));
    },

    /**
     * Cria um novo stage
     */
    createStage: async (stage: Omit<PipelineStage, 'createdAt' | 'updatedAt'>): Promise<string> => {
        const { data, error } = await supabase
            .from('pipeline_stages')
            .insert({
                name: stage.name,
                color: stage.color,
                order: stage.order,
                pipeline: stage.pipeline,
                is_system_stage: stage.isSystemStage ?? false,
                active: stage.active ?? true,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Atualiza um stage existente
     */
    updateStage: async (id: string, updates: Partial<Omit<PipelineStage, 'id' | 'createdAt'>>): Promise<void> => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.order !== undefined) dbUpdates.order = updates.order;
        if (updates.pipeline !== undefined) dbUpdates.pipeline = updates.pipeline;
        if (updates.isSystemStage !== undefined) dbUpdates.is_system_stage = updates.isSystemStage;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        const { error } = await supabase
            .from('pipeline_stages')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Remove um stage (apenas se não for isSystemStage)
     */
    deleteStage: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('pipeline_stages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Seed default pipeline stages if none exist
     */
    seedDefaultStages: async (): Promise<PipelineStage[]> => {
        const defaults = [
            { name: 'Novo Lead', color: '#3B82F6', order: 0, pipeline: 'high-ticket', is_system_stage: true, active: true },
            { name: 'Qualificação', color: '#F59E0B', order: 1, pipeline: 'high-ticket', is_system_stage: false, active: true },
            { name: 'Proposta', color: '#8B5CF6', order: 2, pipeline: 'high-ticket', is_system_stage: false, active: true },
            { name: 'Negociação', color: '#EF4444', order: 3, pipeline: 'high-ticket', is_system_stage: false, active: true },
            { name: 'Fechamento', color: '#10B981', order: 4, pipeline: 'high-ticket', is_system_stage: true, active: true },
            { name: 'Novo Lead', color: '#3B82F6', order: 0, pipeline: 'low-ticket', is_system_stage: true, active: true },
            { name: 'Interesse', color: '#F59E0B', order: 1, pipeline: 'low-ticket', is_system_stage: false, active: true },
            { name: 'Fechamento', color: '#10B981', order: 2, pipeline: 'low-ticket', is_system_stage: true, active: true },
        ];

        const { error } = await supabase
            .from('pipeline_stages')
            .insert(defaults);

        if (error) throw error;
        return PipelineService.getStages();
    },
};
