/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - PROJECTS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service para gerenciamento de projetos estratégicos no Supabase.
 * Realtime sync com subtarefas.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores';
import { StrategicProject, ProjectTask, TaskPriority, TaskComment } from '../types';

// Strategic Sector ID
export const STRATEGIC_SECTOR_ID = 'zeekJ4iY9voX3AURpar5';

// ─── Row → Frontend type mappers ─────────────────────────────────────────────

function mapRowToProject(row: Record<string, unknown>): StrategicProject {
    return {
        id: row.id as string,
        title: (row.title as string) || 'Sem título',
        description: (row.description as string) || '',
        isShared: (row.is_shared as boolean) || false,
        ownerId: (row.owner_id as string) || '',
        memberIds: (row.member_ids as string[]) || [],
        status: (row.status as StrategicProject['status']) || 'active',
        createdAt: new Date((row.created_at as string) || Date.now()),
        updatedAt: new Date((row.updated_at as string) || Date.now()),
    };
}

function mapRowToTask(row: Record<string, unknown>): ProjectTask {
    return {
        id: row.id as string,
        projectId: row.project_id as string,
        parentTaskId: (row.parent_task_id as string) || undefined,
        title: (row.title as string) || '',
        completed: (row.completed as boolean) || false,
        order: (row.order as number) || 0,
        priority: (row.priority as TaskPriority) || 'medium',
        assigneeId: (row.assignee_id as string) || undefined,
        assigneeIds: (row.assignee_ids as string[]) || [],
        tags: (row.tags as string[]) || [],
        dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
        createdAt: new Date((row.created_at as string) || Date.now()),
    };
}

function mapRowToComment(row: Record<string, unknown>): TaskComment {
    return {
        id: row.id as string,
        projectId: row.project_id as string,
        taskId: row.task_id as string,
        authorId: (row.author_id as string) || '',
        authorName: (row.author_name as string) || 'Anônimo',
        content: (row.content as string) || '',
        createdAt: new Date((row.created_at as string) || Date.now()),
    };
}

