/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPES: PROJECT (PRODUCTION)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type ProjectStatus = 'aguardando' | 'em-producao' | 'a-revisar' | 'revisado' | 'alteracao';

export interface Project {
    id: string;
    name: string;
    leadId: string;
    leadName: string;
    driveLink?: string;
    dueDate: Date;
    producerId: string;
    producerName: string;
    status: ProjectStatus;
    notes?: string;
    checklist: ProjectChecklistItem[];
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    order: number;
}

export interface ProjectHistory {
    id: string;
    projectId: string;
    action: 'created' | 'status_changed' | 'assigned' | 'delivered' | 'revision_requested';
    fromStatus?: ProjectStatus;
    toStatus?: ProjectStatus;
    userId: string;
    notes?: string;
    createdAt: Date;
}
