/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST-SALES METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Calculates post-sales dashboard metrics (tickets, retention, payments)
 * Note: Currently returns placeholder data - requires tickets/payments collections
 */

import { supabase } from '@/config/supabase';
import type { PostSalesMetrics, SharedData, DateFilter } from './dashboard.types';
import { findIdsByName, POS_VENDAS_SECTOR_NAME } from './dashboard.helpers';

export const PostSalesMetricsService = {
    /**
     * Fetches post-sales metrics
     * Note: Currently returns placeholder data - requires tickets/payments collections
     */
    getPostSalesMetrics: async (_filter: DateFilter = 'month', _shared?: SharedData): Promise<PostSalesMetrics> => {
        const collabRows: Record<string, unknown>[] = _shared
            ? _shared.collaborators
            : (await supabase.from('users').select('*')).data || [];

        // Resolve pós-vendas sector IDs by name
        const sectorRows = _shared?.sectors || [];
        const posVendasSectorIds = findIdsByName(sectorRows, POS_VENDAS_SECTOR_NAME);

        // Filter post-sales team members (excluding DEBUG account)
        const postSalesTeam = collabRows.filter(row =>
            (row.email as string) !== 'debug@debug.com' &&
            (posVendasSectorIds.has(row.sector_id as string) || (row.sector_id as string) === POS_VENDAS_SECTOR_NAME)
        );

        // TODO: Fetch from payments collection when available
        const topPostSellers = postSalesTeam.map(row => ({
            id: row.id as string,
            name: (row.name as string) || 'Desconhecido',
            profilePhotoUrl: (row.avatar_url as string) || undefined,
            paymentsReceived: 0,
            ticketsResolved: 0,
            avgRating: 0,
        })).sort((a, b) => b.paymentsReceived - a.paymentsReceived).slice(0, 5);

        // Generate trend data (placeholder - zeros)
        const ticketsTrend: PostSalesMetrics['ticketsTrend'] = [];
        const paymentsTrend: PostSalesMetrics['paymentsTrend'] = [];

        const now = new Date();
        for (let i = 13; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

            ticketsTrend.push({ date: dateStr, opened: 0, resolved: 0 });
            paymentsTrend.push({ date: dateStr, amount: 0 });
        }

        return {
            openTickets: 0,
            resolvedTickets: 0,
            avgResolutionTime: 0,
            customerSatisfaction: 0,
            churnRate: 0,
            retentionRate: 0,
            npsScore: 0,
            ticketsTrend,
            totalPaymentsReceived: 0,
            paymentsTrend,
            topPostSellers,
        };
    },
};
