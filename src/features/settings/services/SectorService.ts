import { supabase } from '@/config/supabase';
import { Sector } from '../types';

export const SectorService = {
    /**
     * Lista todos os setores ordenados por display_order
     */
    getSectors: async (): Promise<Sector[]> => {
        const { data, error } = await supabase
            .from('sectors')
            .select('id, name, description, manager, active, leader_permissions, display_order, created_at, updated_at')
            .order('display_order', { ascending: true });

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            description: row.description ?? null,
            manager: row.manager ?? null,
            active: row.active,
            leaderPermissions: row.leader_permissions || [],
            displayOrder: row.display_order ?? 0,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime()
        }));
    },

    /**
     * Cria um novo setor (no final da lista)
     */
    createSector: async (sector: Omit<Sector, 'id' | 'createdAt' | 'updatedAt' | 'displayOrder'>): Promise<string> => {
        // Get the next order value
        const { data: maxData } = await supabase
            .from('sectors')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const nextOrder = (maxData?.display_order ?? -1) + 1;

        const { data, error } = await supabase
            .from('sectors')
            .insert({
                name: sector.name,
                description: sector.description || null,
                manager: sector.manager || null,
                active: sector.active,
                leader_permissions: sector.leaderPermissions || [],
                display_order: nextOrder
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
        if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
        if (updates.leaderPermissions !== undefined) payload.leader_permissions = updates.leaderPermissions;

        const { error } = await supabase
            .from('sectors')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Reordena setores em batch
     */
    reorderSectors: async (sectors: Pick<Sector, 'id' | 'displayOrder'>[]): Promise<void> => {
        // Use Promise.all for parallel updates
        const updates = sectors.map(s =>
            supabase
                .from('sectors')
                .update({ display_order: s.displayOrder, updated_at: new Date().toISOString() })
                .eq('id', s.id)
        );

        const results = await Promise.all(updates);
        const firstError = results.find(r => r.error);
        if (firstError?.error) throw firstError.error;
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
