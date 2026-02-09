/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOALS STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Zustand store for goals configuration
 */

import { create } from 'zustand';
import { GoalsService, GoalsConfig, VideoDurationPoints, SalesGoals, PostSalesGoals, StrategicGoals } from '../services/goalsService';
import { toast } from 'react-toastify';

interface GoalsState {
    config: GoalsConfig | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;

    // Actions
    init: () => Promise<void>;
    setDailyGoal: (goal: number) => Promise<void>;
    setWorkdays: (perWeek: number, perMonth: number) => Promise<void>;
    setVideoDurationPoints: (points: VideoDurationPoints) => Promise<void>;
    saveSectorGoals: (sector: 'salesGoals' | 'postSalesGoals' | 'strategicGoals', data: SalesGoals | PostSalesGoals | StrategicGoals) => Promise<void>;
    calculateGoal: (period: string) => number;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
    config: null,
    isLoading: false,
    isSaving: false,
    error: null,

    init: async () => {
        if (get().config) return; // Already loaded

        set({ isLoading: true, error: null });
        try {
            const config = await GoalsService.getConfig();
            set({ config });
        } catch (error) {
            console.error('Error loading goals:', error);
            set({ error: 'Erro ao carregar configurações de metas' });
        } finally {
            set({ isLoading: false });
        }
    },

    setDailyGoal: async (goal: number) => {
        set({ isSaving: true });
        try {
            await GoalsService.saveConfig({ dailyProductionGoal: goal });
            set(state => ({
                config: state.config ? { ...state.config, dailyProductionGoal: goal } : null
            }));
            toast.success('Meta diária atualizada!');
        } catch (error) {
            console.error('Error saving daily goal:', error);
            toast.error('Erro ao salvar meta');
        } finally {
            set({ isSaving: false });
        }
    },

    setWorkdays: async (perWeek: number, perMonth: number) => {
        set({ isSaving: true });
        try {
            await GoalsService.saveConfig({
                workdaysPerWeek: perWeek,
                workdaysPerMonth: perMonth
            });
            set(state => ({
                config: state.config ? {
                    ...state.config,
                    workdaysPerWeek: perWeek,
                    workdaysPerMonth: perMonth
                } : null
            }));
            toast.success('Dias úteis atualizados!');
        } catch (error) {
            console.error('Error saving workdays:', error);
            toast.error('Erro ao salvar configuração');
        } finally {
            set({ isSaving: false });
        }
    },

    setVideoDurationPoints: async (points: VideoDurationPoints) => {
        set({ isSaving: true });
        try {
            await GoalsService.saveConfig({ videoDurationPoints: points });
            set(state => ({
                config: state.config ? { ...state.config, videoDurationPoints: points } : null
            }));
            toast.success('Pontos de vídeo atualizados!');
        } catch (error) {
            console.error('Error saving video duration points:', error);
            toast.error('Erro ao salvar configuração');
        } finally {
            set({ isSaving: false });
        }
    },

    saveSectorGoals: async (sector, data) => {
        set({ isSaving: true });
        try {
            await GoalsService.saveConfig({ [sector]: data });
            set(state => ({
                config: state.config ? { ...state.config, [sector]: data } : null
            }));
            toast.success('Metas do setor salvas!');
        } catch (error) {
            console.error('Error saving sector goals:', error);
            toast.error('Erro ao salvar metas do setor');
        } finally {
            set({ isSaving: false });
        }
    },

    calculateGoal: (period: string) => {
        const { config } = get();
        if (!config) return 100; // Default fallback

        return GoalsService.calculateGoalForPeriod(
            config.dailyProductionGoal,
            period,
            config.workdaysPerWeek,
            config.workdaysPerMonth
        );
    }
}));
