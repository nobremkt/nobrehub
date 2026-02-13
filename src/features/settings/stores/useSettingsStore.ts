/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB — Integration Settings Store (Fully Supabase-backed)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * WhatsApp settings: `integration_settings` table
 * AI API Keys:       `ai_api_keys` table
 * AI Models:         `ai_models` table
 * Image Styles:      `ai_image_styles` table
 *
 * Nothing is stored in localStorage anymore.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { supabase } from '@/config/supabase';

/* ═════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═════════════════════════════════════════════════════════════════════════════ */

export interface AIModel {
    id: string;
    name: string;
    provider: 'gemini' | 'openai';
    modelId: string;
    enabled: boolean;
    sortOrder: number;
}

export interface ImageStyle {
    id: string;
    name: string;
    prompt: string;
    isDefault: boolean;
    sortOrder: number;
}

interface IntegrationConfig {
    id: string | null;
    provider: '360dialog' | 'meta_cloud';
    baseUrl: string;
    enabled: boolean;
    isLoading: boolean;
    isLoaded: boolean;
}

/* ═════════════════════════════════════════════════════════════════════════════
 * STORE INTERFACE
 * ═════════════════════════════════════════════════════════════════════════════ */

interface IntegrationsState {
    // ─── WhatsApp ────────────────────────────────────────────────────────
    whatsapp: IntegrationConfig;
    loadSettings: () => Promise<void>;
    saveSettings: (config: Partial<Pick<IntegrationConfig, 'provider' | 'baseUrl' | 'enabled'>>) => Promise<void>;
    isWhatsAppEnabled: () => boolean;

    // ─── AI API Keys ────────────────────────────────────────────────────
    gemini: { apiKey: string };
    openai: { apiKey: string };
    setGeminiApiKey: (apiKey: string) => Promise<void>;
    setOpenaiApiKey: (apiKey: string) => Promise<void>;

    // ─── AI Models ──────────────────────────────────────────────────────
    aiModels: AIModel[];
    toggleModel: (modelId: string) => Promise<void>;

    // ─── Image Styles ───────────────────────────────────────────────────
    imageStyles: ImageStyle[];
    addImageStyle: (style: Omit<ImageStyle, 'sortOrder' | 'isDefault'>) => Promise<void>;
    updateImageStyle: (id: string, updates: Partial<Omit<ImageStyle, 'id'>>) => Promise<void>;
    removeImageStyle: (id: string) => Promise<void>;

    // ─── Loading ────────────────────────────────────────────────────────
    aiLoaded: boolean;
    loadAISettings: () => Promise<void>;
}

/* ═════════════════════════════════════════════════════════════════════════════
 * STORE
 * ═════════════════════════════════════════════════════════════════════════════ */

