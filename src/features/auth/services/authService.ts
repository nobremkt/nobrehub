/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: AUTH - SERVICES (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Autenticação via Supabase Auth (email/password).
 * Dados do usuário na tabela `users` do Supabase.
 * Permissões carregadas via JOIN com `roles` + `role_permissions`.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import type { User } from '@/types';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

/**
 * Login com email e senha
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) throw new Error(authError.message);

    const userData = await getUserData(authData.user.id, authData.user.email || email);

    if (!userData) {
        throw new Error('Usuário não encontrado no sistema');
    }

    return userData;
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Buscar dados do usuário na tabela `users` do Supabase
 * Faz JOIN com `roles` e `sectors` para nomes e `role_permissions` para permissões
 */
export async function getUserData(uid: string, email?: string): Promise<User | null> {
    // -----------------------------------------------------------
    // BACKDOOR TEMPORÁRIO PARA DESENVOLVIMENTO
    // -----------------------------------------------------------
    if (email === 'debug@debug.com') {
        // Buscar permissões reais do Diretor
        const { data: perms } = await supabase
            .from('role_permissions')
            .select('permission')
            .eq('role_id', 'cfb47a1c-8f0c-47c9-b4b1-7dbb82a11313');

        return {
            id: uid,
            email: 'debug@debug.com',
            name: 'Debug Admin',
            roleId: 'cfb47a1c-8f0c-47c9-b4b1-7dbb82a11313',
            roleName: 'Diretor',
            permissions: perms?.map(p => p.permission) ?? [],
            active: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        } as User;
    }

    // Buscar usuário com JOIN em roles e sectors
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            roles:role_id ( id, name ),
            sectors:sector_id ( id, name )
        `)
        .eq('email', email ?? '')
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        return null;
    }

    if (!data) return null;

    // Buscar permissões do role
    const permissions: string[] = [];
    if (data.role_id) {
        const { data: perms } = await supabase
            .from('role_permissions')
            .select('permission')
            .eq('role_id', data.role_id);

        if (perms) {
            permissions.push(...perms.map(p => p.permission));
        }
    }

    // Buscar permissões de líder (se for manager de algum setor)
    if (data.name) {
        const { data: sectorRows } = await supabase
            .from('sectors')
            .select('leader_permissions')
            .eq('manager', data.name)
            .eq('active', true);

        if (sectorRows) {
            for (const s of sectorRows) {
                for (const p of (s.leader_permissions || [])) {
                    if (!permissions.includes(p)) permissions.push(p);
                }
            }
        }
    }

    const roleData = data.roles as { id: string; name: string } | null;
    const sectorData = data.sectors as { id: string; name: string } | null;

    return {
        id: data.id,
        authUid: uid,
        email: data.email,
        name: data.name,
        photoUrl: data.avatar_url ?? undefined,
        roleId: data.role_id ?? '',
        roleName: roleData?.name ?? undefined,
        permissions,
        sectorId: data.sector_id ?? undefined,
        sectorName: sectorData?.name ?? undefined,
        phone: data.phone ?? undefined,
        active: data.active ?? true,
        isActive: data.active ?? true,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    } as User;
}

/**
 * Observar mudanças no estado de autenticação
 */
export function subscribeToAuthState(
    callback: (user: SupabaseAuthUser | null) => void
): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });

    return () => {
        subscription.unsubscribe();
    };
}
