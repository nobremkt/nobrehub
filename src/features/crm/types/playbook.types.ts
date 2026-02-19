/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PLAYBOOK TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tipos para o sistema de playbook modular com blocos tipados.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─── Activity Type (canal de execução) ───────────────────────────────
export type PlaybookActivityType = 'whatsapp' | 'call' | 'email' | 'internal';

// ─── Block Type (tipo de conteúdo) ───────────────────────────────────
export type PlaybookBlockType = 'message' | 'checklist' | 'tip' | 'question';

// ─── Block ───────────────────────────────────────────────────────────
export interface PlaybookBlock {
    id: string;
    activityId: string;
    blockType: PlaybookBlockType;
    title: string | null;
    content: string;
    order: number;
}

// ─── Activity (with blocks) ──────────────────────────────────────────
export interface PlaybookActivity {
    id: string;
    stageId: string;
    label: string;
    activityType: PlaybookActivityType;
    order: number;
    active: boolean;
    blocks: PlaybookBlock[];
}

// ─── Progress (per-lead) ─────────────────────────────────────────────
export interface PlaybookProgress {
    id: string;
    leadId: string;
    pipeline: string;
    completedActivities: string[];
    scriptChecks: Record<string, boolean[]>;
    updatedAt: Date;
}

// ─── Activity type metadata ──────────────────────────────────────────
export const ACTIVITY_TYPE_META: Record<PlaybookActivityType, {
    icon: string;
    label: string;
    color: string;
}> = {
    whatsapp: { icon: '📱', label: 'WhatsApp', color: 'var(--color-success, #22C55E)' },
    call: { icon: '📞', label: 'Ligação', color: 'var(--color-info, #3B82F6)' },
    email: { icon: '📧', label: 'E-mail', color: 'var(--color-warning, #F59E0B)' },
    internal: { icon: '📋', label: 'Interno', color: 'var(--color-text-muted, #737373)' },
};
