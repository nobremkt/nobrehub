/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DASHBOARD ANALYTICS SERVICE (FACADE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Thin facade that delegates to per-section metric services.
 * All consumers can keep their existing imports unchanged.
 *
 * Internal split:
 *   dashboard.types.ts           → shared types
 *   dashboard.helpers.ts         → shared helpers (dates, goals, lookups)
 *   ProductionMetricsService.ts  → getMetrics()
 *   SalesMetricsService.ts       → getSalesMetrics()
 *   AdminMetricsService.ts       → getAdminMetrics()
 *   FinancialMetricsService.ts   → getFinancialMetrics()
 *   PostSalesMetricsService.ts   → getPostSalesMetrics()
 */

import { supabase } from '@/config/supabase';
import { PROJECTS_TABLE } from './dashboard.helpers';
import { ProductionMetricsService } from './ProductionMetricsService';
import { SalesMetricsService } from './SalesMetricsService';
import { AdminMetricsService } from './AdminMetricsService';
import { FinancialMetricsService } from './FinancialMetricsService';
import { PostSalesMetricsService } from './PostSalesMetricsService';

// ─── Re-export all types so existing consumers don't break ──────────────────
export type {
    DateFilter,
    InternalProject,
    ProductionMetrics,
    SalesMetrics,
    GeneralMetrics,
    AdminMetrics,
    FinancialMetrics,
    PostSalesMetrics,
    UnifiedDashboardMetrics,
    DashboardMetrics,
    CollaboratorsData,
    SharedData,
} from './dashboard.types';

import type {
    DateFilter,
    GeneralMetrics,
    SharedData,
    UnifiedDashboardMetrics,
} from './dashboard.types';

// ─── Facade ─────────────────────────────────────────────────────────────────

export const DashboardAnalyticsService = {
    /** Production metrics (projects, goals, rankings) */
    getMetrics: ProductionMetricsService.getMetrics,

    /** Sales/CRM metrics (leads, pipeline, conversion) */
    getSalesMetrics: SalesMetricsService.getSalesMetrics,

    /** Admin/Team metrics (team size, workload, sectors) */
    getAdminMetrics: AdminMetricsService.getAdminMetrics,

    /** Financial metrics (revenue, costs, cash flow) */
    getFinancialMetrics: FinancialMetricsService.getFinancialMetrics,

    /** Post-sales metrics (tickets, retention, payments) */
    getPostSalesMetrics: PostSalesMetricsService.getPostSalesMetrics,

    /**
     * Fetches all metrics unified.
     * Fetches shared tables ONCE and passes them to all sub-methods,
     * reducing Supabase queries from 9 to 5 per dashboard load.
     */
    getAllMetrics: async (filter: DateFilter = 'month'): Promise<UnifiedDashboardMetrics> => {
        // ── Shared data fetch (1 query per table) ──────────────────────
        // Projects may exceed 1000-row default limit, so paginate
        const fetchAllProjects = async () => {
            const allRows: Record<string, unknown>[] = [];
            const PAGE_SIZE = 1000;
            let from = 0;
            let hasMore = true;
            while (hasMore) {
                const { data } = await supabase.from(PROJECTS_TABLE).select('*').range(from, from + PAGE_SIZE - 1);
                const rows = (data || []) as Record<string, unknown>[];
                allRows.push(...rows);
                hasMore = rows.length === PAGE_SIZE;
                from += PAGE_SIZE;
            }
            return allRows;
        };

        const [collaboratorsRes, projectRows, leadsRes, sectorsRes, rolesRes] = await Promise.all([
            supabase.from('users').select('*'),
            fetchAllProjects(),
            supabase.from('leads').select('*'),
            supabase.from('sectors').select('*'),
            supabase.from('roles').select('*'),
        ]);

        const shared: SharedData = {
            collaborators: collaboratorsRes.data || [],
            projects: projectRows,
            leads: leadsRes.data || [],
            sectors: sectorsRes.data || [],
            roles: rolesRes.data || [],
        };

        // ── Compute all metrics using shared data ──────────────────────
        const [production, sales, admin, financial, postSales] = await Promise.all([
            DashboardAnalyticsService.getMetrics(filter, shared),
            DashboardAnalyticsService.getSalesMetrics(filter, shared),
            DashboardAnalyticsService.getAdminMetrics(filter, shared),
            DashboardAnalyticsService.getFinancialMetrics(filter, shared),
            DashboardAnalyticsService.getPostSalesMetrics(filter, shared)
        ]);

        const general: GeneralMetrics = {
            totalRevenue: sales.pipelineValue,
            totalLeads: sales.newLeads,
            totalProjects: production.totalActiveProjects + production.deliveredProjects,
            totalDelivered: production.deliveredProjects,
            conversionRate: sales.conversionRate,
            avgDeliveryTime: production.mvpProducer?.avgDays || 0
        };

        return {
            dateFilter: filter,
            fetchedAt: new Date(),
            general,
            production,
            sales,
            admin,
            financial,
            postSales
        };
    }
};
