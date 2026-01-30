import { create } from 'zustand';
import { Collaborator } from '../types';
import { CollaboratorService } from '../services/CollaboratorService';

interface CollaboratorState {
    collaborators: Collaborator[];
    isLoading: boolean;
    error: string | null;

    fetchCollaborators: () => Promise<void>;
    addCollaborator: (collaborator: Omit<Collaborator, 'id' | 'createdAt' | 'updatedAt'> & { password?: string }) => Promise<void>;
    updateCollaborator: (id: string, updates: Partial<Collaborator> & { password?: string }) => Promise<void>;
    deleteCollaborator: (id: string) => Promise<void>;
}

export const useCollaboratorStore = create<CollaboratorState>((set, get) => ({
    collaborators: [],
    isLoading: false,
    error: null,

    fetchCollaborators: async () => {
        set({ isLoading: true, error: null });
        try {
            const collaborators = await CollaboratorService.getCollaborators();
            set({ collaborators });
        } catch (error) {
            console.error('Error fetching collaborators:', error);
            set({ error: 'Erro ao carregar colaboradores.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addCollaborator: async (newCollaborator) => {
        set({ isLoading: true, error: null });
        try {
            await CollaboratorService.createCollaborator(newCollaborator);
            await get().fetchCollaborators();
        } catch (error) {
            console.error('Error adding collaborator:', error);
            set({ error: 'Erro ao adicionar colaborador.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateCollaborator: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await CollaboratorService.updateCollaborator(id, updates);
            set(state => ({
                collaborators: state.collaborators.map(c =>
                    c.id === id ? { ...c, ...updates } : c
                )
            }));
        } catch (error) {
            console.error('Error updating collaborator:', error);
            set({ error: 'Erro ao atualizar colaborador.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteCollaborator: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await CollaboratorService.deleteCollaborator(id);
            set(state => ({
                collaborators: state.collaborators.filter(c => c.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting collaborator:', error);
            set({ error: 'Erro ao excluir colaborador.' });
        } finally {
            set({ isLoading: false });
        }
    }
}));
