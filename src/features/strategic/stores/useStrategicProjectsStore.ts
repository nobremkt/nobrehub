/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - PROJECTS STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Zustand store para gerenciamento de estado dos projetos estratégicos.
 * Realtime sync com Firestore.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { StrategicProject, ProjectTask, ProjectFilter, TaskFilter, TaskPriority } from '../types';
import { StrategicProjectsService } from '../services/StrategicProjectsService';
import { useAuthStore } from '@/stores';
import { toast } from 'react-toastify';

interface StrategicProjectsState {
    projects: StrategicProject[];
    tasks: Record<string, ProjectTask[]>; // projectId -> tasks
    selectedProjectId: string | null;
    filter: ProjectFilter;
    taskFilter: TaskFilter;
    isLoading: boolean;
    searchQuery: string;

    // Subscriptions
    unsubscribeProjects: () => void;
    taskUnsubscribers: Record<string, () => void>;

    // Actions
    init: () => void;
    cleanup: () => void;
    setFilter: (filter: ProjectFilter) => void;
    setTaskFilter: (taskFilter: Partial<TaskFilter>) => void;
    setSearchQuery: (query: string) => void;
    selectProject: (id: string | null) => void;
    subscribeToProjectTasks: (projectId: string) => void;
    unsubscribeFromProjectTasks: (projectId: string) => void;

    // CRUD
    createProject: (data: { title: string; description?: string; isShared: boolean; memberIds?: string[] }) => Promise<void>;
    updateProject: (projectId: string, data: Partial<Pick<StrategicProject, 'title' | 'description' | 'status' | 'memberIds'>>) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    createTask: (projectId: string, data: { title: string; priority?: TaskPriority; assigneeId?: string; parentTaskId?: string; dueDate?: Date; tags?: string[] }) => Promise<void>;
    updateTask: (projectId: string, taskId: string, data: Partial<Pick<ProjectTask, 'title' | 'completed' | 'priority' | 'assigneeId' | 'assigneeIds' | 'parentTaskId' | 'dueDate' | 'tags'>>) => Promise<void>;
    deleteTask: (projectId: string, taskId: string) => Promise<void>;
    toggleTaskCompletion: (projectId: string, taskId: string) => Promise<void>;
    addComment: (projectId: string, taskId: string, content: string, authorId: string, authorName: string) => Promise<void>;

    // Computed
    getFilteredProjects: () => StrategicProject[];
    getSelectedProject: () => StrategicProject | null;
    getSelectedProjectTasks: () => ProjectTask[];
    getFilteredTasks: () => ProjectTask[];
    getProjectProgress: (projectId: string) => { completed: number; total: number; percentage: number };
}

// Guard against rapid clicks causing race conditions
const _togglingTasks = new Set<string>();