export const StrategicProjectsService = {
    /**
     * Subscribe to user's projects (personal + shared with them)
     */
    subscribeToProjects(callback: (projects: StrategicProject[]) => void): () => void {
        const user = useAuthStore.getState().user;
        const userId = user?.id || '';

        if (!userId) {
            callback([]);
            return () => { };
        }

        // Helper to fetch and broadcast
        const fetchAndBroadcast = async () => {
            try {
                // Supabase doesn't support OR across different columns in a single filter,
                // so we fetch both sets and merge
                const [ownedRes, sharedRes] = await Promise.all([
                    supabase
                        .from('strategic_projects')
                        .select('*')
                        .eq('owner_id', userId)
                        .order('updated_at', { ascending: false }),
                    supabase
                        .from('strategic_projects')
                        .select('*')
                        .contains('member_ids', [userId])
                        .order('updated_at', { ascending: false })
                ]);

                const ownedProjects = (ownedRes.data || []).map(r => mapRowToProject(r));
                const sharedProjects = (sharedRes.data || []).map(r => mapRowToProject(r));

                // Deduplicate (user can be both owner and member)
                const projectMap = new Map<string, StrategicProject>();
                [...ownedProjects, ...sharedProjects].forEach(p => projectMap.set(p.id, p));

                const allProjects = Array.from(projectMap.values());
                allProjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

                callback(allProjects);
            } catch (error) {
                console.error('Error fetching strategic projects:', error);
                callback([]);
            }
        };

        // Initial fetch
        fetchAndBroadcast();

        // Realtime
        const channel = supabase
            .channel('strategic_projects_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'strategic_projects'
            }, () => {
                fetchAndBroadcast();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Subscribe to tasks for a specific project
     */
    subscribeToTasks(projectId: string, callback: (tasks: ProjectTask[]) => void): () => void {
        const fetchTasks = async () => {
            try {
                const { data, error } = await supabase
                    .from('strategic_tasks')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('order', { ascending: true });

                if (error) throw error;
                callback((data || []).map(row => mapRowToTask(row)));
            } catch (error) {
                console.error('Error fetching tasks:', error);
                callback([]);
            }
        };

        // Initial fetch
        fetchTasks();

        // Realtime
        const channel = supabase
            .channel(`strategic_tasks_${projectId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'strategic_tasks',
                filter: `project_id=eq.${projectId}`
            }, () => {
                fetchTasks();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Create a new project
     */
    async createProject(data: {
        title: string;
        description?: string;
        isShared: boolean;
        memberIds?: string[];
    }): Promise<string> {
        const user = useAuthStore.getState().user;
        const now = new Date().toISOString();

        const { data: inserted, error } = await supabase
            .from('strategic_projects')
            .insert({
                title: data.title,
                description: data.description || '',
                is_shared: data.isShared,
                owner_id: user?.id || '',
                member_ids: data.memberIds || [],
                status: 'active',
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (error) throw error;
        return inserted.id;
    },

    /**
     * Update project
     */
    async updateProject(projectId: string, data: Partial<Pick<StrategicProject, 'title' | 'description' | 'status' | 'memberIds'>>): Promise<void> {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (data.title !== undefined) payload.title = data.title;
        if (data.description !== undefined) payload.description = data.description;
        if (data.status !== undefined) payload.status = data.status;
        if (data.memberIds !== undefined) payload.member_ids = data.memberIds;

        const { error } = await supabase
            .from('strategic_projects')
            .update(payload)
            .eq('id', projectId);

        if (error) throw error;
    },

    /**
     * Delete project (cascade deletes tasks and comments via FK)
     */
    async deleteProject(projectId: string): Promise<void> {
        const { error } = await supabase
            .from('strategic_projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    },

    /**
     * Create a new task in a project
     */
    async createTask(projectId: string, data: {
        title: string;
        order?: number;
        priority?: TaskPriority;
        assigneeId?: string;
        parentTaskId?: string;
        dueDate?: Date;
        tags?: string[];
    }): Promise<string> {
        const now = new Date().toISOString();

        const { data: inserted, error } = await supabase
            .from('strategic_tasks')
            .insert({
                project_id: projectId,
                title: data.title,
                completed: false,
                order: data.order || 0,
                priority: data.priority || 'medium',
                assignee_id: data.assigneeId || null,
                parent_task_id: data.parentTaskId || null,
                due_date: data.dueDate ? data.dueDate.toISOString() : null,
                tags: data.tags || [],
                created_at: now,
            })
            .select('id')
            .single();

        if (error) throw error;

        // Update project's updatedAt
        await supabase
            .from('strategic_projects')
            .update({ updated_at: now })
            .eq('id', projectId);

        return inserted.id;
    },

    /**
     * Update task
     */
    async updateTask(projectId: string, taskId: string, data: Partial<Pick<ProjectTask, 'title' | 'completed' | 'order' | 'priority' | 'assigneeId' | 'assigneeIds' | 'parentTaskId' | 'dueDate' | 'tags'>>): Promise<void> {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (data.title !== undefined) payload.title = data.title;
        if (data.completed !== undefined) {
            payload.completed = data.completed;
            payload.completed_at = data.completed ? new Date().toISOString() : null;
        }
        if (data.order !== undefined) payload.order = data.order;
        if (data.priority !== undefined) payload.priority = data.priority;
        if (data.assigneeId !== undefined) payload.assignee_id = data.assigneeId || null;
        if (data.assigneeIds !== undefined) payload.assignee_ids = data.assigneeIds;
        if (data.parentTaskId !== undefined) payload.parent_task_id = data.parentTaskId || null;
        if (data.dueDate !== undefined) payload.due_date = data.dueDate ? data.dueDate.toISOString() : null;
        if (data.tags !== undefined) payload.tags = data.tags;

        const { error } = await supabase
            .from('strategic_tasks')
            .update(payload)
            .eq('id', taskId)
            .eq('project_id', projectId);

        if (error) throw error;

        // Update project's updatedAt
        await supabase
            .from('strategic_projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);
    },

    /**
     * Delete task
     */
    async deleteTask(projectId: string, taskId: string): Promise<void> {
        const { error } = await supabase
            .from('strategic_tasks')
            .delete()
            .eq('id', taskId)
            .eq('project_id', projectId);

        if (error) throw error;

        // Update project's updatedAt
        await supabase
            .from('strategic_projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);
    },

    /**
     * Add comment to a task
     */
    async addComment(projectId: string, taskId: string, data: { content: string; authorId: string; authorName: string }): Promise<string> {
        const { data: inserted, error } = await supabase
            .from('task_comments')
            .insert({
                project_id: projectId,
                task_id: taskId,
                author_id: data.authorId,
                author_name: data.authorName,
                content: data.content,
            })
            .select('id')
            .single();

        if (error) throw error;
        return inserted.id;
    },

    /**
     * Subscribe to task comments
     */
    subscribeToComments(projectId: string, taskId: string, callback: (comments: TaskComment[]) => void): () => void {
        const fetchComments = async () => {
            const { data } = await supabase
                .from('task_comments')
                .select('*')
                .eq('project_id', projectId)
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            callback((data || []).map(row => mapRowToComment(row)));
        };

        // Initial fetch
        fetchComments();

        // Realtime
        const channel = supabase
            .channel(`task_comments_${taskId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'task_comments',
                filter: `task_id=eq.${taskId}`
            }, () => {
                fetchComments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },
};
