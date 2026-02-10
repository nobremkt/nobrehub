/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS STORE
 * Store para gerenciamento da Lista de Contatos
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import type { Lead, LossReason } from '@/types';
import { LeadService } from '../services/LeadService';

type PipelineFilter = Lead['pipeline'];
type DealStatusFilter = NonNullable<Lead['dealStatus']>;
type TemperatureFilter = NonNullable<Lead['temperature']>;

export interface ContactFilters {
    search: string;
    pipelines: PipelineFilter[];
    stages: string[];
    dealStatus: DealStatusFilter[];
    responsibleIds: string[];
    postSalesIds: string[];
    temperatures: TemperatureFilter[];
    tags: string[];
    motivoPerda: string[];
    // Filtros avançados
    dataCriacaoInicio?: Date;
    dataCriacaoFim?: Date;
    dataAtualizacaoInicio?: Date;
    dataAtualizacaoFim?: Date;
    comDono?: boolean;
    semDono?: boolean;
    comTelefone?: boolean;
    semTelefone?: boolean;
    valorMin?: number;
    valorMax?: number;
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
    pipelines: [],
    stages: [],
    dealStatus: [],
    responsibleIds: [],
    postSalesIds: [],
    temperatures: [],
    tags: [],
    motivoPerda: [],
};

export const useContactsStore = create<ContactsState>((set, get) => ({
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
        } catch (error: any) {
            console.error('Failed to sync contacts:', error);
            set({ error: error.message, isLoading: false });
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
        selectedIds: new Set(),
    })),

    clearFilters: () => set({
        filters: defaultFilters,
        page: 1,
        selectedIds: new Set(),
    }),

    setPage: (page) => set({ page }),

    setAvailableTags: (availableTags) => set({ availableTags }),

    setAvailableLossReasons: (availableLossReasons) => set({ availableLossReasons }),
}));

// Selector para contatos filtrados
export const useFilteredContacts = () => {
    const { contacts, filters } = useContactsStore();

    return contacts.filter((contact) => {
        const normalizedDealStatus: DealStatusFilter = contact.dealStatus ?? 'open';
        const normalizedValue = contact.dealValue ?? contact.estimatedValue ?? 0;
        const hasPhone = Boolean(contact.phone && String(contact.phone).trim().length > 0);
        const hasOwner = Boolean(contact.responsibleId && String(contact.responsibleId).trim().length > 0);

        // Busca por texto
        if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchName = contact.name.toLowerCase().includes(search);
            const matchEmail = contact.email?.toLowerCase().includes(search) ?? false;
            const matchPhone = (contact.phone || '').toLowerCase().includes(search);
            const matchCompany = contact.company?.toLowerCase().includes(search) ?? false;
            const matchTags = (contact.tags || []).some(tag => tag.toLowerCase().includes(search));
            const matchStatus = contact.status?.toLowerCase().includes(search) ?? false;

            if (!matchName && !matchEmail && !matchPhone && !matchCompany && !matchTags && !matchStatus) {
                return false;
            }
        }

        // Filtro por pipeline
        if (filters.pipelines.length > 0 && !filters.pipelines.includes(contact.pipeline)) {
            return false;
        }

        // Filtro por etapa
        if (filters.stages.length > 0 && !filters.stages.includes(contact.status)) {
            return false;
        }

        // Filtro por status do negócio
        if (filters.dealStatus.length > 0 && !filters.dealStatus.includes(normalizedDealStatus)) {
            return false;
        }

        // Filtro por responsável de vendas
        if (filters.responsibleIds.length > 0 && !filters.responsibleIds.includes(contact.responsibleId)) {
            return false;
        }

        // Filtro por responsável de pós-venda
        if (filters.postSalesIds.length > 0 && !filters.postSalesIds.includes(contact.postSalesId || '')) {
            return false;
        }

        // Filtro por temperatura
        if (filters.temperatures.length > 0) {
            if (!contact.temperature || !filters.temperatures.includes(contact.temperature)) {
                return false;
            }
        }

        // Filtro por tags
        if (filters.tags.length > 0) {
            const hasTag = filters.tags.some(tag => (contact.tags || []).includes(tag));
            if (!hasTag) return false;
        }

        // Filtro por motivo de perda
        if (filters.motivoPerda.length > 0) {
            if (!contact.lostReason || !filters.motivoPerda.includes(contact.lostReason)) {
                return false;
            }
        }

        // Filtro por período de criação
        if (filters.dataCriacaoInicio && contact.createdAt < filters.dataCriacaoInicio) return false;
        if (filters.dataCriacaoFim && contact.createdAt > filters.dataCriacaoFim) return false;

        // Filtro por período de atualização
        if (filters.dataAtualizacaoInicio && contact.updatedAt < filters.dataAtualizacaoInicio) return false;
        if (filters.dataAtualizacaoFim && contact.updatedAt > filters.dataAtualizacaoFim) return false;

        // Filtros de dono
        if (filters.comDono && !hasOwner) return false;
        if (filters.semDono && hasOwner) return false;

        // Filtro com/sem telefone
        if (filters.comTelefone && !hasPhone) return false;
        if (filters.semTelefone && hasPhone) return false;

        // Filtro por faixa de valor
        if (typeof filters.valorMin === 'number' && normalizedValue < filters.valorMin) return false;
        if (typeof filters.valorMax === 'number' && normalizedValue > filters.valorMax) return false;

        return true;
    });
};
