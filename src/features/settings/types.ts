export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: string; // ex: 'Assinatura', 'Serviço Único', 'Consultoria'
    active: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface LossReason {
    id: string;
    name: string;
    active: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface Sector {
    id: string;
    name: string;
    description?: string;
    manager?: string;
    active: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions?: string[]; // IDs das permissões (ex: 'view_crm', 'manage_users')
    active: boolean;
    createdAt: number;
    updatedAt: number;
}


export interface Collaborator {
    id: string;
    name: string;
    email: string;
    phone?: string;
    roleId?: string;
    sectorId?: string;
    photoUrl?: string; // URL da foto ou base64
    active: boolean;
    authUid?: string; // ID do usuário no Firebase Auth
    createdAt: number;
    updatedAt: number;
}

export interface Permission {
    id: string;
    name: string;
    description?: string;
    active: boolean;
    createdAt: number;
    updatedAt: number;
}
