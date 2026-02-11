/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PROJECT STATUS PAGE SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Manages public-facing project status pages.
 * Reads from the `projects` table and resolves team info from `users` + `leads`.
 * No separate `project_status_pages` table — all data comes from `projects`.
 */

import { supabase } from '@/config/supabase';
import { ProjectStatus } from '@/types/project.types';

const PUBLIC_STATUS_BASE_PATH = '/status/projeto';

export interface PublicProjectStatus {
    token: string;
    projectId: string;
    statusPageUrl: string;
    projectName: string;
    leadName: string;
    sellerName?: string;
    sellerPhotoUrl?: string;
    producerName?: string;
    producerPhotoUrl?: string;
    postSalesName?: string;
    postSalesPhotoUrl?: string;
    status: ProjectStatus;
    dueDate?: Date;
    deliveredToClientAt?: Date;
    updatedAt?: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const normalizeToken = (token: string): string => token.trim();

const getBasePublicUrl = (): string => {
    const envBase = (import.meta.env.VITE_PUBLIC_APP_URL || import.meta.env.VITE_APP_URL || '').trim();
    if (envBase) {
        return envBase.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, '');
    }

    return '';
};

const buildStatusPagePath = (token: string): string => `${PUBLIC_STATUS_BASE_PATH}/${normalizeToken(token)}`;

const buildStatusPageUrl = (token: string): string => {
    const path = buildStatusPagePath(token);
    const base = getBasePublicUrl();
    return base ? `${base}${path}` : path;
};

const generateToken = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(18);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 18)}`;
};

/** Map a project row to PublicProjectStatus */
function rowToPublicStatus(row: any): PublicProjectStatus | null {
    if (!row) return null;

    return {
        token: row.status_page_token || '',
        projectId: row.id,
        statusPageUrl: row.status_page_url || '',
        projectName: row.name || 'Projeto sem nome',
        leadName: row.lead_name || 'Cliente',
        producerName: row.producer_name || undefined,
        postSalesName: row.post_sales_name || undefined,
        status: row.status as ProjectStatus,
        dueDate: row.due_date ? new Date(row.due_date) : undefined,
        deliveredToClientAt: row.delivered_to_client_at ? new Date(row.delivered_to_client_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
}

// ─── Service ─────────────────────────────────────────────────────────

export const ProjectStatusPageService = {
    generateToken,
    buildStatusPagePath,
    buildStatusPageUrl,

    /**
     * Creates/ensures the status page identity for a project.
     * Writes the token/URL to the project row if missing.
     */
    createForProject: async (project: {
        id: string; name: string; leadName: string; status: ProjectStatus;
        statusPageToken?: string; statusPageUrl?: string;
    }): Promise<{ token: string; statusPageUrl: string }> => {
        const token = project.statusPageToken?.trim() || generateToken();
        const statusPageUrl = project.statusPageUrl?.trim() || buildStatusPageUrl(token);

        // Ensure token is stored on the project
        const { error } = await supabase
            .from('projects')
            .update({ status_page_token: token, status_page_url: statusPageUrl })
            .eq('id', project.id);

        if (error) throw error;

        return { token, statusPageUrl };
    },

    /**
     * Syncs status page identity (ensures token/URL exist on the project).
     * In Supabase, the project row IS the source of truth — no separate collection needed.
     */
    syncFromProjectId: async (projectId: string): Promise<void> => {
        const { data: project, error } = await supabase
            .from('projects')
            .select('id, status_page_token, status_page_url')
            .eq('id', projectId)
            .maybeSingle();

        if (error) throw error;
        if (!project) return;

        // If token/URL already exist, nothing to do
        if (project.status_page_token && project.status_page_url) return;

        // Generate and save
        const token = project.status_page_token?.trim() || generateToken();
        const statusPageUrl = project.status_page_url?.trim() || buildStatusPageUrl(token);

        const { error: updateError } = await supabase
            .from('projects')
            .update({ status_page_token: token, status_page_url: statusPageUrl })
            .eq('id', projectId);

        if (updateError) throw updateError;
    },

    /**
     * Get public project status by token.
     * Fetches from projects table and enriches with team info from users/leads.
     */
    getByToken: async (token: string): Promise<PublicProjectStatus | null> => {
        const normalizedToken = normalizeToken(token);

        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('status_page_token', normalizedToken)
            .maybeSingle();

        if (error) throw error;
        if (!project) return null;

        const result = rowToPublicStatus(project);
        if (!result) return null;

        // Enrich with team info — seller + postSales from lead → users
        try {
            const leadId = project.lead_id;
            if (leadId) {
                const { data: lead } = await supabase
                    .from('leads')
                    .select('responsible_id, post_sales_id')
                    .eq('id', leadId)
                    .maybeSingle();

                if (lead) {
                    const userIds = [project.producer_id, lead.responsible_id, lead.post_sales_id].filter((id): id is string => Boolean(id));

                    if (userIds.length > 0) {
                        const { data: users } = await supabase
                            .from('users')
                            .select('id, name, avatar_url')
                            .in('id', userIds);

                        const usersMap = new Map((users ?? []).map(u => [u.id, u]));

                        if (lead.responsible_id && usersMap.has(lead.responsible_id)) {
                            const seller = usersMap.get(lead.responsible_id)!;
                            result.sellerName = seller.name;
                            result.sellerPhotoUrl = seller.avatar_url || undefined;
                        }

                        if (project.producer_id && usersMap.has(project.producer_id)) {
                            const producer = usersMap.get(project.producer_id)!;
                            result.producerPhotoUrl = producer.avatar_url || undefined;
                        }

                        if (lead.post_sales_id && usersMap.has(lead.post_sales_id)) {
                            const postSales = usersMap.get(lead.post_sales_id)!;
                            result.postSalesName = postSales.name;
                            result.postSalesPhotoUrl = postSales.avatar_url || undefined;
                        }
                    }
                }
            }
        } catch {
            // Team info is optional — don't fail
        }

        return result;
    },

    /**
     * Subscribe to project status changes by token (Supabase Realtime)
     */
    subscribeByToken: (token: string, callback: (status: PublicProjectStatus | null) => void) => {
        const normalizedToken = normalizeToken(token);

        // Initial fetch
        ProjectStatusPageService.getByToken(normalizedToken).then(callback);

        const channel = supabase
            .channel(`status-page-${normalizedToken}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'projects', filter: `status_page_token=eq.${normalizedToken}` },
                () => {
                    ProjectStatusPageService.getByToken(normalizedToken).then(callback);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    },
};
