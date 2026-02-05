/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Store Zustand para gerenciar estado de pós-vendas
 */

import { create } from 'zustand';
import { Lead } from '@/types/lead.types';

interface PostSalesState {
    // Atendente selecionado
    selectedPostSalesId: string | null;
    setSelectedPostSalesId: (id: string | null) => void;

    // Clientes por atendente (cache local)
    clientsByAttendant: Record<string, Lead[]>;
    setClientsForAttendant: (attendantId: string, clients: Lead[]) => void;

    // Loading states
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const usePostSalesStore = create<PostSalesState>((set) => ({
    // Atendente selecionado
    selectedPostSalesId: null,
    setSelectedPostSalesId: (id) => set({ selectedPostSalesId: id }),

    // Clientes por atendente
    clientsByAttendant: {},
    setClientsForAttendant: (attendantId, clients) =>
        set((state) => ({
            clientsByAttendant: {
                ...state.clientsByAttendant,
                [attendantId]: clients
            }
        })),

    // Loading
    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),
}));
