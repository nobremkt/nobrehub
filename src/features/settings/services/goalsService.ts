/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOALS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Firebase service for managing production goals
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const SETTINGS_DOC = 'settings/goals';

export interface GoalsConfig {
    dailyProductionGoal: number; // Meta diária em pontos
    workdaysPerWeek: number; // Dias úteis por semana (padrão 5)
    workdaysPerMonth: number; // Dias úteis estimados por mês (padrão 22)
    updatedAt: Date;
}

const DEFAULT_CONFIG: GoalsConfig = {
    dailyProductionGoal: 100,
    workdaysPerWeek: 5,
    workdaysPerMonth: 22,
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
