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
    // Filtros de CRM (FilterBar estendida)
    pipelines: ('high-ticket' | 'low-ticket')[];
    stages: string[];
    dealStatus: ('open' | 'won' | 'lost')[];
    responsibleIds: string[];
    postSalesIds: string[];
    temperatures: ('cold' | 'warm' | 'hot')[];
    // Filtros de data
    dataInicio?: Date;
    dataFim?: Date;
    dataCriacaoInicio?: Date;
    dataCriacaoFim?: Date;
    dataAtualizacaoInicio?: Date;
    dataAtualizacaoFim?: Date;
    // Filtros de valor
    valorMin?: number;
    valorMax?: number;
    // Filtros de negócio
    comNegocioOrigem?: string;
    comNegocioEtapa?: string;
    comNegocioStatus?: 'won' | 'lost' | 'open';
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
    isLoadingMore: boolean;
    isSearching: boolean;
    hasMore: boolean;
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
    loadMore: () => Promise<void>;
    searchContacts: (term: string) => Promise<void>;
    syncContacts: () => Promise<number>;
    setContacts: (contacts: Lead[]) => void;
    setLoading: (loading: boolean) => void;
    toggleSelect: (id: string) => void;
    selectAll: (ids?: string[]) => void;
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
    pipelines: [],
    stages: [],
    dealStatus: [],
    responsibleIds: [],
    postSalesIds: [],
    temperatures: [],
};

export const useContactsStore = create<ContactsState>((set, get) => ({
    // Initial state
    contacts: [],
    selectedIds: new Set(),
    totalContacts: 0,
    isLoading: false,
    isLoadingMore: false,
    isSearching: false,
    hasMore: true,
    error: null,
    filters: defaultFilters,
    availableTags: [],
    availableLossReasons: [],
    page: 0,
    pageSize: 50,

    // Actions
    fetchContacts: async () => {
        set({ isLoading: true, error: null, page: 0 });
        try {
            const { pageSize } = get();
            const { leads, total } = await LeadService.getLeadsPaginated(0, pageSize);

            // Extract tags for filter
            const allTags = new Set<string>();
            leads.forEach(c => c.tags?.forEach(t => allTags.add(t)));

            set({
                contacts: leads,
                totalContacts: total,
                hasMore: leads.length < total,
                availableTags: Array.from(allTags),
                isLoading: false,
                page: 0,
            });
        } catch (error: unknown) {
            console.error('Failed to fetch contacts:', error);
            set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
        }
    },

    loadMore: async () => {
        const { isLoadingMore, hasMore, page, pageSize, contacts } = get();
        if (isLoadingMore || !hasMore) return;

        set({ isLoadingMore: true });
        try {
            const nextPage = page + 1;
            const { leads, total } = await LeadService.getLeadsPaginated(nextPage, pageSize);

            // Merge tags
            const allTags = new Set<string>(get().availableTags);
            leads.forEach(c => c.tags?.forEach(t => allTags.add(t)));

            const merged = [...contacts, ...leads];
            set({
                contacts: merged,
                totalContacts: total,
                hasMore: merged.length < total,
                page: nextPage,
                availableTags: Array.from(allTags),
                isLoadingMore: false,
            });
        } catch (error: unknown) {
            console.error('Failed to load more contacts:', error);
            set({ isLoadingMore: false });
        }
    },

    searchContacts: async (term: string) => {
        if (!term.trim()) {
            // Reset to paginated view
            await get().fetchContacts();
            return;
        }

        set({ isSearching: true, error: null });
        try {
            const leads = await LeadService.searchLeads(term);
            set({
                contacts: leads,
                totalContacts: leads.length,
                hasMore: false, // Search results are not paginated
                isSearching: false,
            });
        } catch (error: unknown) {
            console.error('Failed to search contacts:', error);
            set({ error: error instanceof Error ? error.message : String(error), isSearching: false });
        }
    },

    syncContacts: async () => {
        set({ isLoading: true, error: null });
        try {
            const count = await LeadService.syncFromInbox();
            // Refresh list if new leads added
            if (count > 0) {
                await get().fetchContacts();
            }
            set({ isLoading: false });
            return count;
        } catch (error: unknown) {
            console.error('Failed to sync contacts:', error);
            set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
            return 0;
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

    selectAll: (ids) => set((state) => ({
        selectedIds: new Set(ids ?? state.contacts.map(c => c.id))
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

        // Filtro por origem (source)
        if (filters.comNegocioOrigem && contact.source !== filters.comNegocioOrigem) return false;

        // Filtro por etapa (stage/status da pipeline)
        if (filters.comNegocioEtapa && contact.status !== filters.comNegocioEtapa) return false;

        // Filtro por status do negócio (won/lost/open)
        if (filters.comNegocioStatus) {
            const dealStatus = contact.dealStatus || 'open';
            if (dealStatus !== filters.comNegocioStatus) return false;
        }

        // Filtro por dono
        if (filters.comDono && contact.responsibleId !== filters.comDono) return false;
        if (filters.semDono && contact.responsibleId) return false;

        // Filtro por data
        if (filters.dataInicio && contact.createdAt < filters.dataInicio) return false;
        if (filters.dataFim && contact.createdAt > filters.dataFim) return false;

        return true;
    });
};
