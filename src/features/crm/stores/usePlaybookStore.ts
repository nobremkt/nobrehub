/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PLAYBOOK STORE (Zustand)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Estado do playbook: atividades, progresso e seleção.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { PlaybookService } from '@/features/crm/services/PlaybookService';
import type { PlaybookActivity, PlaybookProgress } from '@/features/crm/types/playbook.types';

interface PlaybookState {
    // Data
    activities: PlaybookActivity[];
    progress: PlaybookProgress | null;
    loading: boolean;
    error: string | null;

    // Selection
    selectedActivityId: string | null;

    // Actions
    loadPlaybook: (leadId: string, pipeline?: string) => Promise<void>;
    selectActivity: (activityId: string) => void;
    toggleActivity: (leadId: string, activityId: string, pipeline?: string) => Promise<void>;
    updateScriptChecks: (leadId: string, activityId: string, checks: boolean[], pipeline?: string) => Promise<void>;
    reset: () => void;
}

export const usePlaybookStore = create<PlaybookState>((set, get) => ({
    activities: [],
    progress: null,
    loading: false,
    error: null,
    selectedActivityId: null,

    loadPlaybook: async (leadId: string, pipeline = 'high-ticket') => {
        set({ loading: true, error: null });
        try {
            const [activities, progress] = await Promise.all([
                PlaybookService.getActivities(pipeline),
                PlaybookService.getProgress(leadId, pipeline),
            ]);

            // Default selection: first incomplete activity or first activity
            const completedSet = new Set(progress?.completedActivities ?? []);
            const firstIncomplete = activities.find(a => !completedSet.has(a.id));
            const defaultId = firstIncomplete?.id ?? activities[0]?.id ?? null;

            set({
                activities,
                progress,
                selectedActivityId: defaultId,
                loading: false,
            });
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : 'Erro ao carregar playbook',
                loading: false,
            });
        }
    },

    selectActivity: (activityId: string) => {
        set({ selectedActivityId: activityId });
    },

    toggleActivity: async (leadId: string, activityId: string, pipeline = 'high-ticket') => {
        // Optimistic update
        const currentProgress = get().progress;
        const completed = new Set(currentProgress?.completedActivities ?? []);
        if (completed.has(activityId)) completed.delete(activityId);
        else completed.add(activityId);

        const optimisticProgress = currentProgress
            ? { ...currentProgress, completedActivities: Array.from(completed) }
            : {
                id: 'temp',
                leadId,
                pipeline,
                completedActivities: Array.from(completed),
                scriptChecks: {},
                updatedAt: new Date(),
            };

        set({ progress: optimisticProgress });

        try {
            const updatedProgress = await PlaybookService.toggleActivity(leadId, activityId, pipeline);
            set({ progress: updatedProgress });
        } catch (err) {
            // Rollback
            set({ progress: currentProgress, error: err instanceof Error ? err.message : 'Erro ao atualizar progresso' });
        }
    },

    updateScriptChecks: async (leadId: string, activityId: string, checks: boolean[], pipeline = 'high-ticket') => {
        // Optimistic update — update local state immediately
        const currentProgress = get().progress;
        const optimisticProgress = currentProgress
            ? {
                ...currentProgress,
                scriptChecks: {
                    ...currentProgress.scriptChecks,
                    [activityId]: checks,
                },
            }
            : {
                id: 'temp',
                leadId,
                pipeline,
                completedActivities: [],
                scriptChecks: { [activityId]: checks },
                updatedAt: new Date(),
            };

        set({ progress: optimisticProgress });

        try {
            await PlaybookService.updateScriptChecks(leadId, activityId, checks, pipeline);

            // If progress was null before, reload to get the real ID
            if (!currentProgress) {
                const realProgress = await PlaybookService.getProgress(leadId, pipeline);
                if (realProgress) set({ progress: realProgress });
            }
        } catch (err) {
            // Rollback on error
            set({ progress: currentProgress, error: err instanceof Error ? err.message : 'Erro ao atualizar checklist' });
        }
    },

    reset: () => {
        set({
            activities: [],
            progress: null,
            loading: false,
            error: null,
            selectedActivityId: null,
        });
    },
}));
