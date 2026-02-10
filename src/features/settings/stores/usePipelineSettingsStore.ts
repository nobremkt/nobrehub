import { create } from 'zustand';
import { PipelineStage } from '../types';
import { PipelineService } from '../services/PipelineService';

interface PipelineSettingsState {
    stages: PipelineStage[];
    isLoading: boolean;
    error: string | null;

    fetchStages: () => Promise<void>;
    addStage: (stage: Omit<PipelineStage, 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateStage: (id: string, updates: Partial<PipelineStage>) => Promise<void>;
    deleteStage: (id: string) => Promise<void>;
    reorderStages: (reorderedStages: PipelineStage[]) => Promise<void>;
    seedDefaults: () => Promise<void>;
}

export const usePipelineSettingsStore = create<PipelineSettingsState>((set, get) => ({
    stages: [],
    isLoading: false,
    error: null,

    fetchStages: async () => {
        set({ isLoading: true, error: null });
        try {
            const stages = await PipelineService.getStages();
            set({ stages });
        } catch (error) {
            console.error('Error fetching pipeline stages:', error);
            set({ error: 'Erro ao carregar etapas do pipeline.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addStage: async (newStage) => {
        set({ isLoading: true, error: null });
        try {
            await PipelineService.createStage(newStage);
            await get().fetchStages();
        } catch (error) {
            console.error('Error adding pipeline stage:', error);
            set({ error: 'Erro ao criar etapa.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateStage: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await PipelineService.updateStage(id, updates);
            set(state => ({
                stages: state.stages.map(s =>
                    s.id === id ? { ...s, ...updates } : s
                )
            }));
        } catch (error) {
            console.error('Error updating pipeline stage:', error);
            set({ error: 'Erro ao atualizar etapa.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteStage: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await PipelineService.deleteStage(id);
            set(state => ({
                stages: state.stages.filter(s => s.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting pipeline stage:', error);
            set({ error: 'Erro ao excluir etapa.' });
        } finally {
            set({ isLoading: false });
        }
    },

    reorderStages: async (reorderedStages) => {
        set({ stages: reorderedStages });

        try {
            await Promise.all(
                reorderedStages.map((stage, index) =>
                    PipelineService.updateStage(stage.id, { order: index })
                )
            );
        } catch (error) {
            console.error('Error reordering pipeline stages:', error);
            set({ error: 'Erro ao reordenar etapas.' });
            await get().fetchStages();
        }
    },

    seedDefaults: async () => {
        set({ isLoading: true, error: null });
        try {
            const stages = await PipelineService.seedDefaultStages();
            set({ stages });
        } catch (error) {
            console.error('Error seeding default stages:', error);
            set({ error: 'Erro ao criar etapas padrão.' });
        } finally {
            set({ isLoading: false });
        }
    }
}));
