/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST-SALES METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Calculates post-sales dashboard metrics from imported data via RPC
 */

import { supabase } from '@/config/supabase';
import type { PostSalesMetrics, SharedData, DateFilter } from './dashboard.types';
import { getDateRange } from './dashboard.helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as (fn: string, params: Record<string, unknown>) => any;

interface RpcTopSeller {
    id: string;
    name: string;
    total_received: number;
    receipt_count: number;
    unique_clients: number;
}

export const PostSalesMetricsService = {
    /**
     * Fetches post-sales metrics from real data via RPC
     */
    getPostSalesMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<PostSalesMetrics> => {
        const { start, end } = getDateRange(filter);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // Call the RPC function
        const { data, error } = await rpc('get_post_sales_kpis', {
            p_start_date: startStr,
            p_end_date: endStr,
        });

        if (error) {
            console.error('[PostSalesMetrics] RPC error:', error);
            // Return zeros on error
            return {
                totalReceipts: 0,
                totalSales: 0,
                uniqueClientsReceipts: 0,
                uniqueClientsSales: 0,
                churnRate: 0,
                retentionRate: 0,
                commercialClients: 0,
                clientsWithDebits: 0,
                ltv: 0,
                avgReceiptValue: 0,
                debitosPending: 0,
                debitosTotal: 0,
                cac: 0,
                topPostSellers: [],
            };
        }

        const kpis = data as Record<string, unknown>;

        // Resolve profile photo URLs for top sellers
        const collabRows = _shared?.collaborators ||
            (await supabase.from('users').select('id, avatar_url')).data || [];

        const photoMap: Record<string, string> = {};
        for (const row of collabRows) {
            const r = row as Record<string, unknown>;
            if (r.avatar_url) photoMap[r.id as string] = r.avatar_url as string;
        }

        const rawSellers = (kpis.topPostSellers as RpcTopSeller[]) || [];
        const topPostSellers = rawSellers.map(s => ({
            id: s.id,
            name: s.name,
            profilePhotoUrl: photoMap[s.id] || undefined,
            totalReceived: Number(s.total_received) || 0,
            receiptCount: Number(s.receipt_count) || 0,
            uniqueClients: Number(s.unique_clients) || 0,
        }));

        return {
            totalReceipts: Number(kpis.totalReceipts) || 0,
            totalSales: Number(kpis.totalSales) || 0,
            uniqueClientsReceipts: Number(kpis.uniqueClientsReceipts) || 0,
            uniqueClientsSales: Number(kpis.uniqueClientsSales) || 0,
            churnRate: Number(kpis.churnRate) || 0,
            retentionRate: Number(kpis.retentionRate) || 0,
            commercialClients: Number(kpis.commercialClients) || 0,
            clientsWithDebits: Number(kpis.clientsWithDebits) || 0,
            ltv: Number(kpis.ltv) || 0,
            avgReceiptValue: Number(kpis.avgReceiptValue) || 0,
            debitosPending: Number(kpis.debitosPending) || 0,
            debitosTotal: Number(kpis.debitosTotal) || 0,
            cac: Number(kpis.cac) || 0,
            topPostSellers,
        };
    },
};
