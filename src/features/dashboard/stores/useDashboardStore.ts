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
import { useAuthStore } from '@/stores/useAuthStore';
import { GoalTrackingService } from '@/features/settings/services/goalTrackingService';
import { useNotificationStore } from '@/stores/useNotificationStore';

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

    // Internal: previous individual goal percentage for change detection
    _prevIndividualGoalPct: number;

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

/**
 * Check if the current user has just reached their individual goal.
 * Separated from the main fetch flow for clarity.
 */
async function checkGoalProgress(
    getPrevPct: () => number,
    setPrevPct: (pct: number) => void
): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user?.id || !user?.sectorId) return;

    const summary = await GoalTrackingService.getCollaboratorProgress(user.id, user.sectorId);
    const individualPct = summary.progress.overallPercentage;
    const prevPct = getPrevPct();

    if (individualPct >= 100 && prevPct < 100) {
        useNotificationStore.getState().addNotification({
            type: 'goal_reached',
            title: '🏆 Meta atingida!',
            body: `Você atingiu ${individualPct}% da sua meta de ${summary.progress.sectorLabel}!`,
            link: '/dashboard',
        });
    }

    setPrevPct(individualPct);
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    unifiedMetrics: null,
    metrics: null,
    isLoading: false,
    error: null,
    dateFilter: 'month',
    _prevIndividualGoalPct: 0,

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
                metrics: result.production,
            });

            // Goal check: properly awaited, non-blocking but with error handling
            if (result.production) {
                try {
                    await checkGoalProgress(
                        () => get()._prevIndividualGoalPct,
                        (pct) => set({ _prevIndividualGoalPct: pct })
                    );
                } catch (err) {
                    console.warn('Could not check individual goal progress:', err);
                }
            }
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



