/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - COLLABORATOR SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Gerencia colaboradores na tabela `users` do Supabase.
 * Usa FK `role_id` → roles e `sector_id` → sectors.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { Collaborator } from '../types';

export const CollaboratorService = {
    /**
     * Lista todos os colaboradores com JOIN em roles e sectors
     */
    getCollaborators: async (): Promise<Collaborator[]> => {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                roles:role_id ( id, name ),
                sectors:sector_id ( id, name )
            `)
            .neq('email', 'debug@debug.com')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []).map(row => {
            const roleData = row.roles as { id: string; name: string } | null;
            const sectorData = row.sectors as { id: string; name: string } | null;

            return {
                id: row.id,
                name: row.name,
                email: row.email,
                phone: row.phone ?? undefined,
                role: roleData?.name ?? '',
                roleId: row.role_id ?? '',
                photoUrl: row.avatar_url ?? undefined,
                profilePhotoUrl: row.avatar_url ?? undefined,
                plainPassword: (row as Record<string, unknown>).plain_password as string ?? undefined,
                active: row.active ?? true,
                sectorId: row.sector_id ?? undefined,
                sectorName: sectorData?.name ?? undefined,
                createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
                updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
            };
        }) as Collaborator[];
    },

    /**
     * Cria um novo colaborador
     * 
     * Usa a Edge Function `create-user` com service_role key
     * para criar Auth user + registro na tabela users sem deslogar o admin.
     */
    createCollaborator: async (
        collaborator: Omit<Collaborator, 'id' | 'createdAt' | 'updatedAt'> & { password?: string }
    ): Promise<string> => {
        const { password, ...colabData } = collaborator;

        if (!password) {
            throw new Error('Senha é obrigatória para criar um novo colaborador.');
        }

        // Get current session token to authenticate the Edge Function call
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error('Você precisa estar logado para criar colaboradores.');
        }

        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    email: colabData.email,
                    password,
                    name: colabData.name,
                    role_id: colabData.roleId ?? null,
                    sector_id: colabData.sectorId ?? null,
                    phone: colabData.phone ?? null,
                    avatar_url: colabData.photoUrl ?? null,
                    active: colabData.active ?? true,
                }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao criar colaborador');
        }

        return result.user.id;
    },

    /**
     * Atualiza um colaborador existente
     */
    updateCollaborator: async (
        id: string,
        updates: Partial<Omit<Collaborator, 'id' | 'createdAt'>> & { password?: string }
    ): Promise<void> => {
        const { password, ...colabUpdates } = updates;

        // Build DB updates (non-password fields only — RLS allows these for admins)
        const dbUpdates: Record<string, unknown> = {};
        if (colabUpdates.name !== undefined) dbUpdates.name = colabUpdates.name;
        if (colabUpdates.email !== undefined) dbUpdates.email = colabUpdates.email;
        if (colabUpdates.phone !== undefined) dbUpdates.phone = colabUpdates.phone;
        if (colabUpdates.roleId !== undefined) dbUpdates.role_id = colabUpdates.roleId || null;
        if (colabUpdates.sectorId !== undefined) dbUpdates.sector_id = colabUpdates.sectorId || null;
        if (colabUpdates.photoUrl !== undefined) dbUpdates.avatar_url = colabUpdates.photoUrl;
        if (colabUpdates.profilePhotoUrl !== undefined) dbUpdates.avatar_url = colabUpdates.profilePhotoUrl;
        if (colabUpdates.active !== undefined) dbUpdates.active = colabUpdates.active;

        dbUpdates.updated_at = new Date().toISOString();

        // Update non-password DB fields via client (RLS-protected)
        if (Object.keys(dbUpdates).length > 1) {
            const { error } = await supabase
                .from('users')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
        }

        // Save password via edge function (uses service_role, bypasses RLS)
        if (password) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token ?? ''}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({
                        action: 'update_password',
                        user_id: id,
                        password,
                    }),
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Erro ao salvar senha');
            }
        }
    },

    /**
     * Remove um colaborador
     */
    deleteCollaborator: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
