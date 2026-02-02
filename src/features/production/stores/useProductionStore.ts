
import { create } from 'zustand';
import { Project } from '@/types/project.types';
import { ProductionService } from '../services/ProductionService';
import { toast } from 'react-toastify';

interface ProductionState {
    projects: Project[];
    selectedProducerId: string | null;
    isLoading: boolean;
    error: string | null;
    highlightedProjectId: string | null;

    setHighlightedProjectId: (id: string | null) => void;

    setSelectedProducerId: (id: string | null) => void;

    fetchProjects: (producerId: string) => Promise<void>;
    subscribeToProjects: (producerId: string) => void;
    unsubscribeFromProjects: () => void;
    addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    unsubscribe: (() => void) | null;
}

export const useProductionStore = create<ProductionState>((set, get) => ({
    projects: [],
    selectedProducerId: null,
    isLoading: false,
    error: null,
    highlightedProjectId: null,

    setHighlightedProjectId: (id) => set({ highlightedProjectId: id }),

    unsubscribe: null as (() => void) | null,

    setSelectedProducerId: (id) => {
        const { unsubscribeFromProjects, subscribeToProjects } = get();

        // Limpa subscrição anterior
        unsubscribeFromProjects();

        set({ selectedProducerId: id, projects: [] });

        // Nova subscrição
        if (id) {
            subscribeToProjects(id);
        }
    },

    unsubscribeFromProjects: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
            unsubscribe();
            set({ unsubscribe: null });
        }
    },

    subscribeToProjects: (producerId) => {
        set({ isLoading: true, error: null });
        const unsubscribe = ProductionService.subscribeProjectsByProducer(
            producerId,
            (projects: Project[]) => {
                set({ projects, isLoading: false });
            }
        );
        set((state) => ({ ...state, unsubscribe }));
    },

    fetchProjects: async (producerId) => {
        // Legacy fetch - mantido por compatibilidade, mas preferimos subscribe
        set({ isLoading: true, error: null });
        try {
            const projects = await ProductionService.getProjectsByProducer(producerId);
            set({ projects });
        } catch (error) {
            console.error('Error fetching production projects:', error);
            set({ error: 'Erro ao carregar projetos da produção.' });
            toast.error('Erro ao carregar projetos.');
        } finally {
            set({ isLoading: false });
        }
    },

    addProject: async (newProject) => {
        const { selectedProducerId } = get();
        if (!selectedProducerId) return;

        set({ isLoading: true });
        try {
            await ProductionService.createProject(newProject);
            await get().fetchProjects(selectedProducerId);
            toast.success('Projeto criado com sucesso!');
        } catch (error) {
            console.error('Error adding project:', error);
            toast.error('Erro ao criar projeto.');
        } finally {
            set({ isLoading: false });
        }
    },

    updateProject: async (id, updates) => {
        set({ isLoading: true });
        try {
            await ProductionService.updateProject(id, updates);
            toast.success('Projeto atualizado!');
        } catch (error) {
            console.error('Error updating project:', error);
            toast.error('Erro ao atualizar projeto.');
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProject: async (id) => {
        set({ isLoading: true });
        try {
            await ProductionService.deleteProject(id);

            set(state => ({
                projects: state.projects.filter(p => p.id !== id)
            }));

            toast.success('Projeto removido.');
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Erro ao remover projeto.');
        } finally {
            set({ isLoading: false });
        }
    }
}));
