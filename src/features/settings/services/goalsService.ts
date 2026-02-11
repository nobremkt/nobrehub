/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOALS SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Gerencia configurações de metas de produção e setores.
 * No schema v4 Supabase, as metas individuais ficam na tabela `goals`.
 * Configurações globais (dailyProductionGoal, videoDurationPoints) são
 * armazenadas como um registro especial ou em memória com defaults.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';

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
    workdaysPerWeek: number;
    workdaysPerMonth: number;
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

/**
 * Busca config de goals como JSONB de uma tabela settings se existir,
 * senão retorna defaults. Usamos a tabela goals para metas individuais
 * e um approach simplificado para config global.
 */
export const GoalsService = {
    /**
     * Busca as configurações de metas
     * Por ora usa defaults + localStorage como cache.
     * TODO: Mover para tabela `settings` no Supabase quando criada.
     */
    async getConfig(): Promise<GoalsConfig> {
        try {
            // Tenta buscar do localStorage (cache local)
            const cached = localStorage.getItem('nobre_goals_config');
            if (cached) {
                const parsed = JSON.parse(cached);
                return {
                    ...DEFAULT_CONFIG,
                    ...parsed,
                    updatedAt: new Date(parsed.updatedAt ?? Date.now()),
                };
            }

            return DEFAULT_CONFIG;
        } catch (error) {
            console.error('Error fetching goals config:', error);
            return DEFAULT_CONFIG;
        }
    },

    /**
     * Salva as configurações de metas
     * Cache em localStorage até tabela settings ser criada.
     */
    async saveConfig(config: Partial<GoalsConfig>): Promise<void> {
        const currentConfig = await this.getConfig();
        const newConfig = {
            ...currentConfig,
            ...config,
            updatedAt: new Date()
        };

        localStorage.setItem('nobre_goals_config', JSON.stringify(newConfig));
    },

    /**
     * Busca metas individuais de um usuário para uma data
     */
    async getUserGoal(userId: string, date: string): Promise<{ dailyTarget: number; pointsDelivered: number } | null> {
        const { data, error } = await supabase
            .from('goals')
            .select('daily_target, points_delivered')
            .eq('user_id', userId)
            .eq('date', date)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        if (!data) return null;

        return {
            dailyTarget: data.daily_target ?? 0,
            pointsDelivered: data.points_delivered ?? 0,
        };
    },

    /**
     * Cria ou atualiza meta individual de um usuário
     */
    async upsertUserGoal(userId: string, date: string, dailyTarget: number, pointsDelivered?: number): Promise<void> {
        const { error } = await supabase
            .from('goals')
            .upsert({
                user_id: userId,
                date,
                daily_target: dailyTarget,
                points_delivered: pointsDelivered ?? 0,
            }, { onConflict: 'user_id,date' });

        if (error) throw error;
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