export const useSettingsStore = create<IntegrationsState>()((set, get) => ({

    // ─── WhatsApp (Supabase: integration_settings) ──────────────────────
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
                console.error('[SettingsStore] Failed to load WhatsApp settings:', error);
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
            console.error('[SettingsStore] Error loading WhatsApp settings:', err);
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
                console.error('[SettingsStore] Failed to save WhatsApp settings:', error);
                set((state) => ({ whatsapp: { ...state.whatsapp, isLoading: false } }));
                return;
            }

            set((state) => ({
                whatsapp: { ...state.whatsapp, ...config, isLoading: false },
            }));
        } catch (err) {
            console.error('[SettingsStore] Error saving WhatsApp settings:', err);
            set((state) => ({ whatsapp: { ...state.whatsapp, isLoading: false } }));
        }
    },

    isWhatsAppEnabled: () => {
        const { whatsapp } = get();
        return whatsapp.enabled && Boolean(whatsapp.baseUrl) && whatsapp.provider === '360dialog';
    },

    // ─── AI API Keys (Supabase: ai_api_keys) ────────────────────────────
    gemini: { apiKey: '' },
    openai: { apiKey: '' },

    setGeminiApiKey: async (apiKey) => {
        set({ gemini: { apiKey } });
        try {
            await supabase
                .from('ai_api_keys')
                .update({ api_key: apiKey, updated_at: new Date().toISOString() })
                .eq('provider', 'gemini');
        } catch (err) {
            console.error('[SettingsStore] Failed to save Gemini API key:', err);
        }
    },

    setOpenaiApiKey: async (apiKey) => {
        set({ openai: { apiKey } });
        try {
            await supabase
                .from('ai_api_keys')
                .update({ api_key: apiKey, updated_at: new Date().toISOString() })
                .eq('provider', 'openai');
        } catch (err) {
            console.error('[SettingsStore] Failed to save OpenAI API key:', err);
        }
    },

    // ─── AI Models (Supabase: ai_models) ────────────────────────────────
    aiModels: [],

    toggleModel: async (id) => {
        const model = get().aiModels.find((m) => m.id === id);
        if (!model) return;

        const newEnabled = !model.enabled;

        // Optimistic update
        set((state) => ({
            aiModels: state.aiModels.map((m) =>
                m.id === id ? { ...m, enabled: newEnabled } : m
            ),
        }));

        try {
            await supabase
                .from('ai_models')
                .update({ enabled: newEnabled })
                .eq('id', id);
        } catch (err) {
            console.error('[SettingsStore] Failed to toggle model:', err);
            // Rollback
            set((state) => ({
                aiModels: state.aiModels.map((m) =>
                    m.id === id ? { ...m, enabled: !newEnabled } : m
                ),
            }));
        }
    },

    // ─── Image Styles (Supabase: ai_image_styles) ───────────────────────
    imageStyles: [],

    addImageStyle: async (style) => {
        const newStyle: ImageStyle = {
            ...style,
            isDefault: false,
            sortOrder: get().imageStyles.length + 1,
        };

        // Optimistic update
        set((state) => ({ imageStyles: [...state.imageStyles, newStyle] }));

        try {
            await supabase
                .from('ai_image_styles')
                .insert({
                    id: style.id,
                    name: style.name,
                    prompt: style.prompt,
                    is_default: false,
                    sort_order: newStyle.sortOrder,
                });
        } catch (err) {
            console.error('[SettingsStore] Failed to add image style:', err);
            // Rollback
            set((state) => ({
                imageStyles: state.imageStyles.filter((s) => s.id !== style.id),
            }));
        }
    },

    updateImageStyle: async (id, updates) => {
        const previous = get().imageStyles.find((s) => s.id === id);
        if (!previous) return;

        // Optimistic update
        set((state) => ({
            imageStyles: state.imageStyles.map((s) =>
                s.id === id ? { ...s, ...updates } : s
            ),
        }));

        const payload: Record<string, unknown> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.prompt !== undefined) payload.prompt = updates.prompt;
        if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;

        try {
            await supabase
                .from('ai_image_styles')
                .update(payload)
                .eq('id', id);
        } catch (err) {
            console.error('[SettingsStore] Failed to update image style:', err);
            // Rollback
            set((state) => ({
                imageStyles: state.imageStyles.map((s) =>
                    s.id === id ? previous : s
                ),
            }));
        }
    },

    removeImageStyle: async (id) => {
        const removed = get().imageStyles.find((s) => s.id === id);

        // Optimistic update
        set((state) => ({
            imageStyles: state.imageStyles.filter((s) => s.id !== id),
        }));

        try {
            await supabase
                .from('ai_image_styles')
                .delete()
                .eq('id', id);
        } catch (err) {
            console.error('[SettingsStore] Failed to remove image style:', err);
            // Rollback
            if (removed) {
                set((state) => ({
                    imageStyles: [...state.imageStyles, removed],
                }));
            }
        }
    },

    // ─── Load all AI settings from Supabase ─────────────────────────────
    aiLoaded: false,

    loadAISettings: async () => {
        if (get().aiLoaded) return;

        try {
            // Fetch everything in parallel
            const [keysRes, modelsRes, stylesRes] = await Promise.all([
                supabase.from('ai_api_keys').select('provider, api_key'),
                supabase.from('ai_models').select('id, name, provider, model_id, enabled, sort_order').order('sort_order'),
                supabase.from('ai_image_styles').select('id, name, prompt, is_default, sort_order').order('sort_order'),
            ]);

            // Parse API keys
            const geminiKey = keysRes.data?.find((k) => k.provider === 'gemini')?.api_key || '';
            const openaiKey = keysRes.data?.find((k) => k.provider === 'openai')?.api_key || '';

            // Parse models
            const models: AIModel[] = (modelsRes.data || []).map((m) => ({
                id: m.id,
                name: m.name,
                provider: m.provider as 'gemini' | 'openai',
                modelId: m.model_id,
                enabled: m.enabled,
                sortOrder: m.sort_order,
            }));

            // Parse styles
            const styles: ImageStyle[] = (stylesRes.data || []).map((s) => ({
                id: s.id,
                name: s.name,
                prompt: s.prompt,
                isDefault: s.is_default,
                sortOrder: s.sort_order,
            }));

            set({
                gemini: { apiKey: geminiKey },
                openai: { apiKey: openaiKey },
                aiModels: models,
                imageStyles: styles,
                aiLoaded: true,
            });
        } catch (err) {
            console.error('[SettingsStore] Failed to load AI settings:', err);
            set({ aiLoaded: true }); // Mark as loaded to prevent retry loops
        }
    },
}));
