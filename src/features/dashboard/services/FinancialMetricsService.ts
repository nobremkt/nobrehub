/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FINANCIAL METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Calculates financial dashboard metrics (revenue, costs, cash flow).
 * Uses SERVER-SIDE aggregation via Supabase RPC to avoid row-limit issues.
 * Merges: leads (CRM) + commercial_sales + financial_transactions.
 */

import { supabase } from '@/config/supabase';
import type { FinancialMetrics, SharedData, DateFilter } from './dashboard.types';
import { getDateRange, parseDate } from './dashboard.helpers';

// Supabase generated types don't include the new RPC functions yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, params: Record<string, unknown>) => (supabase as any).rpc(fn, params);

// ─── RPC-based server-side aggregation ───────────────────────────────

/**
 * Fetch commercial revenue via RPC (server-side SUM — no row limit).
 */
async function fetchCommercialRevenue(start: Date, end: Date): Promise<{ revenue: number; count: number }> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await rpc('get_commercial_revenue', {
        start_date: startStr,
        end_date: endStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_commercial_revenue error:', error.message);
        return { revenue: 0, count: 0 };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
        revenue: Number(row?.revenue) || 0,
        count: Number(row?.count) || 0,
    };
}

/**
 * Fetch monthly commercial revenue via RPC (server-side GROUP BY).
 */
async function fetchMonthlyCashFlow(startDate: Date): Promise<Record<string, number>> {
    const startStr = startDate.toISOString().split('T')[0];

    const { data, error } = await rpc('get_monthly_commercial_revenue', {
        start_date: startStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_monthly_commercial_revenue error:', error.message);
        return {};
    }

    const monthMap: Record<string, number> = {};
    (data || []).forEach((row: { month_key: string; revenue: number }) => {
        monthMap[row.month_key] = Number(row.revenue) || 0;
    });

    return monthMap;
}

// ── Category colors for operational costs chart ─────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    'Marketing': '#f59e0b',
    'Salários': '#3b82f6',
    'Impostos': '#ef4444',
    'Comissões': '#10b981',
    'Outros Gastos': '#6b7280',
    'Infraestrutura': '#06b6d4',
    'Ferramentas': '#8b5cf6',
    'Metas': '#f97316',
};

/**
 * Fetch REAL expenses via RPC (server-side SUM).
 */
