/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPES: USER
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Role } from '@/config/permissions';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: Role;
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
