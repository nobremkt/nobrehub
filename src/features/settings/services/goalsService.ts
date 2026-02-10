/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOALS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Firebase service for managing production and sector goals
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const SETTINGS_DOC = 'settings/goals';

export interface VideoDurationPoints {
    '30s': number;
    '60s': number;
    '60plus': number;
}

export interface SalesGoals {
    monthlyRevenue: number;
    leadsConverted: number;
    conversionRate: number;
}

export interface PostSalesGoals {
    monthlyClients: number;
    satisfactionRate: number;
    responseTime: number;
}

export interface StrategicGoals {
    monthlyNotes: number;
    weeklyReviews: number;
}

export interface GoalsConfig {
    dailyProductionGoal: number;
    workdaysPerWeek: number;   // kept for backward compatibility with DashboardAnalyticsService
    workdaysPerMonth: number;  // kept for backward compatibility with DashboardAnalyticsService
    videoDurationPoints: VideoDurationPoints;
    salesGoals?: SalesGoals;
    postSalesGoals?: PostSalesGoals;
    strategicGoals?: StrategicGoals;
    updatedAt: Date;
}

const DEFAULT_VIDEO_DURATION_POINTS: VideoDurationPoints = {
    '30s': 1,
    '60s': 2,
    '60plus': 3
};

const DEFAULT_CONFIG: GoalsConfig = {
    dailyProductionGoal: 5,
    workdaysPerWeek: 5,
    workdaysPerMonth: 22,
    videoDurationPoints: DEFAULT_VIDEO_DURATION_POINTS,
    updatedAt: new Date()
};

export const GoalsService = {
    /**
     * Busca as configurações de metas do Firebase
     */
    async getConfig(): Promise<GoalsConfig> {
        try {
            const docRef = doc(db, SETTINGS_DOC);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    dailyProductionGoal: data.dailyProductionGoal ?? DEFAULT_CONFIG.dailyProductionGoal,
                    workdaysPerWeek: data.workdaysPerWeek ?? DEFAULT_CONFIG.workdaysPerWeek,
                    workdaysPerMonth: data.workdaysPerMonth ?? DEFAULT_CONFIG.workdaysPerMonth,
                    videoDurationPoints: data.videoDurationPoints ?? DEFAULT_VIDEO_DURATION_POINTS,
                    salesGoals: data.salesGoals ?? undefined,
                    postSalesGoals: data.postSalesGoals ?? undefined,
                    strategicGoals: data.strategicGoals ?? undefined,
                    updatedAt: data.updatedAt?.toDate?.() ?? new Date()
                };
            }

            return DEFAULT_CONFIG;
        } catch (error) {
            console.error('Error fetching goals config:', error);
            return DEFAULT_CONFIG;
        }
    },

    /**
     * Salva as configurações de metas no Firebase
     */
    async saveConfig(config: Partial<GoalsConfig>): Promise<void> {
        const docRef = doc(db, SETTINGS_DOC);

        const currentConfig = await this.getConfig();
        const newConfig = {
            ...currentConfig,
            ...config,
            updatedAt: new Date()
        };

        await setDoc(docRef, newConfig, { merge: true });
    },

    /**
     * Calcula a meta baseada no filtro de período
     */
    calculateGoalForPeriod(dailyGoal: number, period: string, workdaysPerWeek = 5, workdaysPerMonth = 22): number {
        switch (period) {
            case 'today':
            case 'yesterday':
                return dailyGoal;
            case 'week':
                return dailyGoal * workdaysPerWeek;
            case 'month':
            case 'janeiro_2026':
                return dailyGoal * workdaysPerMonth;
            case 'quarter':
                return dailyGoal * workdaysPerMonth * 3;
            case 'year':
                return dailyGoal * workdaysPerMonth * 12;
            default:
                return dailyGoal;
        }
    }
};
