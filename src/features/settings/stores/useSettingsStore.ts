/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB — Integration Settings Store (Supabase-backed)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Loads/saves integration settings from the `integration_settings` Supabase table.
 * The API key is NOT stored here — it lives as a secret env var on the backend.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { supabase } from '@/config/supabase';

interface IntegrationConfig {
    id: string | null;
    provider: '360dialog' | 'meta_cloud';
    baseUrl: string;
    enabled: boolean;
    /** True while loading/saving */
    isLoading: boolean;
    /** True after first successful load */
    isLoaded: boolean;
}

interface IntegrationsState {
    whatsapp: IntegrationConfig;
    loadSettings: () => Promise<void>;
    saveSettings: (config: Partial<Pick<IntegrationConfig, 'provider' | 'baseUrl' | 'enabled'>>) => Promise<void>;
    /** Check if WhatsApp sending is enabled and configured */
    isWhatsAppEnabled: () => boolean;
}

export const useSettingsStore = create<IntegrationsState>()((set, get) => ({
    whatsapp: {
        id: null,
        provider: '360dialog',
        baseUrl: '',
        enabled: false,
        isLoading: false,
        isLoaded: false,
    },

    loadSettings: async () => {
        set((state) => ({ whatsapp: { ...state.whatsapp, isLoading: true } }));

        try {
            const { data, error } = await supabase
                .from('integration_settings')
                .select('id, provider, base_url, enabled')
                .limit(1)
                .single();

            if (error) {
                console.error('[SettingsStore] Failed to load settings:', error);
                set((state) => ({ whatsapp: { ...state.whatsapp, isLoading: false, isLoaded: true } }));
                return;
            }

            set({
                whatsapp: {
                    id: data.id,
                    provider: data.provider as '360dialog' | 'meta_cloud',
                    baseUrl: data.base_url,
                    enabled: data.enabled,
                    isLoading: false,
                    isLoaded: true,
                },
            });
        } catch (err) {
            console.error('[SettingsStore] Error loading settings:', err);
            set((state) => ({ whatsapp: { ...state.whatsapp, isLoading: false, isLoaded: true } }));
        }
    },

    saveSettings: async (config) => {
        const currentState = get().whatsapp;

        if (!currentState.id) {
            console.error('[SettingsStore] No settings record to update');
            return;
        }

        set((state) => ({ whatsapp: { ...state.whatsapp, isLoading: true } }));

        const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (config.provider !== undefined) updatePayload.provider = config.provider;
        if (config.baseUrl !== undefined) updatePayload.base_url = config.baseUrl;
        if (config.enabled !== undefined) updatePayload.enabled = config.enabled;

        try {
            const { error } = await supabase
                .from('integration_settings')
                .update(updatePayload)
                .eq('id', currentState.id);

            if (error) {
                console.error('[SettingsStore] Failed to save settings:', error);
                set((state) => ({ whatsapp: { ...state.whatsapp, isLoading: false } }));
                return;
            }

            // Update local state
            set((state) => ({
                whatsapp: {
                    ...state.whatsapp,
                    ...config,
                    isLoading: false,
                },
            }));
        } catch (err) {
            console.error('[SettingsStore] Error saving settings:', err);
            set((state) => ({ whatsapp: { ...state.whatsapp, isLoading: false } }));
        }
    },

    isWhatsAppEnabled: () => {
        const { whatsapp } = get();
        return whatsapp.enabled && Boolean(whatsapp.baseUrl) && whatsapp.provider === '360dialog';
    },
}));
