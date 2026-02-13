import { create } from 'zustand';
import { Sector } from '../types';
import { SectorService } from '../services/SectorService';

interface SectorState {
    sectors: Sector[];
    isLoading: boolean;
    error: string | null;

    fetchSectors: () => Promise<void>;
    addSector: (sector: Omit<Sector, 'id' | 'createdAt' | 'updatedAt' | 'displayOrder'>) => Promise<void>;
    updateSector: (id: string, updates: Partial<Sector>) => Promise<void>;
    deleteSector: (id: string) => Promise<void>;
    reorderSectors: (reorderedSectors: Sector[]) => void;
}

export const useSectorStore = create<SectorState>((set, get) => ({
    sectors: [],
    isLoading: false,
    error: null,

    fetchSectors: async () => {
        set({ isLoading: true, error: null });
        try {
            const sectors = await SectorService.getSectors();
            set({ sectors });
        } catch (error) {
            console.error('Error fetching sectors:', error);
            set({ error: 'Erro ao carregar setores.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addSector: async (newSector) => {
        set({ isLoading: true, error: null });
        try {
            await SectorService.createSector(newSector);
            await get().fetchSectors(); // Refresh list
        } catch (error) {
            console.error('Error adding sector:', error);
            set({ error: 'Erro ao criar setor.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateSector: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await SectorService.updateSector(id, updates);
            // Otimista: atualiza localmente
            set(state => ({
                sectors: state.sectors.map(s =>
                    s.id === id ? { ...s, ...updates } : s
                )
            }));
        } catch (error) {
            console.error('Error updating sector:', error);
            set({ error: 'Erro ao atualizar setor.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteSector: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await SectorService.deleteSector(id);
            set(state => ({
                sectors: state.sectors.filter(s => s.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting sector:', error);
            set({ error: 'Erro ao excluir setor.' });
        } finally {
            set({ isLoading: false });
        }
    },

    reorderSectors: (reorderedSectors: Sector[]) => {
        // Optimistic update
        set({ sectors: reorderedSectors });

        // Persist in background
        const updates = reorderedSectors.map(s => ({
            id: s.id,
            displayOrder: s.displayOrder,
        }));

        SectorService.reorderSectors(updates).catch((error) => {
            console.error('Error reordering sectors:', error);
            // Rollback: re-fetch from DB
            get().fetchSectors();
        });
    }
}));

