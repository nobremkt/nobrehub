/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOAL TRACKING SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Centralized service that computes real goal progress for all sectors.
 * Fetches configured goals from settings/goals and actual performance data
 * from Supabase, returning usable progress objects for any component.
 */

import { supabase } from '@/config/supabase';
import { GoalsService, type GoalsConfig, type SalesGoals, type PostSalesGoals, type StrategicGoals } from './goalsService';
import { HolidaysService } from './holidaysService';

// ─── Lightweight types for tables not in generated schema ────────────────────

interface StrategicProjectRow {
    id: string;
    owner_id: string;
}

interface StrategicTaskRow {
    id: string;
    project_id: string;
}

// ─── Exported types ──────────────────────────────────────────────────────────

export interface GoalProgress {
    label: string;
    target: number;
    actual: number;
    percentage: number;   // 0-100+
    unit: string;         // 'pts', 'R$', '%', 'dias', 'un'
}

export interface SectorGoalProgress {
    sector: 'producao' | 'vendas' | 'pos-vendas' | 'estrategico';
    sectorLabel: string;
    goals: GoalProgress[];
    overallPercentage: number;
}

export interface CollaboratorGoalSummary {
    collaboratorId: string;
    sectorId: string;
    period: 'week' | 'month';
    progress: SectorGoalProgress;
}

// ─── SECTOR IDS (from centralized constants) ────────────────────────────────

import { SECTOR_IDS } from '@/config/constants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(actual: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(Math.round((actual / target) * 100), 999);
}

/** Calculate real workdays in a period, excluding weekends and holidays */
async function getWorkdaysInPeriod(startDate: Date, endDate: Date): Promise<number> {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const holidayDates = new Set<string>();

    for (let year = startYear; year <= endYear; year++) {
        try {
            const holidays = await HolidaysService.getAllHolidays(year);
            holidays.forEach(h => holidayDates.add(h.date));
        } catch {
            // holidays may not be configured
        }
    }

    let workdays = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
        const dayOfWeek = current.getDay();
        const dateStr = current.toISOString().split('T')[0];
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidayDates.has(dateStr)) {
            workdays++;
        }
        current.setDate(current.getDate() + 1);
    }

    return workdays;
}

// ─── Core service ────────────────────────────────────────────────────────────

