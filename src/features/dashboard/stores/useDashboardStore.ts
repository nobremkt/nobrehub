/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DASHBOARD STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Zustand store for dashboard state management with unified metrics.
 * Includes TTL cache to avoid redundant Firestore reads.
 */

import { create } from 'zustand';
import {
    DashboardAnalyticsService,
    UnifiedDashboardMetrics,
    DateFilter,
    ProductionMetrics,
    SalesMetrics,
    GeneralMetrics,
    AdminMetrics,
    FinancialMetrics,
    PostSalesMetrics
} from '../services/DashboardAnalyticsService';
import { toast } from 'react-toastify';

// Cache TTL: 5 minutes (dashboard shows aggregated stats, not realtime operational data)
const CACHE_TTL_MS = 5 * 60 * 1000;

interface DashboardState {
    // Unified metrics (contains all sections)
    unifiedMetrics: UnifiedDashboardMetrics | null;

    // Legacy alias for backward compatibility
    metrics: ProductionMetrics | null;

    isLoading: boolean;
    error: string | null;
    dateFilter: DateFilter;

    // Actions
    fetchMetrics: (forceRefresh?: boolean) => Promise<void>;
    setDateFilter: (filter: DateFilter) => void;

    // Selectors for each section
    getGeneralMetrics: () => GeneralMetrics | null;
    getSalesMetrics: () => SalesMetrics | null;
    getProductionMetrics: () => ProductionMetrics | null;
    getAdminMetrics: () => AdminMetrics | null;
    getFinancialMetrics: () => FinancialMetrics | null;
    getPostSalesMetrics: () => PostSalesMetrics | null;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    unifiedMetrics: null,
    metrics: null,
    isLoading: false,
    error: null,
    dateFilter: 'month',

    fetchMetrics: async (forceRefresh = false) => {
        const { dateFilter, unifiedMetrics, isLoading } = get();

        // Prevent concurrent fetches
        if (isLoading) return;

        // Cache hit: skip fetch if data exists, same filter, and not expired
        if (
            !forceRefresh &&
            unifiedMetrics &&
            unifiedMetrics.dateFilter === dateFilter &&
            (Date.now() - unifiedMetrics.fetchedAt.getTime()) < CACHE_TTL_MS
        ) {
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const result = await DashboardAnalyticsService.getAllMetrics(dateFilter);
            set({
                unifiedMetrics: result,
                // Keep legacy metrics for backward compatibility
                metrics: result.production
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
        // Force refresh when filter changes (invalidates cache)
        get().fetchMetrics(true);
    },

    // Selectors
    getGeneralMetrics: () => get().unifiedMetrics?.general ?? null,
    getSalesMetrics: () => get().unifiedMetrics?.sales ?? null,
    getProductionMetrics: () => get().unifiedMetrics?.production ?? null,
    getAdminMetrics: () => get().unifiedMetrics?.admin ?? null,
    getFinancialMetrics: () => get().unifiedMetrics?.financial ?? null,
    getPostSalesMetrics: () => get().unifiedMetrics?.postSales ?? null,
}));

