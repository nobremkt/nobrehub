/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS STORE
 * Store para gerenciamento da Lista de Contatos
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import type { Lead, LossReason } from '@/types';
import { LeadService } from '../services/LeadService';

export interface ContactFilters {
    search: string;
    campos: ('contato' | 'empresa')[];
    tags: string[];
    motivoPerda: string[];
    // Filtros Avançados
    dataInicio?: Date;
    dataFim?: Date;
    comNegocioOrigem?: string;
    comNegocioEtapa?: string;
    comNegocioStatus?: 'ganho' | 'perdido' | 'aberto';
    comDono?: string;
    semDono?: boolean;
    comTelefone?: boolean;
    semTelefone?: boolean;
}

export interface ContactsState {
    // Data
    contacts: Lead[];
    selectedIds: Set<string>;
    totalContacts: number;
    isLoading: boolean;
    error: string | null;

    // Filters
    filters: ContactFilters;

    // Available filter options
    availableTags: string[];
    availableLossReasons: LossReason[];

    // Pagination
    page: number;
    pageSize: number;

    // Actions
    fetchContacts: () => Promise<void>;
    setContacts: (contacts: Lead[]) => void;
    setLoading: (loading: boolean) => void;
    toggleSelect: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setFilter: <K extends keyof ContactFilters>(key: K, value: ContactFilters[K]) => void;
    clearFilters: () => void;
    setPage: (page: number) => void;
    setAvailableTags: (tags: string[]) => void;
    setAvailableLossReasons: (reasons: LossReason[]) => void;
}

const defaultFilters: ContactFilters = {
    search: '',
    campos: [],
    tags: [],
    motivoPerda: [],
};

export const useContactsStore = create<ContactsState>((set) => ({
    // Initial state
    contacts: [],
    selectedIds: new Set(),
    totalContacts: 0,
    isLoading: false,
    error: null,
    filters: defaultFilters,
    availableTags: [],
    availableLossReasons: [],
    page: 1,
    pageSize: 50,

    // Actions
    fetchContacts: async () => {
        set({ isLoading: true, error: null });
        try {
            const contacts = await LeadService.getLeads();

            // Extract tags for filter
            const allTags = new Set<string>();
            contacts.forEach(c => c.tags?.forEach(t => allTags.add(t)));

            set({
                contacts,
                totalContacts: contacts.length,
                availableTags: Array.from(allTags),
                isLoading: false
            });
        } catch (error: any) {
            console.error('Failed to fetch contacts:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    setContacts: (contacts) => set({
        contacts,
        totalContacts: contacts.length
    }),

    setLoading: (isLoading) => set({ isLoading }),

    toggleSelect: (id) => set((state) => {
        const newSet = new Set(state.selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return { selectedIds: newSet };
    }),

    selectAll: () => set((state) => ({
        selectedIds: new Set(state.contacts.map(c => c.id))
    })),

    clearSelection: () => set({ selectedIds: new Set() }),

    setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value },
        page: 1, // Reset to first page on filter change
    })),

    clearFilters: () => set({
        filters: defaultFilters,
        page: 1,
    }),

    setPage: (page) => set({ page }),

    setAvailableTags: (availableTags) => set({ availableTags }),

    setAvailableLossReasons: (availableLossReasons) => set({ availableLossReasons }),
}));

// Selector para contatos filtrados
export const useFilteredContacts = () => {
    const { contacts, filters } = useContactsStore();

    return contacts.filter((contact) => {
        // Busca por texto
        if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchName = contact.name.toLowerCase().includes(search);
            const matchEmail = contact.email?.toLowerCase().includes(search);
            const matchPhone = contact.phone.includes(search);
            const matchCompany = contact.company?.toLowerCase().includes(search);

            if (!matchName && !matchEmail && !matchPhone && !matchCompany) {
                return false;
            }
        }

        // Filtro por tags
        if (filters.tags.length > 0) {
            const hasTag = filters.tags.some(tag => contact.tags.includes(tag));
            if (!hasTag) return false;
        }

        // Filtro por motivo de perda
        if (filters.motivoPerda.length > 0) {
            if (!contact.lostReason || !filters.motivoPerda.includes(contact.lostReason)) {
                return false;
            }
        }

        // Filtro com/sem telefone
        if (filters.comTelefone && !contact.phone) return false;
        if (filters.semTelefone && contact.phone) return false;

        return true;
    });
};
