import { supabase } from '@/config/supabase';
import { Sector } from '../types';

export const SectorService = {
    /**
     * Lista todos os setores
     */
    getSectors: async (): Promise<Sector[]> => {
        const { data, error } = await supabase
            .from('sectors')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            description: row.description || undefined,
            manager: row.manager || undefined,
            active: row.active,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime()
        }));
    },

    /**
     * Cria um novo setor
     */
    createSector: async (sector: Omit<Sector, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const { data, error } = await supabase
            .from('sectors')
            .insert({
                name: sector.name,
                description: sector.description || null,
                manager: sector.manager || null,
                active: sector.active
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Atualiza um setor existente
     */
    updateSector: async (id: string, updates: Partial<Omit<Sector, 'id' | 'createdAt'>>): Promise<void> => {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.description !== undefined) payload.description = updates.description || null;
        if (updates.manager !== undefined) payload.manager = updates.manager || null;
        if (updates.active !== undefined) payload.active = updates.active;

        const { error } = await supabase
            .from('sectors')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Remove um setor
     */
    deleteSector: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('sectors')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
