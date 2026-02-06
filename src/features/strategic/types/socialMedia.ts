/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - SOCIAL MEDIA TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type PlanType = 'expansao' | 'presenca' | 'outro';
export type PostStatus = 'pending' | 'completed' | 'missed';

export interface SocialMediaClient {
    id: string;
    clientName: string;
    contact: string;
    companyName: string;
    instagramUsername?: string;
    instagramUrl?: string;
    paymentDate?: Date | null;
    planDuration: number;           // Meses: 1, 3, 6, 12...
    planType: PlanType;
    postStartDate: Date;
    contractEndDate?: Date | null;
    value?: number | null;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

export interface SocialMediaPost {
    id: string;
    clientId: string;
    scheduledDate: Date;
    status: PostStatus;
    notes?: string;
    createdAt: Date;
}

export interface SocialMediaClientFormData {
    clientName: string;
    contact: string;
    companyName: string;
    instagramUsername?: string;
    instagramUrl?: string;
    paymentDate?: Date | null;
    planDuration: number;
    planType: PlanType;
    postStartDate: Date;
    contractEndDate?: Date | null;
    value?: number | null;
}
