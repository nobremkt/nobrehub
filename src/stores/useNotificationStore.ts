/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - STORE: NOTIFICAÇÕES
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Store central do sistema de notificações.
 * Gerencia notificações, toasts, drawer e sons.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { playNotificationSound } from '@/utils/notificationUtils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
    | 'teamchat'        // Nova mensagem no TeamChat
    | 'lead_assigned'   // Lead atribuído a você
    | 'project_assigned'// Projeto atribuído a você
    | 'client_assigned' // Cliente atribuído a você
    | 'goal_reached'    // Meta batida
    | 'system';         // Notificação genérica do sistema

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    timestamp: number;
    link?: string;          // Rota para navegar ao clicar
    read: boolean;
    senderName?: string;
    senderPhotoUrl?: string;
    chatId?: string;        // Para TeamChat
}

export interface ToastNotification extends AppNotification {
    /** Timer ID para auto-dismiss */
    timerId?: ReturnType<typeof setTimeout>;
}

interface NotificationState {
    // Data
    notifications: AppNotification[];
    toasts: ToastNotification[];
    drawerOpen: boolean;

    // Computed-like
    unreadCount: number;

    // Actions
    addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>, options?: { playSound?: boolean }) => void;
    markAsRead: (id: string) => void;
    markAllRead: () => void;
    clearAll: () => void;
    dismissToast: (id: string) => void;
    toggleDrawer: () => void;
    setDrawerOpen: (open: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 50;
const MAX_TOASTS = 3;
const TOAST_DURATION = 5000; // 5 seconds

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

let notifIdCounter = 0;

function generateId(): string {
    notifIdCounter++;
    return `notif_${Date.now()}_${notifIdCounter}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    toasts: [],
    drawerOpen: false,
    unreadCount: 0,

    addNotification: (notifData, options = {}) => {
        const { playSound = true } = options;

        const id = generateId();
        const notification: AppNotification = {
            ...notifData,
            id,
            timestamp: Date.now(),
            read: false,
        };

        // Play notification sound (only for non-teamchat types, as teamchat has its own)
        if (playSound && notifData.type !== 'teamchat') {
            playNotificationSound();
        }

        // Create toast
        const toast: ToastNotification = { ...notification };

        set(state => {
            // Add to notifications (cap at MAX)
            const updatedNotifs = [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);

            // Add to toasts (cap at MAX_TOASTS, remove oldest if needed)
            const updatedToasts = [toast, ...state.toasts].slice(0, MAX_TOASTS);

            return {
                notifications: updatedNotifs,
                toasts: updatedToasts,
                unreadCount: updatedNotifs.filter(n => !n.read).length,
            };
        });

        // Auto-dismiss toast after TOAST_DURATION
        const timerId = setTimeout(() => {
            get().dismissToast(id);
        }, TOAST_DURATION);

        // Store the timerId in the toast
        set(state => ({
            toasts: state.toasts.map(t =>
                t.id === id ? { ...t, timerId } : t
            ),
        }));
    },

    markAsRead: (id: string) => {
        set(state => {
            const updated = state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            );
            return {
                notifications: updated,
                unreadCount: updated.filter(n => !n.read).length,
            };
        });
    },

    markAllRead: () => {
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
    },

    dismissToast: (id: string) => {
        set(state => {
            const toast = state.toasts.find(t => t.id === id);
            if (toast?.timerId) {
                clearTimeout(toast.timerId);
            }
            return {
                toasts: state.toasts.filter(t => t.id !== id),
            };
        });
    },

    toggleDrawer: () => {
        set(state => ({ drawerOpen: !state.drawerOpen }));
    },

    setDrawerOpen: (open: boolean) => {
        set({ drawerOpen: open });
    },
}));
