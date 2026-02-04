import { create } from 'zustand';
import { DashboardAnalyticsService, ProductionMetrics, DateFilter } from '../services/DashboardAnalyticsService';

interface DashboardState {
    dateFilter: DateFilter;
    metrics: ProductionMetrics | null;
    isLoading: boolean;
    error: string | null;
    setDateFilter: (filter: DateFilter) => void;
    fetchMetrics: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    dateFilter: 'month',
    metrics: null,
    isLoading: false,
    error: null,

    setDateFilter: (filter) => {
        set({ dateFilter: filter });
        get().fetchMetrics();
    },

    fetchMetrics: async () => {
        const { dateFilter } = get();
        set({ isLoading: true, error: null });

        try {
            const metrics = await DashboardAnalyticsService.getMetrics(dateFilter);
            set({ metrics, isLoading: false });
        } catch (error) {
            console.error('Error fetching dashboard metrics:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao carregar métricas',
                isLoading: false
            });
        }
    },
}));
