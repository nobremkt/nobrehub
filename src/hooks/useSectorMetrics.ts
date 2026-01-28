/**
 * useSectorMetrics
 * 
 * Hook for fetching sector-specific dashboard metrics.
 * Modular design for easy metric additions/changes.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SalesMetrics {
    totalLeads: number;
    leadsByStage: Record<string, number>;
    conversionRate: number;
    totalPipelineValue: number;
    leadsBySource: Record<string, number>;
}

export interface ProductionMetrics {
    totalProjects: number;
    projectsByStatus: Record<string, number>;
    overdueProjects: number;
    avgSLADays: number;
    projectsByMember: { name: string; count: number }[];
}

export interface SectorMetrics {
    sales?: SalesMetrics;
    production?: ProductionMetrics;
}

export function useSectorMetrics(sector: 'sales' | 'production' | null) {
    const [metrics, setMetrics] = useState<SectorMetrics>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSalesMetrics = useCallback(async (): Promise<SalesMetrics> => {
        // Fetch all leads
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, status_ht, status_lt, estimated_value, source, pipeline')
            .in('pipeline', ['high_ticket', 'low_ticket']);

        if (error) throw error;

        const allLeads = leads || [];

        // Count by stage
        const leadsByStage: Record<string, number> = {};
        allLeads.forEach(lead => {
            const stage = lead.status_ht || lead.status_lt || 'unknown';
            leadsByStage[stage] = (leadsByStage[stage] || 0) + 1;
        });

        // Count by source
        const leadsBySource: Record<string, number> = {};
        allLeads.forEach(lead => {
            const source = lead.source || 'unknown';
            leadsBySource[source] = (leadsBySource[source] || 0) + 1;
        });

        // Conversion rate (leads in 'fechado' / total)
        const closedCount = leadsByStage['fechado'] || 0;
        const conversionRate = allLeads.length > 0 ? Math.round((closedCount / allLeads.length) * 100) : 0;

        // Total pipeline value
        const totalPipelineValue = allLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);

        return {
            totalLeads: allLeads.length,
            leadsByStage,
            conversionRate,
            totalPipelineValue,
            leadsBySource
        };
    }, []);

    const fetchProductionMetrics = useCallback(async (): Promise<ProductionMetrics> => {
        // Fetch all projects with assignee
        const { data: projects, error } = await supabase
            .from('projects')
            .select(`
        id, status, deadline, created_at,
        assignee:users!projects_assigned_to_fkey(name)
      `);

        if (error) throw error;

        const allProjects = projects || [];

        // Count by status
        const projectsByStatus: Record<string, number> = {
            backlog: 0,
            doing: 0,
            review: 0,
            done: 0
        };

        allProjects.forEach(project => {
            const status = project.status || 'backlog';
            projectsByStatus[status] = (projectsByStatus[status] || 0) + 1;
        });

        // Count overdue (deadline < today AND not done)
        const today = new Date();
        const overdueProjects = allProjects.filter(p => {
            if (!p.deadline || p.status === 'done') return false;
            return new Date(p.deadline) < today;
        }).length;

        // Calculate avg SLA for done projects
        const doneProjects = allProjects.filter(p => p.status === 'done');
        let avgSLADays = 0;
        if (doneProjects.length > 0) {
            const totalDays = doneProjects.reduce((sum, p) => {
                const created = new Date(p.created_at);
                const now = new Date();
                const days = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0);
            avgSLADays = Math.round(totalDays / doneProjects.length);
        }

        // Projects by member
        const memberCounts: Record<string, number> = {};
        allProjects.forEach(p => {
            const name = (p.assignee as any)?.name || 'Não atribuído';
            memberCounts[name] = (memberCounts[name] || 0) + 1;
        });

        const projectsByMember = Object.entries(memberCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            totalProjects: allProjects.length,
            projectsByStatus,
            overdueProjects,
            avgSLADays,
            projectsByMember
        };
    }, []);

    const refetch = useCallback(async () => {
        if (!sector) return;

        setLoading(true);
        setError(null);

        try {
            if (sector === 'sales') {
                const salesMetrics = await fetchSalesMetrics();
                setMetrics({ sales: salesMetrics });
            } else if (sector === 'production') {
                const productionMetrics = await fetchProductionMetrics();
                setMetrics({ production: productionMetrics });
            }
        } catch (err) {
            console.error('Failed to fetch sector metrics:', err);
            setError('Erro ao carregar métricas');
        } finally {
            setLoading(false);
        }
    }, [sector, fetchSalesMetrics, fetchProductionMetrics]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { metrics, loading, error, refetch };
}
