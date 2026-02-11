import { supabase } from '@/config/supabase';
import { Permission } from '../types';

export const PermissionService = {
    /**
     * Lista todas as permissões
     */
    getPermissions: async (): Promise<Permission[]> => {
        const { data, error } = await supabase
            .from('permissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            description: row.description || undefined,
            active: row.active,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime()
        }));
    },

    /**
     * Cria uma nova permissão
     */
    createPermission: async (permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const { data, error } = await supabase
            .from('permissions')
            .insert({
                name: permission.name,
                description: permission.description || null,
                active: permission.active
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Atualiza uma permissão existente
     */
    updatePermission: async (id: string, updates: Partial<Omit<Permission, 'id' | 'createdAt'>>): Promise<void> => {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.description !== undefined) payload.description = updates.description || null;
        if (updates.active !== undefined) payload.active = updates.active;

        const { error } = await supabase
            .from('permissions')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Remove uma permissão
     */
    deletePermission: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('permissions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
