export interface Product {
    id: string;
    name: string;
    description?: string;
    price?: number; // Opcional - pode não ter preço
    category: string; // ex: 'Assinatura', 'Serviço Único', 'Consultoria'
    points?: number; // Pontos de produção (ex: Website = 2pts, E-commerce = 5pts)
    durationPoints?: { '30s': number; '60s': number; '60plus': number }; // Pontos por duração (só para categoria Vídeo)
    active: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface LossReason {
    id: string;
    name: string;
    active: boolean;
    order: number;
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
    photoUrl?: string; // URL da foto 9:16 ou base64
    profilePhotoUrl?: string; // URL da foto de perfil 1:1
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

export interface MessageTemplate {
    id: string;
    name: string;
    content: string; // Body text for display
    category: string;
    language?: string;
    components?: any[]; // Full WhatsApp components structure
    createdAt: number;
    updatedAt: number;
}
