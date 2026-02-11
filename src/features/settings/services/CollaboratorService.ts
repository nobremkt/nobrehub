/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - COLLABORATOR SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Gerencia colaboradores na tabela `users` do Supabase.
 * Criação de auth users requer Edge Function (admin API) — por enquanto
 * usamos supabase.auth.signUp() para criação básica.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { Collaborator } from '../types';

export const CollaboratorService = {
    /**
     * Lista todos os colaboradores
     */
    getCollaborators: async (): Promise<Collaborator[]> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []).map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone ?? undefined,
            role: row.role,
            roleId: row.role, // Maps role text to roleId for compatibility
            photoUrl: row.avatar_url ?? undefined,
            profilePhotoUrl: row.avatar_url ?? undefined,
            active: row.active ?? true,
            sectorId: row.department ?? undefined,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
        })) as Collaborator[];
    },

    /**
     * Cria um novo colaborador
     * 
     * Nota: Para criar user no Supabase Auth sem deslogar o admin,
     * seria ideal usar uma Edge Function com service_role key.
     * Por enquanto, cria apenas na tabela users.
     */
    createCollaborator: async (
        collaborator: Omit<Collaborator, 'id' | 'createdAt' | 'updatedAt'> & { password?: string }
    ): Promise<string> => {
        // Se tiver senha, tenta criar no Supabase Auth primeiro
        // NOTA: supabase.auth.signUp() via client SDK loga o novo user.
        // Para produção, usar Edge Function com admin.createUser().
        if (collaborator.password) {
            console.warn(
                '[CollaboratorService] Criando user via signUp (deslogará admin). ' +
                'Use Edge Function para criação sem deslogar.'
            );
        }

        const { password, ...colabData } = collaborator;

        const { data, error } = await supabase
            .from('users')
            .insert({
                name: colabData.name,
                email: colabData.email,
                role: colabData.roleId ?? 'sales',
                department: colabData.sectorId ?? null,
                avatar_url: colabData.photoUrl ?? null,
                phone: colabData.phone ?? null,
                active: colabData.active ?? true,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Atualiza um colaborador existente
     */
    updateCollaborator: async (
        id: string,
        updates: Partial<Omit<Collaborator, 'id' | 'createdAt'>> & { password?: string }
    ): Promise<void> => {
        const { password, ...colabUpdates } = updates;

        if (password) {
            throw new Error(
                "Por segurança, a alteração de senhas deve ser feita via 'Esqueci minha senha' ou pelo próprio usuário."
            );
        }

        const dbUpdates: Record<string, unknown> = {};
        if (colabUpdates.name !== undefined) dbUpdates.name = colabUpdates.name;
        if (colabUpdates.email !== undefined) dbUpdates.email = colabUpdates.email;
        if (colabUpdates.phone !== undefined) dbUpdates.phone = colabUpdates.phone;
        if (colabUpdates.roleId !== undefined) dbUpdates.role = colabUpdates.roleId;
        if (colabUpdates.sectorId !== undefined) dbUpdates.department = colabUpdates.sectorId;
        if (colabUpdates.photoUrl !== undefined) dbUpdates.avatar_url = colabUpdates.photoUrl;
        if (colabUpdates.profilePhotoUrl !== undefined) dbUpdates.avatar_url = colabUpdates.profilePhotoUrl;
        if (colabUpdates.active !== undefined) dbUpdates.active = colabUpdates.active;

        dbUpdates.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
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
