/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PRODUCTION METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Calculates production-specific dashboard metrics (deliveries, goals, rankings)
 */

import { supabase } from '@/config/supabase';
import type { InternalProject, ProductionMetrics, SharedData } from './dashboard.types';
import type { DateFilter } from './dashboard.types';
import {
    PROJECTS_TABLE, CATEGORY_COLORS,
    getDateRange, getGoalDateRange, parseDate,
    getCollaboratorsData, getGoalConfig, calculateGoalForPeriod,
} from './dashboard.helpers';

export const ProductionMetricsService = {
    /**
     * Fetches all projects and calculates production dashboard metrics
     */
    getMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<ProductionMetrics> => {
        const { start, end } = getDateRange(filter);

        // Fetch collaborators for name resolution, photos, and producer count
        const { nameMap: collaboratorsMap, photoMap: collaboratorsPhotoMap, producerCount } = await getCollaboratorsData(_shared);

        // Fetch all projects — Supabase has a 1000-row default limit, so paginate
        let projectRows: Record<string, unknown>[] = [];
        if (_shared) {
            projectRows = _shared.projects;
        } else {
            const PAGE_SIZE = 1000;
            let from = 0;
            let hasMore = true;
            while (hasMore) {
                const { data } = await supabase.from(PROJECTS_TABLE).select('*').range(from, from + PAGE_SIZE - 1);
                const rows = data || [];
                projectRows.push(...rows);
                hasMore = rows.length === PAGE_SIZE;
                from += PAGE_SIZE;
            }
        }

        const allProjects: InternalProject[] = projectRows.map(row => ({
            id: row.id as string,
            title: (row.name as string) || (row.title as string) || '',
            producerId: (row.producer_id as string) || '',
            producerName: collaboratorsMap[(row.producer_id as string)] || 'Desconhecido',
            category: (row.product_type as string) || 'Outro',
            difficulty: row.difficulty as string | undefined,
            points: Number(row.base_points) || Number(row.points) || 0,
            status: (row.status as string) || 'entregue',
            type: row.type as string | undefined,
            motivo: row.motivo as string | undefined,
            deliveredAt: parseDate(row.delivered_at),
            createdAt: parseDate(row.created_at) || new Date(),
            isHistorical: (row.source as string) === 'historical' || (row.is_historical as boolean) || false,
            internalRevisionCount: Number(row.internal_revision_count) || 0,
        }));

        // Filter by type: exclude alteracoes from main projects count
        const isAlteracao = (p: InternalProject) =>
            (p.internalRevisionCount || 0) > 0 || p.type === 'alteracao' || p.status === 'alteracao' || p.status === 'alteracao_interna' || p.status === 'alteracao_cliente';
        const projects = allProjects.filter(p => !isAlteracao(p));
        const alteracoes = allProjects.filter(p => isAlteracao(p));

        // Filter projects by date range
        const projectsInPeriod = projects.filter(p => {
            const relevantDate = p.deliveredAt || p.createdAt;
            return relevantDate >= start && relevantDate <= end;
        });

        const alteracoesInPeriod = alteracoes.filter(a => {
            const relevantDate = a.deliveredAt || a.createdAt;
            return relevantDate >= start && relevantDate <= end;
        });

        // Delivered projects in period
        const deliveredProjects = projectsInPeriod.filter(p =>
            p.deliveredAt || p.status === 'entregue' || p.status === 'revisado' || p.status === 'concluido' || p.isHistorical
        );
        const deliveredCount = deliveredProjects.length;

        // Total points in period
        const totalPointsInPeriod = deliveredProjects.reduce((sum, p) => sum + p.points, 0);

        // Get producer count (sector Produção, excluding Líder role)
        const producersForGoal = Math.max(producerCount, 1);

        // Fetch goal from settings
        const goalConfig = await getGoalConfig();
        const goalPeriod = getGoalDateRange(filter);
        const individualGoalForPeriod = await calculateGoalForPeriod(goalConfig, filter, goalPeriod.start, goalPeriod.end);
        const goalTarget = individualGoalForPeriod * producersForGoal;
        const goalPercentage = goalTarget > 0 ? Math.round((totalPointsInPeriod / goalTarget) * 100) : 0;
        const goalStatus: 'below' | 'on-track' | 'above' =
            goalPercentage >= 100 ? 'above' : goalPercentage >= 50 ? 'on-track' : 'below';

        // Category distribution
        const categoryMap: Record<string, number> = {};
        projectsInPeriod.forEach(p => {
            const category = p.category || 'Outro';
            categoryMap[category] = (categoryMap[category] || 0) + 1;
        });
        const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value,
            color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Outro']
        }));

        // Producer ranking by POINTS
        const producerPointsMap: Record<string, { id: string; name: string; points: number; count: number }> = {};
        deliveredProjects.forEach(p => {
            if (!producerPointsMap[p.producerId]) {
                producerPointsMap[p.producerId] = { id: p.producerId, name: p.producerName || 'Desconhecido', points: 0, count: 0 };
            }
            producerPointsMap[p.producerId].points += p.points;
            producerPointsMap[p.producerId].count += 1;
        });
        const producerRanking = Object.values(producerPointsMap)
            .sort((a, b) => b.points - a.points)
            .slice(0, 7);

        // Alterations ranking
        const alterationsMap: Record<string, { name: string; count: number }> = {};
        alteracoesInPeriod.forEach(a => {
            if (!alterationsMap[a.producerId]) {
                alterationsMap[a.producerId] = { name: a.producerName || 'Desconhecido', count: 0 };
            }
            alterationsMap[a.producerId].count += 1;
        });
        const alterationsRanking = Object.values(alterationsMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Summary cards
        const activeProjects = projects.filter(p => !p.deliveredAt && !p.isHistorical);
        const totalActiveProjects = activeProjects.length;
        const pendingRevisions = projects.filter(p => p.status === 'a-revisar').length;
        const totalAlterations = alteracoesInPeriod.length;
        const activeProducers = producersForGoal;

        // Calculate per-producer delivery times
        const producerDeliveryTimes: Record<string, { id: string; name: string; totalDays: number; deliveryCount: number }> = {};
        deliveredProjects.forEach(p => {
            if (p.deliveredAt && p.createdAt) {
                const days = Math.max(0, Math.ceil((p.deliveredAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                if (!producerDeliveryTimes[p.producerId]) {
                    producerDeliveryTimes[p.producerId] = { id: p.producerId, name: p.producerName || 'Desconhecido', totalDays: 0, deliveryCount: 0 };
                }
                producerDeliveryTimes[p.producerId].totalDays += days;
                producerDeliveryTimes[p.producerId].deliveryCount += 1;
            }
        });

        // Calculate per-producer alterations for approval rate
        const producerAlterations: Record<string, number> = {};
        alteracoesInPeriod.forEach(a => {
            producerAlterations[a.producerId] = (producerAlterations[a.producerId] || 0) + 1;
        });

        // Highlights - MVP (most points) with all stats
        const mvpEntry = producerRanking[0];
        let mvpProducer = null;
        if (mvpEntry) {
            const mvpDeliveryData = producerDeliveryTimes[mvpEntry.id];
            const mvpAlterations = producerAlterations[mvpEntry.id] || 0;
            const mvpAvgDays = mvpDeliveryData && mvpDeliveryData.deliveryCount > 0
                ? Math.round(mvpDeliveryData.totalDays / mvpDeliveryData.deliveryCount)
                : 0;
            const totalProductions = mvpEntry.count + mvpAlterations;
            const mvpApprovalRate = totalProductions > 0
                ? Math.round((mvpEntry.count / totalProductions) * 100)
                : 100;

            mvpProducer = {
                name: mvpEntry.name,
                projects: mvpEntry.count,
                points: mvpEntry.points,
                avgDays: mvpAvgDays,
                approvalRate: mvpApprovalRate,
                profilePhotoUrl: collaboratorsPhotoMap[mvpEntry.id] || undefined
            };
        }

        // Top points producer (same as MVP for now)
        const topPointsProducer = mvpEntry
            ? { name: mvpEntry.name, points: mvpEntry.points, profilePhotoUrl: collaboratorsPhotoMap[mvpEntry.id] || undefined }
            : null;

        // Top projects producer (by count)
        const topProjectsEntry = Object.values(producerPointsMap)
            .sort((a, b) => b.count - a.count)[0];
        const topProjectsProducer = topProjectsEntry
            ? { name: topProjectsEntry.name, count: topProjectsEntry.count, profilePhotoUrl: collaboratorsPhotoMap[topProjectsEntry.id] || undefined }
            : null;

        // Rocket (record for most POINTS in a SINGLE day)
        const dailyPointsRecords: Record<string, { id: string; name: string; date: string; points: number }> = {};
        const filterMonthStart = new Date(start.getFullYear(), start.getMonth(), 1);
        const filterMonthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

        const monthProjects = projects.filter((p: InternalProject) => {
            const deliveryDate = p.deliveredAt;
            return deliveryDate && deliveryDate >= filterMonthStart && deliveryDate <= filterMonthEnd;
        });

        monthProjects.forEach(p => {
            if (p.deliveredAt) {
                const dateKey = p.deliveredAt.toISOString().split('T')[0];
                const recordKey = `${p.producerId}_${dateKey}`;

                if (!dailyPointsRecords[recordKey]) {
                    dailyPointsRecords[recordKey] = {
                        id: p.producerId,
                        name: p.producerName || 'Desconhecido',
                        date: dateKey,
                        points: 0
                    };
                }
                dailyPointsRecords[recordKey].points += p.points;
            }
        });

        const rocketEntry = Object.values(dailyPointsRecords)
            .sort((a, b) => b.points - a.points)[0];
        const rocketProducer = rocketEntry
            ? {
                name: rocketEntry.name,
                points: rocketEntry.points,
                inDays: 1,
                profilePhotoUrl: collaboratorsPhotoMap[rocketEntry.id] || undefined
            }
            : null;

        // Finisher (record for most PROJECTS delivered in a SINGLE day)
        const dailyProjectRecords: Record<string, { id: string; name: string; date: string; count: number }> = {};

        monthProjects.forEach(p => {
            if (p.deliveredAt) {
                const dateKey = p.deliveredAt.toISOString().split('T')[0];
                const recordKey = `${p.producerId}_${dateKey}`;

                if (!dailyProjectRecords[recordKey]) {
                    dailyProjectRecords[recordKey] = {
                        id: p.producerId,
                        name: p.producerName || 'Desconhecido',
                        date: dateKey,
                        count: 0
                    };
                }
                dailyProjectRecords[recordKey].count += 1;
            }
        });

        const finisherEntry = Object.values(dailyProjectRecords)
            .sort((a, b) => b.count - a.count)[0];
        const finisherProducer = finisherEntry
            ? {
                name: finisherEntry.name,
                count: finisherEntry.count,
                inDays: 1,
                profilePhotoUrl: collaboratorsPhotoMap[finisherEntry.id] || undefined
            }
            : null;

        return {
            deliveredProjects: deliveredCount,
            goalTarget,
            goalPercentage,
            goalStatus,
            categoryDistribution,
            producerRanking,
            alterationsRanking,
            totalActiveProjects,
            pendingRevisions,
            totalAlterations,
            activeProducers,
            totalPoints: totalPointsInPeriod,
            mvpProducer,
            topPointsProducer,
            topProjectsProducer,
            rocketProducer,
            finisherProducer
        };
    },
};
