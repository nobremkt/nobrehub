import { supabase } from '@/config/supabase';
import { Role } from '../types';

export const RoleService = {
    /**
     * Lista todos os cargos
     */
    getRoles: async (): Promise<Role[]> => {
        const { data, error } = await supabase
            .from('roles')
            .select('id, name, description, permissions, active, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            description: row.description || undefined,
            permissions: row.permissions || [],
            active: row.active,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime()
        }));
    },

    /**
     * Cria um novo cargo
     */
    createRole: async (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const { data, error } = await supabase
            .from('roles')
            .insert({
                name: role.name,
                description: role.description || null,
                permissions: role.permissions || [],
                active: role.active
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Atualiza um cargo existente
     */
    updateRole: async (id: string, updates: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<void> => {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.description !== undefined) payload.description = updates.description || null;
        if (updates.permissions !== undefined) payload.permissions = updates.permissions;
        if (updates.active !== undefined) payload.active = updates.active;

        const { error } = await supabase
            .from('roles')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Remove um cargo
     */
    deleteRole: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
