/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - STORE: UI
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Gerencia estado da interface: sidebar, tema, modais, toasts.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_CONFIG } from '@/config/constants';
import type { SystemMessage } from '@/types/common.types';

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
    // Sidebar
    sidebarCollapsed: boolean;
    sidebarMobileOpen: boolean;
    sidebarExpandedCategories: string[];

    // Theme
    theme: Theme;

    // Toasts
    toasts: SystemMessage[];

    // Modal genérico (para controle global se necessário)
    activeModal: string | null;
    modalData: unknown;

    // Loading global
    isLoading: boolean;
    loadingMessage?: string;

    // Sound settings
    soundEnabled: boolean;
    soundVolume: number; // 0 to 1
}

interface UIActions {
    // Sidebar
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setSidebarMobileOpen: (open: boolean) => void;
    toggleSidebarCategory: (categoryId: string) => void;

    // Theme
    setTheme: (theme: Theme) => void;

    // Toasts
    addToast: (toast: Omit<SystemMessage, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;

    // Modal
    openModal: (modalId: string, data?: unknown) => void;
    closeModal: () => void;

    // Loading
    setLoading: (loading: boolean, message?: string) => void;

    // Sound
    setSoundEnabled: (enabled: boolean) => void;
    setSoundVolume: (volume: number) => void;
}

export const useUIStore = create<UIState & UIActions>()(
    persist(
        (set, get) => ({
            // Initial state
            sidebarCollapsed: true,
            sidebarMobileOpen: false,
            sidebarExpandedCategories: [],
            theme: 'system',
            toasts: [],
            activeModal: null,
            modalData: null,
            isLoading: false,
            soundEnabled: true,
            soundVolume: 0.5,
            loadingMessage: undefined,

            // Sidebar actions
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
            setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
            toggleSidebarCategory: (categoryId) => set((state) => ({
                sidebarExpandedCategories: state.sidebarExpandedCategories.includes(categoryId)
                    ? state.sidebarExpandedCategories.filter((id) => id !== categoryId)
                    : [...state.sidebarExpandedCategories, categoryId]
            })),

            // Theme actions
            setTheme: (theme) => {
                set({ theme });

                // Aplicar tema no documento
                const root = document.documentElement;
                root.classList.remove('light', 'dark');

                if (theme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.add(prefersDark ? 'dark' : 'light');
                } else {
                    root.classList.add(theme);
                }
            },

            // Toast actions
            addToast: (toast) => {
                const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newToast = { ...toast, id };

                set((state) => ({ toasts: [...state.toasts, newToast] }));

                // Auto-remove após duração
                const duration = toast.duration ?? 5000;
                if (duration > 0) {
                    setTimeout(() => get().removeToast(id), duration);
                }
            },

            removeToast: (id) => set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            })),

            clearToasts: () => set({ toasts: [] }),

            // Modal actions
            openModal: (modalId, data) => set({ activeModal: modalId, modalData: data }),
            closeModal: () => set({ activeModal: null, modalData: null }),

            // Loading actions
            setLoading: (loading, message) => set({ isLoading: loading, loadingMessage: message }),

            // Sound actions
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
            setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),
        }),
        {
            name: APP_CONFIG.storage.theme,
            partialize: (state) => ({
                theme: state.theme,
                soundEnabled: state.soundEnabled,
                soundVolume: state.soundVolume,
            }),
        }
    )
);
