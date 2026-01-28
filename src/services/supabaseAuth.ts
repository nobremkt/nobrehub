// Supabase Auth Service - 100% Native Supabase Authentication
// User IDs in public.users match auth.users IDs exactly

import { supabase } from '../lib/supabase';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'sdr' | 'closer_ht' | 'closer_lt' | 'production' | 'post_sales' | 'manager_sales' | 'manager_production' | 'strategic';
    pipelineType?: 'high_ticket' | 'low_ticket' | 'sales' | 'production' | 'post_sales';
    avatar?: string;
    isActive?: boolean;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

/**
 * Login using native Supabase Auth
 */
export async function supabaseLogin(email: string, password: string): Promise<LoginResponse> {

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('ðŸ” Supabase Auth: Login failed', authError.message);
        throw new Error(authError.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos'
            : authError.message);
    }

    if (!authData.user || !authData.session) {
        throw new Error('AutenticaÃ§Ã£o falhou');
    }


    // Fetch user profile from public.users (same ID as auth.users)
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active')
        .eq('id', authData.user.id)
        .single();

    if (profileError || !profile) {
        console.error('ðŸ” Supabase Auth: User profile not found', profileError);
        throw new Error('Perfil de usuÃ¡rio nÃ£o encontrado');
    }

    if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('UsuÃ¡rio inativo');
    }


    // Save to localStorage for backward compatibility
    localStorage.setItem('token', authData.session.access_token);
    localStorage.setItem('user', JSON.stringify(profile));
    localStorage.setItem('isLoggedIn', 'true');

    return {
        token: authData.session.access_token,
        user: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            pipelineType: profile.pipeline_type,
            isActive: profile.is_active
        }
    };
}

/**
 * Get current user from Supabase session
 */
export async function supabaseGetCurrentUser(): Promise<AuthUser | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return null;
        }

        const { data: profile } = await supabase
            .from('users')
            .select('id, email, name, role, pipeline_type, is_active')
            .eq('id', session.user.id)
            .single();

        if (!profile) {
            return null;
        }

        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            pipelineType: profile.pipeline_type,
            isActive: profile.is_active
        };
    } catch {
        return null;
    }
}

/**
 * Get list of users for dev panel
 */
export async function supabaseGetDevUsers(): Promise<AuthUser[]> {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active')
        .eq('is_active', true)
        .order('name');

    if (error || !users) {
        console.error('Failed to fetch dev users:', error);
        return [];
    }

    return users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        pipelineType: u.pipeline_type,
        isActive: u.is_active
    }));
}

/**
 * Dev login - for development/testing only
 * Simulates login by fetching user and creating a local session
 * NOTE: This does NOT create a real Supabase Auth session
 */
export async function supabaseDevLogin(userId: string): Promise<LoginResponse> {

    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active')
        .eq('id', userId)
        .single();

    if (error || !user) {
        console.error('ðŸ” Supabase Auth: Dev login failed', error);
        throw new Error('User not found');
    }

    // Create a fake token for dev purposes
    const token = btoa(JSON.stringify({ userId: user.id, dev: true, timestamp: Date.now() }));

    // Save to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');


    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            pipelineType: user.pipeline_type,
            isActive: user.is_active
        }
    };
}

/**
 * Logout - clear Supabase session and localStorage
 */
export async function supabaseLogout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
}
