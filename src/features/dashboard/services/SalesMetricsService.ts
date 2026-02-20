/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - SALES METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Calculates sales/CRM dashboard metrics (leads, conversion, pipeline).
 * Uses SERVER-SIDE aggregation via Supabase RPC for commercial_sales
 * to avoid the 1000-row default limit.
 */

import { supabase } from '@/config/supabase';
import { Lead } from '@/types/lead.types';
import type { SalesMetrics, SharedData, DateFilter } from './dashboard.types';
import { getDateRange, parseDate } from './dashboard.helpers';

// Supabase generated types don't include the new RPC functions yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, params: Record<string, unknown>) => (supabase as any).rpc(fn, params);

// ─── RPC-based server-side aggregation ──────────────────────────────

interface CommercialSummary {
    totalCount: number;
    totalValue: number;
}

async function fetchCommercialSummary(start: Date, end: Date): Promise<CommercialSummary> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await rpc('get_commercial_sales_summary', {
        start_date: startStr,
        end_date: endStr,
    });

    if (error) {
        console.warn('[SalesMetrics] RPC get_commercial_sales_summary error:', error.message);
        return { totalCount: 0, totalValue: 0 };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
        totalCount: Number(row?.total_count) || 0,
        totalValue: Number(row?.total_value) || 0,
    };
}

interface TopSeller {
    name: string;
    deals: number;
    value: number;
}

async function fetchTopSellers(start: Date, end: Date): Promise<TopSeller[]> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await rpc('get_top_sellers', {
        start_date: startStr,
        end_date: endStr,
        max_results: 10,
    });

    if (error) {
        console.warn('[SalesMetrics] RPC get_top_sellers error:', error.message);
        return [];
    }

    return (data || []).map((row: { seller_name: string; deals: number; total_value: number }) => ({
        name: row.seller_name,
        deals: Number(row.deals) || 0,
        value: Number(row.total_value) || 0,
    }));
}

interface DailyTrend {
    date: string;
    closedCount: number;
}

async function fetchDailyTrend(start: Date, end: Date): Promise<DailyTrend[]> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data, error } = await rpc('get_daily_sales_trend', {
        start_date: startStr,
        end_date: endStr,
    });

    if (error) {
        console.warn('[SalesMetrics] RPC get_daily_sales_trend error:', error.message);
        return [];
    }

    return (data || []).map((row: { sale_day: string; closed_count: number }) => ({
        date: row.sale_day,
        closedCount: Number(row.closed_count) || 0,
    }));
}

// ─── Service ─────────────────────────────────────────────────────────

