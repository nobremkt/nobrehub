/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INBOX DISTRIBUTION SERVICE — round-robin lead distribution
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';

export const InboxDistributionService = {
    /**
     * Get lead distribution settings.
     */
    getDistributionSettings: async (): Promise<{
        enabled: boolean;
        mode: 'auto' | 'manual';
        participants: string[];
    }> => {
        const { data, error } = await (supabase as any)
            .from('settings')
            .select('value')
            .eq('key', 'leadDistribution')
            .maybeSingle();

        if (error || !data) {
            return { enabled: false, mode: 'manual', participants: [] };
        }

        const settings = typeof (data as any).value === 'string'
            ? JSON.parse((data as any).value)
            : (data as any).value;
        return settings as { enabled: boolean; mode: 'auto' | 'manual'; participants: string[] };
    },

    /**
     * Save lead distribution settings.
     */
    saveDistributionSettings: async (settings: {
        enabled: boolean;
        mode: 'auto' | 'manual';
        participants: string[];
    }): Promise<void> => {
        await (supabase as any)
            .from('settings')
            .upsert({
                key: 'leadDistribution',
                value: settings,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });
    },

    /**
     * Get count of active (open) leads per collaborator.
     */
    getActiveLeadsCount: async (): Promise<Record<string, number>> => {
        const { data, error } = await supabase
            .from('conversations')
            .select('assigned_to')
            .neq('status', 'closed');

        if (error) throw error;

        const counts: Record<string, number> = {};
        (data || []).forEach((row) => {
            if (row.assigned_to) {
                counts[row.assigned_to] = (counts[row.assigned_to] || 0) + 1;
            }
        });

        return counts;
    },

    /**
     * Get the next collaborator to assign based on "Least Loaded" strategy.
     */
    getNextCollaborator: async (participants: string[]): Promise<string | null> => {
        if (!participants || participants.length === 0) return null;

        const counts = await InboxDistributionService.getActiveLeadsCount();

        const participantCounts = participants.map(id => ({
            id,
            count: counts[id] || 0
        }));

        participantCounts.sort((a, b) => a.count - b.count);
        return participantCounts[0]?.id || null;
    },

    /**
     * Distribute all unassigned leads to participants.
     */
    distributeUnassignedLeads: async (
        assignConversation: (id: string, userId: string | null, updatedBy?: string) => Promise<void>
    ): Promise<{ distributed: number; errors: number }> => {
        const settings = await InboxDistributionService.getDistributionSettings();

        if (!settings.enabled || settings.participants.length === 0) {
            return { distributed: 0, errors: 0 };
        }

        const { data, error } = await supabase
            .from('conversations')
            .select('id')
            .neq('status', 'closed')
            .is('assigned_to', null);

        if (error) throw error;

        const unassigned = (data || []).map(row => row.id);
        let distributed = 0;
        let errors = 0;

        for (const conversationId of unassigned) {
            try {
                const nextCollaborator = await InboxDistributionService.getNextCollaborator(settings.participants);
                if (nextCollaborator) {
                    await assignConversation(conversationId, nextCollaborator);
                    distributed++;
                }
            } catch (err) {
                console.error(`Error distributing conversation ${conversationId}:`, err);
                errors++;
            }
        }

        return { distributed, errors };
    },
};
