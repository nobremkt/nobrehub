import { create } from 'zustand';
import { LossReason } from '../types';
import { LossReasonService } from '../services/LossReasonService';

interface LossReasonState {
    lossReasons: LossReason[];
    isLoading: boolean;
    error: string | null;

    fetchLossReasons: () => Promise<void>;
    addLossReason: (reason: Omit<LossReason, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateLossReason: (id: string, updates: Partial<LossReason>) => Promise<void>;
    deleteLossReason: (id: string) => Promise<void>;
}

export const useLossReasonStore = create<LossReasonState>((set, get) => ({
    lossReasons: [],
    isLoading: false,
    error: null,

    fetchLossReasons: async () => {
        set({ isLoading: true, error: null });
        try {
            const lossReasons = await LossReasonService.getLossReasons();
            set({ lossReasons });
        } catch (error) {
            console.error('Error fetching loss reasons:', error);
            set({ error: 'Erro ao carregar motivos de perda.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addLossReason: async (newReason) => {
        set({ isLoading: true, error: null });
        try {
            await LossReasonService.createLossReason(newReason);
            await get().fetchLossReasons(); // Refresh list
        } catch (error) {
            console.error('Error adding loss reason:', error);
            set({ error: 'Erro ao criar motivo de perda.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateLossReason: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await LossReasonService.updateLossReason(id, updates);
            // Otimista: atualiza localmente para evitar refetch
            set(state => ({
                lossReasons: state.lossReasons.map(r =>
                    r.id === id ? { ...r, ...updates } : r
                )
            }));
        } catch (error) {
            console.error('Error updating loss reason:', error);
            set({ error: 'Erro ao atualizar motivo de perda.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteLossReason: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await LossReasonService.deleteLossReason(id);
            set(state => ({
                lossReasons: state.lossReasons.filter(r => r.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting loss reason:', error);
            set({ error: 'Erro ao excluir motivo de perda.' });
        } finally {
            set({ isLoading: false });
        }
    }
}));
