/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPES: USER
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: string; // ID do role ou nome
    permissions?: string[];
    roleId?: string; // ID do documento de role
    sector?: string;
    phone?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSession {
    user: User;
    token: string;
    expiresAt: Date;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
