/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPES: USER
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface User {
    id: string;
    authUid?: string; // Firebase Auth UID - usado para chat e realtime features
    email: string;
    name: string;
    avatar?: string;
    photoUrl?: string;
    role: string; // ID do role ou nome
    permissions?: string[];
    roleId?: string; // ID do documento de role
    sector?: string;
    sectorId?: string;
    phone?: string;
    isActive?: boolean;
    active?: boolean;
    createdAt: Date | number;
    updatedAt: Date | number;
}

export interface UserSession {
    user: User;
    token: string;
    expiresAt: Date;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
