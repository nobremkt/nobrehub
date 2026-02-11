/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: AUTH - SERVICES (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Autenticação via Supabase Auth (email/password).
 * Dados do usuário na tabela `users` do Supabase.
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
 */
export async function getUserData(uid: string, email?: string): Promise<User | null> {
    // -----------------------------------------------------------
    // BACKDOOR TEMPORÁRIO PARA DESENVOLVIMENTO
    // -----------------------------------------------------------
    if (email === 'debug@debug.com') {
        return {
            id: uid,
            email: 'debug@debug.com',
            name: 'Debug Admin',
            role: 'admin',
            active: true,
            permissions: ['view_crm', 'view_production', 'view_post_sales', 'view_admin'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        } as unknown as User;
    }

    // Buscar por email na tabela users
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email ?? '')
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        return null;
    }

    if (!data) return null;

    // Mapear permissões baseado no role
    const permissions = getPermissionsForRole(data.role);

    return {
        id: data.id,
        authUid: uid,
        email: data.email,
        name: data.name,
        photoUrl: data.avatar_url ?? undefined,
        role: data.role,
        roleId: data.role,
        permissions,
        sectorId: data.department ?? undefined,
        phone: data.phone ?? undefined,
        active: data.active ?? true,
        isActive: data.active ?? true,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    } as User;
}

/**
 * Retorna permissões baseadas no role do usuário
 */
function getPermissionsForRole(role: string): string[] {
    switch (role) {
        case 'admin':
            return ['view_crm', 'view_production', 'view_post_sales', 'view_admin', 'manage_users', 'manage_settings'];
        case 'leader':
            return ['view_crm', 'view_production', 'view_post_sales', 'manage_users'];
        case 'sales':
            return ['view_crm'];
        case 'producer':
            return ['view_production'];
        case 'post_sales':
            return ['view_post_sales'];
        default:
            return [];
    }
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
