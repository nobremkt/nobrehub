/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - SYSTEM NOTIFICATION HELPERS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Utility functions to fire system-level notifications from anywhere.
 * Import and call these as one-liners — no store import needed.
 *
 * Usage:
 *   import { notifySystem, notifyError, notifySuccess } from '@/utils/systemNotifications';
 *   notifyError('Falha ao conectar ao Firebase');
 *   notifySuccess('Dados sincronizados com sucesso');
 *   notifySystem('Manutenção prevista para 22h', '/settings');
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useNotificationStore } from '@/stores/useNotificationStore';

/**
 * Generic system notification.
 */
export function notifySystem(body: string, link?: string) {
    useNotificationStore.getState().addNotification({
        type: 'system',
        title: 'Aviso do Sistema',
        body,
        link,
    });
}

/**
 * Error / failure notification.
 */
export function notifyError(body: string, link?: string) {
    useNotificationStore.getState().addNotification({
        type: 'system',
        title: '⚠️ Erro',
        body,
        link,
    });
}

/**
 * Success notification (still uses 'system' type but with a positive title).
 */
export function notifySuccess(body: string, link?: string) {
    useNotificationStore.getState().addNotification({
        type: 'system',
        title: '✅ Sucesso',
        body,
        link,
    });
}

/**
 * Info / neutral notification.
 */
export function notifyInfo(body: string, link?: string) {
    useNotificationStore.getState().addNotification({
        type: 'system',
        title: 'ℹ️ Informação',
        body,
        link,
    });
}
