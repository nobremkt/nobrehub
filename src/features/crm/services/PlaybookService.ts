/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PLAYBOOK SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Busca atividades/blocos do playbook e gerencia progresso por lead.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import type {
    PlaybookActivity,
    PlaybookBlock,
    PlaybookProgress,
} from '@/features/crm/types/playbook.types';

// ─── Row → Model Mappers ─────────────────────────────────────────────

function rowToBlock(row: Record<string, unknown>): PlaybookBlock {
    return {
        id: row.id as string,
        activityId: row.activity_id as string,
        blockType: row.block_type as PlaybookBlock['blockType'],
        title: (row.title as string) ?? null,
        content: row.content as string,
        order: row.order as number,
    };
}

function rowToActivity(
    row: Record<string, unknown>,
    blocks: PlaybookBlock[]
): PlaybookActivity {
    return {
        id: row.id as string,
        stageId: row.stage_id as string,
        label: row.label as string,
        activityType: row.activity_type as PlaybookActivity['activityType'],
        order: row.order as number,
        active: row.active as boolean,
        blocks,
    };
}

function rowToProgress(row: Record<string, unknown>): PlaybookProgress {
    return {
        id: row.id as string,
        leadId: row.lead_id as string,
        pipeline: row.pipeline as string,
        completedActivities: (row.completed_activities as string[]) ?? [],
        scriptChecks: (row.script_checks as Record<string, boolean[]>) ?? {},
        updatedAt: new Date(row.updated_at as string),
    };
}

// ─── Service ─────────────────────────────────────────────────────────

export const PlaybookService = {
    // ═══════════════════════════════════════════════════════════════════
    // ACTIVITIES & BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Fetch all active activities for a pipeline, with blocks included.
     * Groups by pipeline stages.
     */
    getActivities: async (pipeline: string = 'high-ticket'): Promise<PlaybookActivity[]> => {
        // 1. Get stage IDs for the pipeline
        const { data: stages, error: stagesError } = await supabase
            .from('pipeline_stages')
            .select('id')
            .eq('pipeline', pipeline)
            .order('order');

        if (stagesError) throw stagesError;
        if (!stages || stages.length === 0) return [];

        const stageIds = stages.map(s => s.id);

        // 2. Fetch activities for those stages
        const { data: activities, error: activitiesError } = await supabase
            .from('playbook_activities')
            .select('*')
            .in('stage_id', stageIds)
            .eq('active', true)
            .order('order');

        if (activitiesError) throw activitiesError;
        if (!activities || activities.length === 0) return [];

        // 3. Fetch all blocks for these activities
        const activityIds = activities.map(a => a.id);
        const { data: blocks, error: blocksError } = await supabase
            .from('playbook_blocks')
            .select('*')
            .in('activity_id', activityIds)
            .order('order');

        if (blocksError) throw blocksError;

        // 4. Group blocks by activity
        const blocksByActivity = new Map<string, PlaybookBlock[]>();
        (blocks ?? []).forEach(b => {
            const mapped = rowToBlock(b as unknown as Record<string, unknown>);
            const list = blocksByActivity.get(mapped.activityId) ?? [];
            list.push(mapped);
            blocksByActivity.set(mapped.activityId, list);
        });

        // 5. Assemble + sort by stage order, then activity order
        const stageOrder = new Map(stageIds.map((id, idx) => [id, idx]));
        return activities
            .map(a => rowToActivity(
                a as unknown as Record<string, unknown>,
                blocksByActivity.get(a.id) ?? []
            ))
            .sort((a, b) => {
                const stageA = stageOrder.get(a.stageId) ?? 999;
                const stageB = stageOrder.get(b.stageId) ?? 999;
                if (stageA !== stageB) return stageA - stageB;
                return a.order - b.order;
            });
    },

    // ═══════════════════════════════════════════════════════════════════
    // PROGRESS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Get playbook progress for a specific lead.
     */
    getProgress: async (
        leadId: string,
        pipeline: string = 'high-ticket'
    ): Promise<PlaybookProgress | null> => {
        const { data, error } = await supabase
            .from('playbook_progress')
            .select('*')
            .eq('lead_id', leadId)
            .eq('pipeline', pipeline)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return rowToProgress(data as unknown as Record<string, unknown>);
    },

    /**
     * Toggle activity completion for a lead.
     * Returns the updated progress.
     */
    toggleActivity: async (
        leadId: string,
        activityId: string,
        pipeline: string = 'high-ticket'
    ): Promise<PlaybookProgress> => {
        // Get or create progress
        let progress = await PlaybookService.getProgress(leadId, pipeline);

        if (!progress) {
            // Create new progress record
            const { data, error } = await supabase
                .from('playbook_progress')
                .insert({
                    lead_id: leadId,
                    pipeline,
                    completed_activities: [activityId],
                    script_checks: {},
                })
                .select('*')
                .single();

            if (error) throw error;
            return rowToProgress(data as unknown as Record<string, unknown>);
        }

        // Toggle
        const completed = new Set(progress.completedActivities);
        if (completed.has(activityId)) {
            completed.delete(activityId);
        } else {
            completed.add(activityId);
        }

        const { data, error } = await supabase
            .from('playbook_progress')
            .update({
                completed_activities: Array.from(completed),
                updated_at: new Date().toISOString(),
            })
            .eq('id', progress.id)
            .select('*')
            .single();

        if (error) throw error;
        return rowToProgress(data as unknown as Record<string, unknown>);
    },

    /**
     * Update checklist checks for a specific activity block.
     */
    updateScriptChecks: async (
        leadId: string,
        activityId: string,
        checks: boolean[],
        pipeline: string = 'high-ticket'
    ): Promise<void> => {
        let progress = await PlaybookService.getProgress(leadId, pipeline);

        if (!progress) {
            // Create new progress record
            const { error } = await supabase
                .from('playbook_progress')
                .insert({
                    lead_id: leadId,
                    pipeline,
                    completed_activities: [],
                    script_checks: { [activityId]: checks },
                });

            if (error) throw error;
            return;
        }

        const updatedChecks = {
            ...progress.scriptChecks,
            [activityId]: checks,
        };

        const { error } = await supabase
            .from('playbook_progress')
            .update({
                script_checks: updatedChecks,
                updated_at: new Date().toISOString(),
            })
            .eq('id', progress.id);

        if (error) throw error;
    },
};
