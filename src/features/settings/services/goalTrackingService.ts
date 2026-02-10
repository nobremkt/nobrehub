/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOAL TRACKING SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Centralized service that computes real goal progress for all sectors.
 * Fetches configured goals from settings/goals and actual performance data
 * from Firestore, returning usable progress objects for any component.
 */

import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { GoalsService, type GoalsConfig, type SalesGoals, type PostSalesGoals, type StrategicGoals } from './goalsService';
import { HolidaysService } from './holidaysService';

const getDb = () => getFirestore();

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
    period: 'month';
    progress: SectorGoalProgress;
}

// ─── SECTOR IDS (mirrors CollaboratorProfileModal) ───────────────────────────

const SECTOR_IDS = {
    PRODUCAO: '7OhlXcRc8Vih9n7p4PdZ',
    POS_VENDAS: '2OByfKttFYPi5Cxbcs2t',
    VENDAS: 'vQIAMfIXt1xKWXHG2Scq',
    ESTRATEGICO: 'zeekJ4iY9voX3AURpar5',
};

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
        const db = getDb();

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        let progress: SectorGoalProgress;

        switch (sectorId) {
            case SECTOR_IDS.PRODUCAO:
                progress = await this._computeProductionProgress(db, collaboratorId, config, monthStart, monthEnd);
                break;
            case SECTOR_IDS.VENDAS:
                progress = await this._computeSalesProgress(db, collaboratorId, config.salesGoals, monthStart, monthEnd);
                break;
            case SECTOR_IDS.POS_VENDAS:
                progress = await this._computePostSalesProgress(db, collaboratorId, config.postSalesGoals);
                break;
            case SECTOR_IDS.ESTRATEGICO:
                progress = await this._computeStrategicProgress(db, collaboratorId, config.strategicGoals);
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
            period: 'month',
            progress,
        };
    },

    // ── Production ──────────────────────────────────────────────────────────

    async _computeProductionProgress(
        db: ReturnType<typeof getFirestore>,
        collaboratorId: string,
        config: GoalsConfig,
        monthStart: Date,
        monthEnd: Date,
    ): Promise<SectorGoalProgress> {
        // Query only this producer's projects (not the entire collection)
        const snapshot = await getDocs(query(
            collection(db, 'production_projects'),
            where('producerId', '==', collaboratorId)
        ));
        let points = 0, delivered = 0;

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            const deliveredAt = d.deliveredAt?.toDate?.() || (d.deliveredAt ? new Date(d.deliveredAt) : null);
            const createdAt = d.createdAt?.toDate?.() || (d.createdAt ? new Date(d.createdAt) : null);
            const status = d.status || '';
            const isFinished = status === 'entregue' || status === 'revisado' || status === 'concluido';
            // Use deliveredAt for date filtering when available, otherwise use createdAt for finished projects
            const relevantDate = deliveredAt || (isFinished ? createdAt : null);
            if (!relevantDate || relevantDate < monthStart || relevantDate > monthEnd) return;
            const isAlt = d.type === 'alteracao' || d.status === 'alteracao' || d.status === 'alteracao_interna' || d.status === 'alteracao_cliente';
            if (isAlt) return;
            delivered++;
            points += Number(d.points) || 1;
        });

        // Monthly goal = daily × real workdays (using HolidaysService)
        const workdays = await getWorkdaysInPeriod(monthStart, monthEnd);
        const monthlyPointsGoal = config.dailyProductionGoal * workdays;

        const goals: GoalProgress[] = [
            {
                label: 'Pontos do Mês',
                target: monthlyPointsGoal,
                actual: points,
                percentage: pct(points, monthlyPointsGoal),
                unit: 'pts',
            },
            {
                label: 'Projetos Entregues',
                target: monthlyPointsGoal > 0 ? Math.ceil(monthlyPointsGoal / 3) : 0,
                actual: delivered,
                percentage: monthlyPointsGoal > 0 ? pct(delivered, Math.ceil(monthlyPointsGoal / 3)) : 0,
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
        db: ReturnType<typeof getFirestore>,
        collaboratorId: string,
        salesGoals: SalesGoals | undefined,
        monthStart: Date,
        monthEnd: Date,
    ): Promise<SectorGoalProgress> {
        // Query only this seller's leads (not the entire collection)
        const snapshot = await getDocs(query(
            collection(db, 'leads'),
            where('responsibleId', '==', collaboratorId)
        ));
        let totalSold = 0, closed = 0, total = 0;
        const closedStatuses = ['won', 'closed', 'contracted'];
        const lostStatuses = ['lost', 'churned'];

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            const createdAt = d.createdAt?.toDate?.() || (d.createdAt ? new Date(d.createdAt) : null);
            if (!createdAt || createdAt < monthStart || createdAt > monthEnd) return;
            total++;
            if (closedStatuses.includes(d.status)) {
                closed++;
                totalSold += d.estimatedValue || 0;
            }
            if (lostStatuses.includes(d.status)) total = total; // just count
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
        db: ReturnType<typeof getFirestore>,
        collaboratorId: string,
        postSalesGoals: PostSalesGoals | undefined,
    ): Promise<SectorGoalProgress> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Query only this post-sales rep's leads
        const snapshot = await getDocs(query(
            collection(db, 'leads'),
            where('postSalesId', '==', collaboratorId)
        ));
        let clientsAttended = 0, completed = 0;

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            // Filter by current month
            const createdAt = d.createdAt?.toDate?.() || (d.createdAt ? new Date(d.createdAt) : null);
            if (!createdAt || createdAt < monthStart || createdAt > monthEnd) return;
            clientsAttended++;
            if (d.clientStatus === 'concluido') completed++;
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
        db: ReturnType<typeof getFirestore>,
        collaboratorId: string,
        strategicGoals: StrategicGoals | undefined,
    ): Promise<SectorGoalProgress> {
        // Count notes created this month by this collaborator
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let notesThisMonth = 0;

        try {
            const snapshot = await getDocs(query(
                collection(db, 'notes'),
                where('createdBy', '==', collaboratorId)
            ));
            snapshot.docs.forEach(doc => {
                const d = doc.data();
                const createdAt = d.createdAt?.toDate?.() || (d.createdAt ? new Date(d.createdAt) : null);
                if (createdAt && createdAt >= monthStart) {
                    notesThisMonth++;
                }
            });
        } catch {
            // collection may not exist
        }

        const targets = strategicGoals || { monthlyNotes: 0, weeklyReviews: 0 };

        const goals: GoalProgress[] = [
            {
                label: 'Notas Estratégicas',
                target: targets.monthlyNotes,
                actual: notesThisMonth,
                percentage: pct(notesThisMonth, targets.monthlyNotes),
                unit: 'un',
            },
        ];

        const avg = goals.length > 0
            ? Math.round(goals.reduce((a, g) => a + g.percentage, 0) / goals.length)
            : 0;

        return { sector: 'estrategico', sectorLabel: 'Estratégico', goals, overallPercentage: avg };
    },
};
