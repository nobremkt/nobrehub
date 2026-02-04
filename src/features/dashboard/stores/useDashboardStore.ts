/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DASHBOARD STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Zustand store for dashboard state management with unified metrics
 */

import { create } from 'zustand';
import {
    DashboardAnalyticsService,
    UnifiedDashboardMetrics,
    DateFilter,
    ProductionMetrics,
    SalesMetrics,
    GeneralMetrics,
    AdminMetrics
} from '../services/DashboardAnalyticsService';
import { toast } from 'react-toastify';

interface DashboardState {
    // Unified metrics (contains all sections)
    unifiedMetrics: UnifiedDashboardMetrics | null;

    // Legacy alias for backward compatibility
    metrics: ProductionMetrics | null;

    isLoading: boolean;
    error: string | null;
    dateFilter: DateFilter;

    // Actions
    fetchMetrics: () => Promise<void>;
    setDateFilter: (filter: DateFilter) => void;

    // Selectors for each section
    getGeneralMetrics: () => GeneralMetrics | null;
    getSalesMetrics: () => SalesMetrics | null;
    getProductionMetrics: () => ProductionMetrics | null;
    getAdminMetrics: () => AdminMetrics | null;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    unifiedMetrics: null,
    metrics: null,
    isLoading: false,
    error: null,
    dateFilter: 'month',

    fetchMetrics: async () => {
        set({ isLoading: true, error: null });
        try {
            const { dateFilter } = get();
            const unifiedMetrics = await DashboardAnalyticsService.getAllMetrics(dateFilter);
            set({
                unifiedMetrics,
                // Keep legacy metrics for backward compatibility
                metrics: unifiedMetrics.production
            });
        } catch (error) {
            console.error('Error fetching dashboard metrics:', error);
            set({ error: 'Erro ao carregar métricas do dashboard.' });
            toast.error('Erro ao carregar dados do dashboard.');
        } finally {
            set({ isLoading: false });
        }
    },

    setDateFilter: (filter: DateFilter) => {
        set({ dateFilter: filter });
        get().fetchMetrics();
    },

    // Selectors
    getGeneralMetrics: () => get().unifiedMetrics?.general ?? null,
    getSalesMetrics: () => get().unifiedMetrics?.sales ?? null,
    getProductionMetrics: () => get().unifiedMetrics?.production ?? null,
    getAdminMetrics: () => get().unifiedMetrics?.admin ?? null,
}));

