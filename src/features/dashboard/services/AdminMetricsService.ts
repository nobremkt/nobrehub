/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - ADMIN METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Calculates admin/team dashboard metrics (team size, workload, sectors)
 */

import { supabase } from '@/config/supabase';
import type { AdminMetrics, SharedData, DateFilter } from './dashboard.types';
import { PROJECTS_TABLE, getDateRange, parseDate } from './dashboard.helpers';

export const AdminMetricsService = {
    /**
     * Fetches admin metrics with full team data
     */
    getAdminMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<AdminMetrics> => {
        const { start, end } = getDateRange(filter);

        // Fetch collaborators (use shared data or fetch independently)
        const collabRows: Record<string, unknown>[] = _shared
            ? _shared.collaborators
            : (await supabase.from('users').select('*')).data || [];

        // Filter out DEBUG account from collaborators
        const filteredCollaborators = collabRows.filter(row =>
            (row.email as string) !== 'debug@debug.com'
        );
        const totalCollaborators = filteredCollaborators.length;

        // Fetch sectors for name lookups (use shared or fetch)
        const sectorsRows: Record<string, unknown>[] = _shared
            ? _shared.sectors
            : [];
        const sectorsMap: Record<string, string> = {};
        sectorsRows.forEach(row => {
            sectorsMap[row.id as string] = (row.name as string) || 'Sem Setor';
        });

        // Fetch roles for name lookups (use shared or fetch)
        const rolesRows: Record<string, unknown>[] = _shared
            ? _shared.roles
            : [];
        const rolesMap: Record<string, string> = {};
        rolesRows.forEach(row => {
            rolesMap[row.id as string] = (row.name as string) || 'Sem Cargo';
        });

        // Fetch projects for productivity calculations (use shared or fetch)
        const projectsRows: Record<string, unknown>[] = _shared
            ? _shared.projects
            : (await supabase.from(PROJECTS_TABLE).select('*')).data || [];

        // Calculate per-collaborator project stats
        const projectsByCollaborator: Record<string, { count: number; points: number }> = {};
        projectsRows.forEach(row => {
            const deliveredAt = parseDate(row.delivered_at);
            const producerId = row.producer_id as string;

            // Only count delivered projects in period
            if (producerId && deliveredAt && deliveredAt >= start && deliveredAt <= end) {
                if (!projectsByCollaborator[producerId]) {
                    projectsByCollaborator[producerId] = { count: 0, points: 0 };
                }
                projectsByCollaborator[producerId].count += 1;
                projectsByCollaborator[producerId].points += Number(row.points) || 1;
            }
        });

        // Build members array
        const members: AdminMetrics['members'] = [];
        let activeCount = 0;

        filteredCollaborators.forEach(row => {
            const isActive = row.active !== false;
            if (isActive) activeCount++;

            const id = row.id as string;
            const projectStats = projectsByCollaborator[id] || { count: 0, points: 0 };

            members.push({
                id,
                name: (row.name as string) || 'Desconhecido',
                role: rolesMap[(row.role_id as string)] || (row.role_id as string) || 'Sem Cargo',
                sector: sectorsMap[(row.sector_id as string)] || (row.sector_id as string) || 'Sem Setor',
                profilePhotoUrl: row.avatar_url as string | undefined,
                projectsDelivered: projectStats.count,
                pointsEarned: projectStats.points
            });
        });

        // Calculate sector performance
        const sectorStats: Record<string, { total: number; count: number; memberCount: number }> = {};
        members.forEach(member => {
            if (!sectorStats[member.sector]) {
                sectorStats[member.sector] = { total: 0, count: 0, memberCount: 0 };
            }
            sectorStats[member.sector].memberCount += 1;
            if (member.projectsDelivered > 0) {
                sectorStats[member.sector].total += member.pointsEarned;
                sectorStats[member.sector].count += 1;
            }
        });

        const sectors: AdminMetrics['sectors'] = Object.entries(sectorStats)
            .filter(([name]) => name !== 'Sem Setor')
            .map(([name, stats]) => ({
                name,
                productivity: stats.count > 0 ? Math.round((stats.total / stats.count)) : 0,
                trend: 'stable' as const,
                members: stats.memberCount
            }))
            .sort((a, b) => b.productivity - a.productivity);

        // Calculate productivity data (top performers)
        const productivityData = members
            .filter(m => m.projectsDelivered > 0)
            .map(m => ({
                name: m.name.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' '),
                productivity: Math.min(100, Math.round((m.pointsEarned / 100) * 100)),
                projects: m.projectsDelivered
            }))
            .sort((a, b) => b.productivity - a.productivity)
            .slice(0, 8);

        // Calculate aggregate metrics
        const totalProjects = Object.values(projectsByCollaborator).reduce((sum, p) => sum + p.count, 0);
        const avgWorkload = activeCount > 0 ? Math.round((totalProjects / activeCount) * 10) / 10 : 0;

        // Efficiency based on how many active members delivered at least 1 project
        const activeWithProjects = members.filter(m => m.projectsDelivered > 0).length;
        const efficiency = activeCount > 0 ? Math.round((activeWithProjects / activeCount) * 100) : 0;

        return {
            activeUsers: activeCount,
            totalCollaborators,
            teamSize: totalCollaborators,
            activeMembers: activeCount,
            avgWorkload,
            goalsMet: 85, // Placeholder
            efficiency,
            members,
            productivityData,
            sectors
        };
    },
};
