/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// NOTES TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Note {
    id: string;
    title: string;
    content: string; // Markdown content
    createdAt: Date;
    updatedAt: Date;
    createdBy: string; // userId
}

export interface NoteFormData {
    title: string;
    content: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIC PROJECTS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface StrategicProject {
    id: string;
    title: string;
    description?: string;
    isShared: boolean;          // false = personal, true = shared
    ownerId: string;            // Creator's user ID
    memberIds: string[];        // Collaborator IDs (only strategic sector)
    status: 'active' | 'completed' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskTag {
    id: string;
    name: string;
    color: string;  // CSS color
}

export interface ProjectTask {
    id: string;
    projectId: string;
    parentTaskId?: string;      // For sub-tasks
    title: string;
    completed: boolean;
    order: number;
    priority: TaskPriority;
    assigneeId?: string | null; // Collaborator ID (legacy, for single assignee)
    assigneeIds?: string[];     // Multiple assignee IDs
    tags: string[];             // Tag names
    dueDate?: Date | null;      // Due date for the task
    createdAt: Date;
}

export type ProjectFilter = 'all' | 'personal' | 'shared';

export interface TaskFilter {
    assigneeId?: string;
    priority?: TaskPriority;
    tag?: string;
    showCompleted: boolean;
}

export interface TaskComment {
    id: string;
    taskId: string;
    projectId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
}

// Default tags available for tasks
export const DEFAULT_TASK_TAGS: TaskTag[] = [
    { id: 'bug', name: 'Bug', color: '#dc2626' },
    { id: 'feature', name: 'Feature', color: '#16a34a' },
    { id: 'improvement', name: 'Melhoria', color: '#2563eb' },
    { id: 'urgent', name: 'Urgente', color: '#ea580c' },
    { id: 'blocked', name: 'Bloqueado', color: '#7c3aed' },
    { id: 'review', name: 'Review', color: '#0891b2' },
];
