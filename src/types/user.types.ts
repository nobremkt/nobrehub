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
    photoUrl?: string; // Foto 9:16 (banner/cover)
    profilePhotoUrl?: string; // Foto de perfil 1:1 (avatar)
    roleId: string; // UUID FK → roles table
    roleName?: string; // Nome do cargo (ex: "Diretor", "Vendedor(a)")
    sectorId?: string; // UUID FK → sectors table
    sectorName?: string; // Nome do setor (ex: "Vendas", "Produção")
    permissions?: string[]; // Array de permissões do role_permissions
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
