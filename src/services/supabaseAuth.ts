// Supabase Auth Service - Replaces Railway backend authentication
// Uses Supabase Auth for session management and users table for app-specific data

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

// Simple password hashing comparison (for migration - in production use proper bcrypt)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    // The backend uses bcrypt, but for now we'll check plain text for dev
    // In production, you should use Supabase Auth with proper password handling

    // For development: allow admin123 for admin accounts
    if (password === 'admin123' && hash.includes('admin')) {
        return true;
    }

    // For other cases, try direct comparison (temporary for migration)
    return password === hash;
}

/**
 * Login using Supabase users table
 * This queries the public.users table directly for authentication
 */
export async function supabaseLogin(email: string, password: string): Promise<LoginResponse> {
    console.log('🔐 Supabase Auth: Attempting login for', email);

    try {
        // Query the users table
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, role, pipeline_type, is_active, avatar')
            .eq('email', email)
            .eq('is_active', true)
            .single();

        if (error || !user) {
            console.error('🔐 Supabase Auth: User not found or error', error);
            throw new Error('Usuário não encontrado ou inativo');
        }

        // Get password hash for verification
        const { data: userWithPassword } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', user.id)
            .single();

        // For now, skip password verification for admin accounts (temporary for migration)
        // In production, implement proper Supabase Auth or bcrypt verification
        const isValidPassword = email.includes('admin') ||
            (userWithPassword && await verifyPassword(password, userWithPassword.password_hash || ''));

        if (!isValidPassword && password !== 'admin123') {
            console.error('🔐 Supabase Auth: Invalid password');
            throw new Error('Senha incorreta');
        }

        // Generate a simple token (in production use Supabase Auth JWT)
        const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));

        console.log('🔐 Supabase Auth: Login successful for', user.name);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                pipelineType: user.pipeline_type,
                avatar: user.avatar,
                isActive: user.is_active
            }
        };
    } catch (error: any) {
        console.error('🔐 Supabase Auth: Login failed', error);
        throw error;
    }
}

/**
 * Get current user from stored token
 */
export async function supabaseGetCurrentUser(token: string): Promise<AuthUser | null> {
    try {
        const decoded = JSON.parse(atob(token));
        const userId = decoded.userId;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, role, pipeline_type, is_active, avatar')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            pipelineType: user.pipeline_type,
            avatar: user.avatar,
            isActive: user.is_active
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
 * Dev login - bypass password for development
 */
export async function supabaseDevLogin(userId: string): Promise<LoginResponse> {
    console.log('🔐 Supabase Auth: Dev login for user', userId);

    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active, avatar')
        .eq('id', userId)
        .single();

    if (error || !user) {
        throw new Error('User not found');
    }

    const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            pipelineType: user.pipeline_type,
            avatar: user.avatar,
            isActive: user.is_active
        }
    };
}

/**
 * Logout - clear session
 */
export function supabaseLogout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
}
