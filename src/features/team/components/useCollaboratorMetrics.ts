/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * useCollaboratorMetrics — Hook for per-sector metrics
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { SECTOR_IDS, type CollaboratorMetrics } from './profileModal.types';

export function useCollaboratorMetrics(collaboratorId: string | undefined, sectorId: string | undefined, isActive: boolean) {
    const [metrics, setMetrics] = useState<CollaboratorMetrics | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchMetrics = useCallback(async () => {
        if (!collaboratorId || !sectorId || !isActive) return;
        setLoading(true);
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            if (sectorId === SECTOR_IDS.PRODUCAO) {
                const { data, error } = await supabase
                    .from('projects')
                    .select('status, created_at, delivered_at, total_points, base_points')
                    .eq('producer_id', collaboratorId)
                    .gte('created_at', monthStart.toISOString())
                    .lte('created_at', monthEnd.toISOString());

                if (error) throw error;

                let points = 0, delivered = 0, alteracoes = 0, totalDays = 0, deliveryCount = 0;

                (data || []).forEach((d) => {
                    const deliveredAt = d.delivered_at ? new Date(d.delivered_at as string) : null;
                    const createdAt = d.created_at ? new Date(d.created_at as string) : null;
                    const status = (d.status as string) || '';
                    const isFinished = status === 'entregue' || status === 'revisado' || status === 'concluido';
                    const isAlt = status === 'alteracao' || status === 'alteracao_interna' || status === 'alteracao_cliente';
                    const relevantDate = deliveredAt || (isFinished ? createdAt : null);
                    if (!relevantDate || relevantDate < monthStart || relevantDate > monthEnd) return;
                    if (isAlt) { alteracoes++; return; }
                    delivered++;
                    points += Number(d.total_points ?? d.base_points ?? 1) || 1;
                    if (createdAt && deliveredAt) {
                        totalDays += Math.max(0, Math.ceil((deliveredAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                        deliveryCount++;
                    }
                });

                const total = delivered + alteracoes;
                setMetrics({
                    points,
                    projectsFinished: delivered,
                    approvalRate: total > 0 ? Math.round((delivered / total) * 100) : 100,
                    avgDeliveryDays: deliveryCount > 0 ? Math.round((totalDays / deliveryCount) * 10) / 10 : 0,
                    totalSold: 0, leadsConverted: 0, conversionRate: 0, avgTicket: 0,
                    clientsAttended: 0, completedProjects: 0,
                });
            } else if (sectorId === SECTOR_IDS.VENDAS) {
                const { data, error } = await supabase
                    .from('leads')
                    .select('created_at, deal_status, deal_value, estimated_value')
                    .eq('responsible_id', collaboratorId)
                    .gte('created_at', monthStart.toISOString())
                    .lte('created_at', monthEnd.toISOString());

                if (error) throw error;

                let totalSold = 0, closed = 0, lost = 0;
                const closedStatuses = ['won', 'closed', 'contracted'];
                const lostStatuses = ['lost', 'churned'];

                (data || []).forEach((d) => {
                    const createdAt = d.created_at ? new Date(d.created_at) : null;
                    if (!createdAt || createdAt < monthStart || createdAt > monthEnd) return;
                    const status = d.deal_status || 'open';
                    if (closedStatuses.includes(status)) {
                        closed++;
                        totalSold += Number(d.deal_value ?? d.estimated_value ?? 0);
                    }
                    if (lostStatuses.includes(status)) lost++;
                });

                const totalCompleted = closed + lost;
                setMetrics({
                    points: 0, projectsFinished: 0, approvalRate: 0, avgDeliveryDays: 0,
                    totalSold,
                    leadsConverted: closed,
                    conversionRate: totalCompleted > 0 ? Math.round((closed / totalCompleted) * 100) : 0,
                    avgTicket: closed > 0 ? Math.round(totalSold / closed) : 0,
                    clientsAttended: 0, completedProjects: 0,
                });
            } else if (sectorId === SECTOR_IDS.POS_VENDAS) {
                const { data, error } = await supabase
                    .from('leads')
                    .select('client_status')
                    .eq('post_sales_id', collaboratorId);

                if (error) throw error;

                let clientsAttended = 0, completed = 0;

                (data || []).forEach((d) => {
                    clientsAttended++;
                    if (d.client_status === 'concluido') completed++;
                });

                setMetrics({
                    points: 0, projectsFinished: 0, approvalRate: 0, avgDeliveryDays: 0,
                    totalSold: 0, leadsConverted: 0, conversionRate: 0, avgTicket: 0,
                    clientsAttended,
                    completedProjects: completed,
                });
            }
        } catch (error) {
            console.error('Erro ao buscar métricas do colaborador:', error);
        } finally {
            setLoading(false);
        }
    }, [collaboratorId, sectorId, isActive]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return { metrics, loading };
}
