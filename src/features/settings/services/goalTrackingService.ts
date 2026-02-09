/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOAL TRACKING SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Centralized service that computes real goal progress for all sectors.
 * Fetches configured goals from settings/goals and actual performance data
 * from Firestore, returning usable progress objects for any component.
 */

import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { GoalsService, type GoalsConfig, type SalesGoals, type PostSalesGoals, type StrategicGoals } from './goalsService';

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

// ─── Helper ──────────────────────────────────────────────────────────────────

function pct(actual: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(Math.round((actual / target) * 100), 999);
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
        const snapshot = await getDocs(collection(db, 'projects'));
        let points = 0, delivered = 0;

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            if (d.producerId !== collaboratorId) return;
            const deliveredAt = d.deliveredAt?.toDate?.() || (d.deliveredAt ? new Date(d.deliveredAt) : null);
            if (!deliveredAt || deliveredAt < monthStart || deliveredAt > monthEnd) return;
            const isAlt = d.type === 'alteracao' || d.status === 'alteracao';
            if (isAlt) return;
            delivered++;
            points += Number(d.points) || 1;
        });

        // Monthly goal = daily × 22 workdays
        const monthlyPointsGoal = config.dailyProductionGoal * (config.workdaysPerMonth || 22);

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
        const snapshot = await getDocs(collection(db, 'leads'));
        let totalSold = 0, closed = 0, total = 0;
        const closedStatuses = ['won', 'closed', 'contracted'];
        const lostStatuses = ['lost', 'churned'];

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            if (d.responsibleId !== collaboratorId) return;
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
        const snapshot = await getDocs(collection(db, 'leads'));
        let clientsAttended = 0, completed = 0;

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            if (d.postSalesId !== collaboratorId) return;
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
        _collaboratorId: string,
        strategicGoals: StrategicGoals | undefined,
    ): Promise<SectorGoalProgress> {
        // Count notes created this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let notesThisMonth = 0;

        try {
            const snapshot = await getDocs(collection(db, 'strategic_notes'));
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