export const SalesMetricsService = {
    /**
     * Fetches sales/CRM metrics from leads table and commercial_sales (via RPC)
     */
    getSalesMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<SalesMetrics> => {
        const { start, end } = getDateRange(filter);

        // ── Fetch all sources in parallel ───────────────────────────
        const leadRowsPromise = _shared
            ? Promise.resolve(_shared.leads)
            : supabase.from('leads').select('*').then(r => r.data || []);

        const [
            leadRows,
            commercialSummary,
            commercialTopSellers,
            commercialDailyTrend,
        ] = await Promise.all([
            leadRowsPromise,
            fetchCommercialSummary(start, end),
            fetchTopSellers(start, end),
            fetchDailyTrend(start, end),
        ]);

        // ── Process leads (live CRM) ────────────────────────────────
        const allLeads: Lead[] = (leadRows as Record<string, unknown>[]).map(row => ({
            ...row,
            id: row.id as string,
            createdAt: parseDate(row.created_at) || new Date(),
            updatedAt: parseDate(row.updated_at) || new Date(),
        })) as Lead[];

        const leadsInPeriod = allLeads.filter(l => {
            const relevantDate = l.createdAt;
            return relevantDate >= start && relevantDate <= end;
        });

        // Metrics from leads
        const newLeads = leadsInPeriod.length;
        const qualifiedLeads = leadsInPeriod.filter(l => l.status === 'qualified' || l.status === 'negotiation').length;

        const closedStatuses = ['won', 'closed', 'contracted'];
        const lostStatuses = ['lost', 'churned'];
        const openStatuses = ['new', 'qualified', 'negotiation', 'proposal'];

        const lostDeals = leadsInPeriod.filter(l => lostStatuses.includes(l.status)).length;

        // Pipeline value — only open/active leads (not closed or lost)
        const pipelineValue = leadsInPeriod
            .filter(l => openStatuses.includes(l.status))
            .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

        // closedDeals = commercial sales only (leads closing IS a commercial sale)
        const closedDeals = commercialSummary.totalCount;

        // Conversion rate
        const totalCompleted = closedDeals + lostDeals;
        const conversionRate = totalCompleted > 0 ? Math.round((closedDeals / totalCompleted) * 100) : 0;

        // Leads by pipeline
        const pipelineMap: Record<string, number> = {};
        leadsInPeriod.forEach(l => {
            const pipeline = l.pipeline || 'default';
            pipelineMap[pipeline] = (pipelineMap[pipeline] || 0) + 1;
        });
        const leadsByPipeline = Object.entries(pipelineMap).map(([pipeline, count]) => ({
            pipeline,
            count
        }));

        // Leads by status (with value aggregation)
        const statusMap: Record<string, { count: number; value: number }> = {};
        leadsInPeriod.forEach(l => {
            if (!statusMap[l.status]) statusMap[l.status] = { count: 0, value: 0 };
            statusMap[l.status].count += 1;
            statusMap[l.status].value += l.estimatedValue || 0;
        });
        // Add commercial sales as "Vendas Históricas" if any
        if (commercialSummary.totalCount > 0) {
            statusMap['Vendas Históricas'] = {
                count: commercialSummary.totalCount,
                value: commercialSummary.totalValue || 0,
            };
        }
        const leadsByStatus = Object.entries(statusMap).map(([status, data]) => ({
            status,
            count: data.count,
            value: data.value,
        }));

        // ── Top sellers: merge leads + commercial (server-side) ─────
        const sellerMap: Record<string, { deals: number; value: number }> = {};

        // From leads
        leadsInPeriod.filter(l => closedStatuses.includes(l.status)).forEach(l => {
            const sellerId = l.responsibleId || 'unknown';
            if (!sellerMap[sellerId]) {
                sellerMap[sellerId] = { deals: 0, value: 0 };
            }
            sellerMap[sellerId].deals += 1;
            sellerMap[sellerId].value += l.estimatedValue || 0;
        });

        // From commercial sales (already aggregated server-side)
        commercialTopSellers.forEach(seller => {
            if (!sellerMap[seller.name]) {
                sellerMap[seller.name] = { deals: 0, value: 0 };
            }
            sellerMap[seller.name].deals += seller.deals;
            sellerMap[seller.name].value += seller.value;
        });

        const topSellers = Object.entries(sellerMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // ── Trend data: merge leads + commercial ──────────────────
        const isYearFilter = filter === '2025' || filter === '2026';
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        let trendData: { date: string; leads: number; closed: number }[];

        if (isYearFilter) {
            // Aggregate by month for year filters
            const monthMap: Record<string, { leads: number; closed: number }> = {};

            leadsInPeriod.forEach(l => {
                const d = l.createdAt;
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthMap[key]) monthMap[key] = { leads: 0, closed: 0 };
                monthMap[key].leads += 1;
                if (closedStatuses.includes(l.status)) {
                    monthMap[key].closed += 1;
                }
            });

            // Add commercial daily trend aggregated into months
            commercialDailyTrend.forEach(day => {
                const d = new Date(day.date + 'T12:00:00');
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthMap[key]) monthMap[key] = { leads: 0, closed: 0 };
                monthMap[key].closed += day.closedCount;
            });

            // Build all 12 months
            const year = filter === '2025' ? 2025 : 2026;
            trendData = [];
            for (let m = 0; m < 12; m++) {
                const key = `${year}-${String(m + 1).padStart(2, '0')}`;
                const data = monthMap[key] || { leads: 0, closed: 0 };
                trendData.push({
                    date: monthNames[m],
                    leads: data.leads,
                    closed: data.closed,
                });
            }
        } else {
            // Daily aggregation for shorter periods
            const dayMap: Record<string, { leads: number; closed: number }> = {};

            leadsInPeriod.forEach(l => {
                const dateKey = l.createdAt.toISOString().split('T')[0];
                if (!dayMap[dateKey]) dayMap[dateKey] = { leads: 0, closed: 0 };
                dayMap[dateKey].leads += 1;
                if (closedStatuses.includes(l.status)) {
                    dayMap[dateKey].closed += 1;
                }
            });

            commercialDailyTrend.forEach(day => {
                if (!dayMap[day.date]) dayMap[day.date] = { leads: 0, closed: 0 };
                dayMap[day.date].closed += day.closedCount;
            });

            trendData = Object.entries(dayMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-14)
                .map(([date, data]) => {
                    const d = new Date(date);
                    return {
                        date: `${d.getDate()}/${d.getMonth() + 1}`,
                        leads: data.leads,
                        closed: data.closed
                    };
                });
        }

        // Calculate source data from lead source field
        const sourceMap: Record<string, number> = {};
        leadsInPeriod.forEach(l => {
            const source = (l as { source?: string }).source || 'outros';
            sourceMap[source] = (sourceMap[source] || 0) + 1;
        });
        const sourceData = Object.entries(sourceMap)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        // Calculate performance metrics
        const contactedLeads = leadsInPeriod.filter(l =>
            !['new'].includes(l.status)
        ).length;
        const contactRate = newLeads > 0 ? Math.round((contactedLeads / newLeads) * 100) : 0;

        const closedLeadsInPeriod = leadsInPeriod.filter(l => closedStatuses.includes(l.status));
        let totalCycleDays = 0;
        let cycleCount = 0;
        closedLeadsInPeriod.forEach(l => {
            if (l.createdAt && l.updatedAt) {
                const days = Math.max(0, Math.ceil((l.updatedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                totalCycleDays += days;
                cycleCount++;
            }
        });
        const avgCycleTime = cycleCount > 0 ? Math.round((totalCycleDays / cycleCount) * 10) / 10 : 0;

        const performanceMetrics = {
            avgResponseTime: 0,
            avgCycleTime,
            contactRate,
            followUpRate: contactRate,
        };

        return {
            newLeads,
            qualifiedLeads,
            closedDeals,
            lostDeals,
            pipelineValue,
            conversionRate,
            leadsByPipeline,
            leadsByStatus,
            topSellers,
            trendData,
            sourceData: sourceData.length > 0 ? sourceData : [
                { source: 'landing-page', count: 0 },
                { source: 'site', count: 0 },
                { source: 'whatsapp', count: 0 },
                { source: 'instagram', count: 0 },
                { source: 'indicacao', count: 0 },
            ],
            performanceMetrics
        };
    },
};
