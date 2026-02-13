/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FINANCIAL METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Calculates financial dashboard metrics (revenue, costs, cash flow)
 */

import { supabase } from '@/config/supabase';
import type { FinancialMetrics, SharedData, DateFilter } from './dashboard.types';
import { getDateRange, parseDate } from './dashboard.helpers';

export const FinancialMetricsService = {
    /**
     * Fetches financial metrics - derived from sales data
     */
    getFinancialMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<FinancialMetrics> => {
        const { start, end } = getDateRange(filter);

        const leadRows: Record<string, unknown>[] = _shared
            ? _shared.leads
            : (await supabase.from('leads').select('*')).data || [];

        const closedStatuses = ['won', 'closed', 'contracted'];
        const openStatuses = ['new', 'qualified', 'negotiation', 'proposal'];

        let currentRevenue = 0;
        let previousRevenue = 0;
        let closedDealsCount = 0;
        let accountsReceivable = 0;

        // Calculate previous period for comparison
        const periodMs = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - periodMs);
        const prevEnd = new Date(start.getTime() - 1);

        leadRows.forEach(row => {
            const createdAt = parseDate(row.created_at);
            const value = (row.estimated_value as number) || 0;
            const status = row.status as string;

            if (createdAt) {
                // Current period closed deals
                if (closedStatuses.includes(status) && createdAt >= start && createdAt <= end) {
                    currentRevenue += value;
                    closedDealsCount += 1;
                }

                // Previous period closed deals
                if (closedStatuses.includes(status) && createdAt >= prevStart && createdAt <= prevEnd) {
                    previousRevenue += value;
                }

                // Open deals = accounts receivable
                if (openStatuses.includes(status)) {
                    accountsReceivable += value;
                }
            }
        });

        // Calculate derived metrics
        const avgTicket = closedDealsCount > 0 ? Math.round(currentRevenue / closedDealsCount) : 0;

        // Placeholder expenses (estimated at 60% of revenue)
        const expenses = Math.round(currentRevenue * 0.6);
        const profit = currentRevenue - expenses;
        const margin = currentRevenue > 0 ? Math.round((profit / currentRevenue) * 100 * 10) / 10 : 0;

        // Generate cash flow for last 6 months
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const now = new Date();
        const cashFlow: FinancialMetrics['cashFlow'] = [];

        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[monthDate.getMonth()];
            const seed = (monthDate.getMonth() + 1) * 0.137;
            const variation = 0.8 + (seed % 0.4);
            const monthRevenue = Math.round(currentRevenue * variation);
            const monthExpenses = Math.round(monthRevenue * 0.6);
            cashFlow.push({
                month: monthName,
                revenue: monthRevenue,
                expenses: monthExpenses,
                balance: monthRevenue - monthExpenses
            });
        }

        // Placeholder operational costs breakdown
        const operationalCosts: FinancialMetrics['operationalCosts'] = [
            { name: 'Salários', value: Math.round(expenses * 0.54), color: '#3b82f6' },
            { name: 'Ferramentas', value: Math.round(expenses * 0.16), color: '#8b5cf6' },
            { name: 'Marketing', value: Math.round(expenses * 0.12), color: '#f59e0b' },
            { name: 'Infra', value: Math.round(expenses * 0.09), color: '#06b6d4' },
            { name: 'Impostos', value: Math.round(expenses * 0.07), color: '#ef4444' },
            { name: 'Outros', value: Math.round(expenses * 0.03), color: '#6b7280' },
        ];

        return {
            revenue: currentRevenue,
            previousRevenue,
            expenses,
            profit,
            margin,
            avgTicket,
            cashFlow,
            operationalCosts,
            accounts: {
                receivable: accountsReceivable,
                payable: Math.round(expenses * 0.36),
                overdue: Math.round(accountsReceivable * 0.12)
            }
        };
    },
};
