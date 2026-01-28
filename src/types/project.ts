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

export type ProjectStatus = 'backlog' | 'doing' | 'review' | 'done';

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