export const useStrategicProjectsStore = create<StrategicProjectsState>((set, get) => ({
    projects: [],
    tasks: {},
    selectedProjectId: null,
    filter: 'all',
    taskFilter: { showCompleted: true },
    isLoading: false,
    searchQuery: '',
    unsubscribeProjects: () => { },
    taskUnsubscribers: {},

    init: () => {
        const { unsubscribeProjects } = get();
        unsubscribeProjects();

        set({ isLoading: true });

        const unsub = StrategicProjectsService.subscribeToProjects((projects) => {
            set({ projects, isLoading: false });
        });

        set({ unsubscribeProjects: unsub });
    },

    cleanup: () => {
        const { unsubscribeProjects, taskUnsubscribers } = get();
        unsubscribeProjects();

        // Cleanup all task subscriptions
        Object.values(taskUnsubscribers).forEach(unsub => unsub());

        set({
            projects: [],
            tasks: {},
            selectedProjectId: null,
            unsubscribeProjects: () => { },
            taskUnsubscribers: {},
        });
    },

    setFilter: (filter) => set({ filter }),

    setTaskFilter: (taskFilter) => set((state) => ({
        taskFilter: { ...state.taskFilter, ...taskFilter }
    })),

    setSearchQuery: (query) => set({ searchQuery: query }),

    selectProject: (id) => set({ selectedProjectId: id }),

    subscribeToProjectTasks: (projectId) => {
        const { taskUnsubscribers } = get();

        // Already subscribed
        if (taskUnsubscribers[projectId]) return;

        const unsub = StrategicProjectsService.subscribeToTasks(projectId, (tasks) => {
            // Tasks updated silently
            set((state) => ({
                tasks: { ...state.tasks, [projectId]: tasks }
            }));
        });

        set({
            taskUnsubscribers: { ...taskUnsubscribers, [projectId]: unsub }
        });
    },

    unsubscribeFromProjectTasks: (projectId) => {
        const { taskUnsubscribers } = get();
        const unsub = taskUnsubscribers[projectId];
        if (unsub) {
            unsub();
            const newUnsubscribers = { ...taskUnsubscribers };
            delete newUnsubscribers[projectId];
            set({ taskUnsubscribers: newUnsubscribers });
        }
    },

    createProject: async (data) => {
        try {
            const projectId = await StrategicProjectsService.createProject(data);
            set({ selectedProjectId: projectId });
            toast.success('Projeto criado!');
        } catch (error) {
            console.error('Error creating project:', error);
            toast.error('Erro ao criar projeto');
        }
    },

    updateProject: async (projectId, data) => {
        try {
            await StrategicProjectsService.updateProject(projectId, data);
        } catch (error) {
            console.error('Error updating project:', error);
            toast.error('Erro ao atualizar projeto');
        }
    },

    deleteProject: async (projectId) => {
        try {
            await StrategicProjectsService.deleteProject(projectId);

            if (get().selectedProjectId === projectId) {
                set({ selectedProjectId: null });
            }

            toast.success('Projeto excluído');
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Erro ao excluir projeto');
        }
    },

    createTask: async (projectId, data) => {
        try {
            const currentTasks = get().tasks[projectId] || [];
            await StrategicProjectsService.createTask(projectId, {
                ...data,
                order: currentTasks.length,
            });
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Erro ao criar tarefa');
        }
    },

    updateTask: async (projectId, taskId, data) => {
        try {
            await StrategicProjectsService.updateTask(projectId, taskId, data);
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Erro ao atualizar tarefa');
        }
    },

    deleteTask: async (projectId, taskId) => {
        try {
            await StrategicProjectsService.deleteTask(projectId, taskId);
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Erro ao excluir tarefa');
        }
    },

    toggleTaskCompletion: async (projectId, taskId) => {
        // Prevent race conditions from rapid clicks
        if (_togglingTasks.has(taskId)) return;
        _togglingTasks.add(taskId);

        try {
            const tasks = get().tasks[projectId] || [];
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const newCompleted = !task.completed;

            // Toggle the task itself
            await get().updateTask(projectId, taskId, { completed: newCompleted });

            if (!task.parentTaskId) {
                // ── Parent task toggled → cascade to all subtasks ──
                const subTasks = tasks.filter(t => t.parentTaskId === taskId);
                await Promise.all(
                    subTasks
                        .filter(st => st.completed !== newCompleted)
                        .map(st => get().updateTask(projectId, st.id, { completed: newCompleted }))
                );
            } else {
                // ── Subtask toggled → sync parent automatically ──
                const parentId = task.parentTaskId;
                const siblings = tasks.filter(t => t.parentTaskId === parentId && t.id !== taskId);
                const allSiblingsCompleted = siblings.every(s => s.completed);
                const parentTask = tasks.find(t => t.id === parentId);

                if (parentTask) {
                    if (newCompleted && allSiblingsCompleted && !parentTask.completed) {
                        // All subtasks now completed → auto-check parent
                        await get().updateTask(projectId, parentId, { completed: true });
                    } else if (!newCompleted && parentTask.completed) {
                        // A subtask was unchecked → uncheck parent
                        await get().updateTask(projectId, parentId, { completed: false });
                    }
                }
            }
        } finally {
            _togglingTasks.delete(taskId);
        }
    },

    addComment: async (projectId, taskId, content, authorId, authorName) => {
        try {
            await StrategicProjectsService.addComment(projectId, taskId, { content, authorId, authorName });
        } catch (error) {
            toast.error('Erro ao adicionar comentário');
            console.error('Error adding comment:', error);
        }
    },

    getFilteredProjects: () => {
        const { projects, filter, searchQuery } = get();
        const userId = useAuthStore.getState().user?.id || '';

        let filtered = projects;

        // Filter by type
        if (filter === 'personal') {
            filtered = filtered.filter(p => !p.isShared && p.ownerId === userId);
        } else if (filter === 'shared') {
            filtered = filtered.filter(p => p.isShared);
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
        }

        return filtered;
    },

    getSelectedProject: () => {
        const { projects, selectedProjectId } = get();
        if (!selectedProjectId) return null;
        return projects.find(p => p.id === selectedProjectId) || null;
    },

    getSelectedProjectTasks: () => {
        const { tasks, selectedProjectId } = get();
        if (!selectedProjectId) return [];
        return tasks[selectedProjectId] || [];
    },

    getFilteredTasks: () => {
        const { tasks, selectedProjectId, taskFilter } = get();
        if (!selectedProjectId) return [];

        let filtered = tasks[selectedProjectId] || [];

        // Filter by completed
        if (!taskFilter.showCompleted) {
            filtered = filtered.filter(t => !t.completed);
        }

        // Filter by assignee
        if (taskFilter.assigneeId) {
            filtered = filtered.filter(t =>
                t.assigneeIds?.includes(taskFilter.assigneeId!) ||
                t.assigneeId === taskFilter.assigneeId
            );
        }

        // Filter by priority
        if (taskFilter.priority) {
            filtered = filtered.filter(t => t.priority === taskFilter.priority);
        }

        // Filter by tag
        if (taskFilter.tag) {
            filtered = filtered.filter(t =>
                t.tags.some(tag => tag.toLowerCase().includes(taskFilter.tag!.toLowerCase()))
            );
        }

        return filtered;
    },

    getProjectProgress: (projectId) => {
        const tasks = get().tasks[projectId] || [];
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    },
}));
