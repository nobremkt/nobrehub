/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - SALES METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Calculates sales/CRM dashboard metrics (leads, conversion, pipeline)
 */

import { supabase } from '@/config/supabase';
import { Lead } from '@/types/lead.types';
import type { SalesMetrics, SharedData, DateFilter } from './dashboard.types';
import { getDateRange, parseDate } from './dashboard.helpers';

export const SalesMetricsService = {
    /**
     * Fetches sales/CRM metrics from leads table
     */
    getSalesMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<SalesMetrics> => {
        const { start, end } = getDateRange(filter);

        const leadRows: Record<string, unknown>[] = _shared
            ? _shared.leads
            : (await supabase.from('leads').select('*')).data || [];

        const allLeads: Lead[] = leadRows.map(row => ({
            ...row,
            id: row.id as string,
            createdAt: parseDate(row.created_at) || new Date(),
            updatedAt: parseDate(row.updated_at) || new Date(),
        })) as Lead[];

        // Filter by date range
        const leadsInPeriod = allLeads.filter(l => {
            const relevantDate = l.createdAt;
            return relevantDate >= start && relevantDate <= end;
        });

        // Metrics calculations
        const newLeads = leadsInPeriod.length;
        const qualifiedLeads = leadsInPeriod.filter(l => l.status === 'qualified' || l.status === 'negotiation').length;

        const closedStatuses = ['won', 'closed', 'contracted'];
        const lostStatuses = ['lost', 'churned'];

        const closedDeals = leadsInPeriod.filter(l => closedStatuses.includes(l.status)).length;
        const lostDeals = leadsInPeriod.filter(l => lostStatuses.includes(l.status)).length;

        // Pipeline value
        const pipelineValue = leadsInPeriod
            .filter(l => !lostStatuses.includes(l.status))
            .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

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

        // Leads by status
        const statusMap: Record<string, number> = {};
        leadsInPeriod.forEach(l => {
            statusMap[l.status] = (statusMap[l.status] || 0) + 1;
        });
        const leadsByStatus = Object.entries(statusMap).map(([status, count]) => ({
            status,
            count
        }));

        // Top sellers
        const sellerMap: Record<string, { deals: number; value: number }> = {};
        leadsInPeriod.filter(l => closedStatuses.includes(l.status)).forEach(l => {
            const sellerId = l.responsibleId || 'unknown';
            if (!sellerMap[sellerId]) {
                sellerMap[sellerId] = { deals: 0, value: 0 };
            }
            sellerMap[sellerId].deals += 1;
            sellerMap[sellerId].value += l.estimatedValue || 0;
        });
        const topSellers = Object.entries(sellerMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.deals - a.deals)
            .slice(0, 5);

        // Calculate trend data (leads and closed per day)
        const trendMap: Record<string, { leads: number; closed: number }> = {};
        leadsInPeriod.forEach(l => {
            const dateKey = l.createdAt.toISOString().split('T')[0];
            if (!trendMap[dateKey]) {
                trendMap[dateKey] = { leads: 0, closed: 0 };
            }
            trendMap[dateKey].leads += 1;
            if (closedStatuses.includes(l.status)) {
                trendMap[dateKey].closed += 1;
            }
        });
        const trendData = Object.entries(trendMap)
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
