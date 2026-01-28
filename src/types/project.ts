/**
 * Project Types
 * 
 * Projects represent production work items created from closed deals.
 * They track the delivery workflow for videos/products.
 */

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    completedAt?: string;
}

export interface Project {
    id: string;
    name: string;
    leadId?: string;
    driveLink?: string;
    deadline?: string;
    status: ProjectStatus;
    assignedTo?: string;
    checklist: ChecklistItem[];
    notes?: string;
    createdAt: string;
    updatedAt: string;

    // Joined data from API
    assignee?: {
        id: string;
        name: string;
        avatar?: string;
    };
    lead?: {
        id: string;
        name: string;
        company?: string;
    };
}

export type ProjectStatus = 'backlog' | 'doing' | 'review' | 'done' | 'revision';

// Status display configuration
export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
    backlog: { label: 'Aguardando', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    doing: { label: 'Em Produção', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    review: { label: 'Revisão', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    done: { label: 'Entregue', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    revision: { label: 'Alteração', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export interface CreateProjectData {
    name: string;
    leadId?: string;
    driveLink?: string;
    deadline?: string;
    assignedTo?: string;
    notes?: string;
    checklist?: ChecklistItem[];
}

export interface UpdateProjectData {
    name?: string;
    driveLink?: string;
    deadline?: string;
    status?: ProjectStatus;
    assignedTo?: string;
    checklist?: ChecklistItem[];
    notes?: string;
}