async function fetchRealExpenses(start: Date, end: Date): Promise<number> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await rpc('get_financial_expenses', {
        start_date: startStr,
        end_date: endStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_financial_expenses error:', error.message);
        return 0;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return Number(row?.total_expense) || 0;
}

/**
 * Fetch expenses grouped by category.
 */
async function fetchExpensesByCategory(start: Date, end: Date): Promise<{ name: string; value: number; color: string }[]> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await rpc('get_expenses_by_category', {
        start_date: startStr,
        end_date: endStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_expenses_by_category error:', error.message);
        return [];
    }

    return (data || []).map((row: { category_name: string; total: number }) => ({
        name: row.category_name,
        value: Number(row.total) || 0,
        color: CATEGORY_COLORS[row.category_name] || '#6b7280',
    }));
}

/**
 * Fetch monthly expenses via RPC (server-side GROUP BY).
 */
async function fetchMonthlyExpenses(startDate: Date): Promise<Record<string, number>> {
    const startStr = startDate.toISOString().split('T')[0];

    const { data, error } = await rpc('get_monthly_financial_expenses', {
        start_date: startStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_monthly_financial_expenses error:', error.message);
        return {};
    }

    const monthMap: Record<string, number> = {};
    (data || []).forEach((row: { month_key: string; expense: number }) => {
        monthMap[row.month_key] = Number(row.expense) || 0;
    });

    return monthMap;
}

// ─── Post-Sales Revenue ──────────────────────────────────────────────

export async function fetchPostSalesRevenue(start: Date, end: Date): Promise<{ receipts: number; sales: number; total: number }> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await rpc('get_post_sales_revenue', {
        start_date: startStr,
        end_date: endStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_post_sales_revenue error:', error.message);
        return { receipts: 0, sales: 0, total: 0 };
    }

    const row = data as Record<string, unknown>;
    return {
        receipts: Number(row?.receipts) || 0,
        sales: Number(row?.sales) || 0,
        total: Number(row?.total) || 0,
    };
}

export async function fetchMonthlyPostSalesRevenue(startDate: Date): Promise<Record<string, number>> {
    const startStr = startDate.toISOString().split('T')[0];

    const { data, error } = await rpc('get_monthly_post_sales_revenue', {
        start_date: startStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_monthly_post_sales_revenue error:', error.message);
        return {};
    }

    const result: Record<string, number> = {};
    if (Array.isArray(data)) {
        for (const row of data as { month: string; revenue: number }[]) {
            result[row.month] = Number(row.revenue) || 0;
        }
    }
    return result;
}

// ─── Real Revenue (from manager spreadsheet: actual bank deposits) ───────

async function fetchRealRevenuePeriod(start: Date, end: Date): Promise<number> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await rpc('get_real_revenue', {
        start_date: startStr,
        end_date: endStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_real_revenue error:', error.message);
        return 0;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return Number((row as Record<string, unknown>)?.total_revenue) || 0;
}

async function fetchMonthlyRealRevenue(startDate: Date): Promise<Record<string, number>> {
    const startStr = startDate.toISOString().split('T')[0];

    const { data, error } = await rpc('get_monthly_real_revenue', {
        start_date: startStr,
    });

    if (error) {
        console.warn('[FinancialMetrics] RPC get_monthly_real_revenue error:', error.message);
        return {};
    }

    const result: Record<string, number> = {};
    if (Array.isArray(data)) {
        for (const row of data as { month: string; revenue: number }[]) {
            result[row.month] = Number(row.revenue) || 0;
        }
    }
    return result;
}

// ─── Service ─────────────────────────────────────────────────────────

export const FinancialMetricsService = {
    /**
     * Fetches financial metrics — merges leads + commercial_sales + financial_transactions
     */
    getFinancialMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<FinancialMetrics> => {
        const { start, end } = getDateRange(filter);
        const now = new Date();

        // ── Fetch all sources in parallel ───────────────────────────
        const leadRowsPromise = _shared
            ? Promise.resolve(_shared.leads)
            : supabase.from('leads').select('*').then(r => r.data || []);

        // Previous period for comparison
        const periodMs = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - periodMs);
        const prevEnd = new Date(start.getTime() - 1);

        // Determine cash flow chart start date based on filter
        // For yearly filters, show all 12 months; otherwise last 6 months from now
        const isYearFilter = filter === '2025' || filter === '2026';
        const cashFlowStartDate = isYearFilter ? start : new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // NOTE: post-sales RPCs removed — that data tracks agent performance,
        // not additional revenue.  It's already included in commercial_sales.
        const [
            leadRows,
            commercialCurrent,
            realRevenueCurrent,
            realRevenuePrevious,
            monthlyCashFlow,
            monthlyRealRev,
            realExpenses,
            monthlyExpenses,
            expensesByCategory,
        ] = await Promise.all([
            leadRowsPromise,
            fetchCommercialRevenue(start, end),
            fetchRealRevenuePeriod(start, end),
            fetchRealRevenuePeriod(prevStart, prevEnd),
            fetchMonthlyCashFlow(cashFlowStartDate),
            fetchMonthlyRealRevenue(cashFlowStartDate),
            fetchRealExpenses(start, end),
            fetchMonthlyExpenses(cashFlowStartDate),
            fetchExpensesByCategory(start, end),
        ]);

        // ── Process leads ───────────────────────────────────────────
        const closedStatuses = ['won', 'closed', 'contracted'];
        const openStatuses = ['new', 'qualified', 'negotiation', 'proposal'];

        let leadClosedCount = 0;
        let accountsReceivable = 0;

        (leadRows as Record<string, unknown>[]).forEach(row => {
            const createdAt = parseDate(row.created_at);
            const value = (row.estimated_value as number) || 0;
            const status = row.status as string;

            if (createdAt) {
                if (closedStatuses.includes(status) && createdAt >= start && createdAt <= end) {
                    leadClosedCount += 1;
                }
                // accountsReceivable: only open leads within date range
                if (openStatuses.includes(status) && createdAt >= start && createdAt <= end) {
                    accountsReceivable += value;
                }
            }
        });

        // ── Revenue ──────────────────────────────────────────────────
        // realRevenue = actual bank deposits (from manager's 2025.xlsx → real_revenue table)
        // contractedRevenue = value sold via commercial_sales (contracted, not collected)
        const currentRevenue = Math.round(realRevenueCurrent);
        const previousRevenue = Math.round(realRevenuePrevious);
        const contractedRevenue = commercialCurrent.revenue;
        const closedDealsCount = commercialCurrent.count;

        const avgTicket = closedDealsCount > 0 ? Math.round(contractedRevenue / closedDealsCount) : 0;

        // ── REAL expenses from financial_transactions ────────────────
        const expenses = Math.round(realExpenses);
        // Profit and margin based on REAL revenue (money in account)
        const profit = currentRevenue - expenses;
        const margin = currentRevenue > 0 ? Math.round((profit / currentRevenue) * 100 * 10) / 10 : 0;

        // ── Cash flow chart: adapts to filter range ─────────────────
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const cashFlow: FinancialMetrics['cashFlow'] = [];

        if (isYearFilter) {
            // Show all 12 months for yearly filters
            const year = filter === '2025' ? 2025 : 2026;
            for (let m = 0; m < 12; m++) {
                const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
                // Use real revenue for cash flow chart (actual bank deposits)
                const monthRevenue = Math.round(monthlyRealRev[monthKey] || monthlyCashFlow[monthKey] || 0);
                const monthExp = Math.round(monthlyExpenses[monthKey] || 0);
                cashFlow.push({
                    month: months[m],
                    revenue: monthRevenue,
                    expenses: monthExp,
                    balance: monthRevenue - monthExp,
                });
            }
        } else {
            // Show last 6 months for other filters
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
                const monthName = months[monthDate.getMonth()];
                const monthRevenue = Math.round(monthlyRealRev[monthKey] || monthlyCashFlow[monthKey] || 0);
                const monthExp = Math.round(monthlyExpenses[monthKey] || 0);
                cashFlow.push({
                    month: monthName,
                    revenue: monthRevenue,
                    expenses: monthExp,
                    balance: monthRevenue - monthExp,
                });
            }
        }

        // ── Operational costs (by category) ─────────────────────────
        const operationalCosts: FinancialMetrics['operationalCosts'] = expensesByCategory.length > 0
            ? expensesByCategory
            : [{ name: 'Sem dados', value: 0, color: '#6b7280' }];

        return {
            revenue: currentRevenue,
            previousRevenue,
            contractedRevenue,
            expenses,
            profit,
            margin,
            avgTicket,
            cashFlow,
            operationalCosts,
        };
    },
};