export const GoalTrackingService = {
    /**
     * Load the goals config once — callers can cache this.
     */
    async getGoalsConfig(): Promise<GoalsConfig> {
        return GoalsService.getConfig();
    },

    /**
     * Compute goal progress for a specific collaborator + sector.
     * This is the MAIN function other components should use.
     */
    async getCollaboratorProgress(
        collaboratorId: string,
        sectorId: string,
    ): Promise<CollaboratorGoalSummary> {
        const config = await GoalsService.getConfig();

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Production uses WEEKLY period (Mon-Fri of current week)
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4); // Friday
        weekEnd.setHours(23, 59, 59, 999);

        let progress: SectorGoalProgress;

        switch (sectorId) {
            case SECTOR_IDS.PRODUCAO:
                progress = await this._computeProductionProgress(collaboratorId, config, weekStart, weekEnd);
                break;
            case SECTOR_IDS.VENDAS:
                progress = await this._computeSalesProgress(collaboratorId, config.salesGoals, monthStart, monthEnd);
                break;
            case SECTOR_IDS.POS_VENDAS:
                progress = await this._computePostSalesProgress(collaboratorId, config.postSalesGoals);
                break;
            case SECTOR_IDS.ESTRATEGICO:
                progress = await this._computeStrategicProgress(collaboratorId, config.strategicGoals);
                break;
            default:
                progress = {
                    sector: 'producao',
                    sectorLabel: 'Desconhecido',
                    goals: [],
                    overallPercentage: 0,
                };
        }

        return {
            collaboratorId,
            sectorId,
            period: sectorId === SECTOR_IDS.PRODUCAO ? 'week' : 'month',
            progress,
        };
    },

    // ── Production ──────────────────────────────────────────────────────────

    async _computeProductionProgress(
        collaboratorId: string,
        config: GoalsConfig,
        weekStart: Date,
        weekEnd: Date,
    ): Promise<SectorGoalProgress> {
        const { data, error } = await supabase
            .from('projects')
            .select('status, created_at, delivered_at, total_points, base_points')
            .eq('producer_id', collaboratorId)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString());

        if (error) throw error;

        let points = 0;
        let delivered = 0;

        (data ?? []).forEach((d) => {
            const deliveredAt = d.delivered_at ? new Date(d.delivered_at) : null;
            const createdAt = d.created_at ? new Date(d.created_at) : null;
            const status = d.status || '';
            const isFinished = status === 'entregue' || status === 'revisado' || status === 'concluido';
            const relevantDate = deliveredAt || (isFinished ? createdAt : null);
            if (!relevantDate || relevantDate < weekStart || relevantDate > weekEnd) return;

            const isAlt = status === 'alteracao' || status === 'alteracao_interna' || status === 'alteracao_cliente';
            if (isAlt) return;

            delivered++;
            points += Number(d.total_points ?? d.base_points ?? 1) || 1;
        });

        // Weekly goal = daily × real workdays in this week (using HolidaysService)
        const workdays = await getWorkdaysInPeriod(weekStart, weekEnd);
        const weeklyPointsGoal = config.dailyProductionGoal * workdays;

        const goals: GoalProgress[] = [
            {
                label: 'Pontos da Semana',
                target: weeklyPointsGoal,
                actual: points,
                percentage: pct(points, weeklyPointsGoal),
                unit: 'pts',
            },
            {
                label: 'Projetos Entregues',
                target: weeklyPointsGoal > 0 ? Math.ceil(weeklyPointsGoal / 3) : 0,
                actual: delivered,
                percentage: weeklyPointsGoal > 0 ? pct(delivered, Math.ceil(weeklyPointsGoal / 3)) : 0,
                unit: 'un',
            },
        ];

        const avg = goals.length > 0
            ? Math.round(goals.reduce((a, g) => a + g.percentage, 0) / goals.length)
            : 0;

        return { sector: 'producao', sectorLabel: 'Produção', goals, overallPercentage: avg };
    },

    // ── Sales ────────────────────────────────────────────────────────────────

    async _computeSalesProgress(
        collaboratorId: string,
        salesGoals: SalesGoals | undefined,
        monthStart: Date,
        monthEnd: Date,
    ): Promise<SectorGoalProgress> {
        const { data, error } = await supabase
            .from('leads')
            .select('created_at, deal_status, deal_value, estimated_value')
            .eq('responsible_id', collaboratorId)
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString());

        if (error) throw error;

        let totalSold = 0;
        let closed = 0;
        let total = 0;

        const closedStatuses = ['won', 'closed', 'contracted'];
        const lostStatuses = ['lost', 'churned'];

        (data ?? []).forEach((d) => {
            const createdAt = d.created_at ? new Date(d.created_at) : null;
            if (!createdAt || createdAt < monthStart || createdAt > monthEnd) return;

            const status = d.deal_status || 'open';
            total++;

            if (closedStatuses.includes(status)) {
                closed++;
                totalSold += Number(d.deal_value ?? d.estimated_value ?? 0);
            }

            if (lostStatuses.includes(status)) total = total; // just count
        });

        const targets = salesGoals || { monthlyRevenue: 0, leadsConverted: 0, conversionRate: 0 };
        const actualConversion = total > 0 ? Math.round((closed / total) * 100) : 0;

        const goals: GoalProgress[] = [
            {
                label: 'Faturamento',
                target: targets.monthlyRevenue,
                actual: totalSold,
                percentage: pct(totalSold, targets.monthlyRevenue),
                unit: 'R$',
            },
            {
                label: 'Leads Convertidos',
                target: targets.leadsConverted,
                actual: closed,
                percentage: pct(closed, targets.leadsConverted),
                unit: 'un',
            },
            {
                label: 'Taxa de Conversão',
                target: targets.conversionRate,
                actual: actualConversion,
                percentage: pct(actualConversion, targets.conversionRate),
                unit: '%',
            },
        ];

        const avg = goals.length > 0
            ? Math.round(goals.reduce((a, g) => a + g.percentage, 0) / goals.length)
            : 0;

        return { sector: 'vendas', sectorLabel: 'Vendas', goals, overallPercentage: avg };
    },

    // ── Post-Sales ──────────────────────────────────────────────────────────

    async _computePostSalesProgress(
        collaboratorId: string,
        postSalesGoals: PostSalesGoals | undefined,
    ): Promise<SectorGoalProgress> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const { data, error } = await supabase
            .from('leads')
            .select('created_at, client_status')
            .eq('post_sales_id', collaboratorId)
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString());

        if (error) throw error;

        let clientsAttended = 0;
        let completed = 0;

        (data ?? []).forEach((d) => {
            const createdAt = d.created_at ? new Date(d.created_at) : null;
            if (!createdAt || createdAt < monthStart || createdAt > monthEnd) return;

            clientsAttended++;
            if (d.client_status === 'concluido') completed++;
        });

        const targets = postSalesGoals || { monthlyClients: 0, satisfactionRate: 0, responseTime: 0 };

        const goals: GoalProgress[] = [
            {
                label: 'Clientes Atendidos',
                target: targets.monthlyClients,
                actual: clientsAttended,
                percentage: pct(clientsAttended, targets.monthlyClients),
                unit: 'un',
            },
            {
                label: 'Projetos Concluídos',
                target: targets.monthlyClients > 0 ? targets.monthlyClients : 0,
                actual: completed,
                percentage: targets.monthlyClients > 0 ? pct(completed, targets.monthlyClients) : 0,
                unit: 'un',
            },
        ];

        const avg = goals.length > 0
            ? Math.round(goals.reduce((a, g) => a + g.percentage, 0) / goals.length)
            : 0;

        return { sector: 'pos-vendas', sectorLabel: 'Pós-Vendas', goals, overallPercentage: avg };
    },

    // ── Strategic ───────────────────────────────────────────────────────────

    async _computeStrategicProgress(
        collaboratorId: string,
        strategicGoals: StrategicGoals | undefined,
    ): Promise<SectorGoalProgress> {
        let strategicTasksCount = 0;

        try {
            const { data: projects, error: projectsError } = await supabase
                .from('strategic_projects' as 'conversations') // table not in generated types
                .select('id, owner_id')
                .eq('owner_id', collaboratorId) as unknown as { data: StrategicProjectRow[] | null; error: Error | null };

            if (projectsError) throw projectsError;

            const projectIds = (projects || []).map((p) => p.id).filter(Boolean);

            if (projectIds.length > 0) {
                const { data: tasks, error: tasksError } = await supabase
                    .from('strategic_tasks' as 'conversations') // table not in generated types
                    .select('id, project_id')
                    .in('project_id', projectIds) as unknown as { data: StrategicTaskRow[] | null; error: Error | null };

                if (tasksError) throw tasksError;
                strategicTasksCount = (tasks || []).length;
            }
        } catch {
            // strategic tables may not exist in generated types or environment
        }

        const targets = strategicGoals || { monthlyNotes: 0, weeklyReviews: 0 };

        const goals: GoalProgress[] = [
            {
                label: 'Notas Estratégicas',
                target: targets.monthlyNotes,
                actual: strategicTasksCount,
                percentage: pct(strategicTasksCount, targets.monthlyNotes),
                unit: 'un',
            },
        ];

        const avg = goals.length > 0
            ? Math.round(goals.reduce((a, g) => a + g.percentage, 0) / goals.length)
            : 0;

        return { sector: 'estrategico', sectorLabel: 'Estratégico', goals, overallPercentage: avg };
    },
};
