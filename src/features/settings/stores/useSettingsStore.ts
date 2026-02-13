/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB — Integration Settings Store (Supabase-backed + Local AI Config)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * WhatsApp settings: loaded/saved from the `integration_settings` Supabase table.
 * AI Models & Image Styles: persisted locally via zustand persist (localStorage).
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/config/supabase';

/**
 * Definição de um modelo de IA disponível para geração de imagens
 */
export interface AIModel {
    id: string;
    name: string;
    provider: 'gemini' | 'openai';
    modelId: string;
    enabled: boolean;
}

/**
 * Estilo de imagem — contém instruções/prompt de sistema
 */
export interface ImageStyle {
    id: string;
    name: string;
    prompt: string;
}

/** Modelos disponíveis por padrão */
const DEFAULT_AI_MODELS: AIModel[] = [
    // Gemini — Nano Banana
    { id: 'nano-banana-pro', name: 'Nano Banana Pro', provider: 'gemini', modelId: 'gemini-3-pro-image-preview', enabled: true },
    { id: 'nano-banana', name: 'Nano Banana', provider: 'gemini', modelId: 'gemini-2.5-flash-image', enabled: false },
    // Gemini — Imagen
    { id: 'imagen-4', name: 'Imagen 4.0', provider: 'gemini', modelId: 'imagen-4.0-generate-001', enabled: false },
    { id: 'imagen-4-ultra', name: 'Imagen 4.0 Ultra', provider: 'gemini', modelId: 'imagen-4.0-ultra-generate-001', enabled: false },
    { id: 'imagen-4-fast', name: 'Imagen 4.0 Fast', provider: 'gemini', modelId: 'imagen-4.0-fast-generate-001', enabled: false },
    // OpenAI
    { id: 'gpt-image', name: 'GPT Image 1.5', provider: 'openai', modelId: 'gpt-image-1.5-2025-12-16', enabled: false },
];

const DEFAULT_IMAGE_STYLES: ImageStyle[] = [
    {
        id: 'realistic',
        name: 'Realista',
        prompt: 'Generate a photorealistic image with natural lighting, real-world textures, and cinematic composition. The image should look like a professional photograph. Subject: {user_prompt}',
    },
    {
        id: 'cartoon-3d',
        name: '3D Cartoon',
        prompt: 'Generate a Pixar/Disney-style 3D cartoon render with vibrant colors, smooth shading, and expressive character design. The scene should be cheerful and polished. Subject: {user_prompt}',
    },
    {
        id: 'anime',
        name: 'Anime',
        prompt: 'Generate an anime-style illustration with clean linework, vibrant colors, and dramatic lighting typical of modern anime productions. Subject: {user_prompt}',
    },
    {
        id: 'watercolor',
        name: 'Aquarela',
        prompt: 'Generate a watercolor painting with soft blending, translucent washes, visible paper texture, and delicate color transitions. Subject: {user_prompt}',
    },
];

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
    // --- WhatsApp (Supabase-backed) ---
    whatsapp: IntegrationConfig;
    loadSettings: () => Promise<void>;
    saveSettings: (config: Partial<Pick<IntegrationConfig, 'provider' | 'baseUrl' | 'enabled'>>) => Promise<void>;
    /** Check if WhatsApp sending is enabled and configured */
    isWhatsAppEnabled: () => boolean;

    // --- AI Config (localStorage-persisted) ---
    gemini: { apiKey: string };
    openai: { apiKey: string };
    aiModels: AIModel[];
    imageStyles: ImageStyle[];
    setGeminiApiKey: (apiKey: string) => void;
    setOpenaiApiKey: (apiKey: string) => void;
    toggleModel: (modelId: string) => void;
    addImageStyle: (style: ImageStyle) => void;
    updateImageStyle: (id: string, updates: Partial<Omit<ImageStyle, 'id'>>) => void;
    removeImageStyle: (id: string) => void;
}

export const useSettingsStore = create<IntegrationsState>()(
    persist(
        (set, get) => ({
            // ─── WhatsApp (Supabase-backed) ──────────────────────────
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

            // ─── AI Config (localStorage-persisted) ──────────────────
            gemini: {
                apiKey: '',
            },
            openai: {
                apiKey: '',
            },
            aiModels: DEFAULT_AI_MODELS,
            imageStyles: DEFAULT_IMAGE_STYLES,
            setGeminiApiKey: (apiKey) => set((state) => ({
                gemini: { ...state.gemini, apiKey }
            })),
            setOpenaiApiKey: (apiKey) => set((state) => ({
                openai: { ...state.openai, apiKey }
            })),
            toggleModel: (id) => set((state) => ({
                aiModels: state.aiModels.map((m) =>
                    m.id === id ? { ...m, enabled: !m.enabled } : m
                )
            })),
            addImageStyle: (style) => set((state) => ({
                imageStyles: [...state.imageStyles, style]
            })),
            updateImageStyle: (id, updates) => set((state) => ({
                imageStyles: state.imageStyles.map((s) =>
                    s.id === id ? { ...s, ...updates } : s
                )
            })),
            removeImageStyle: (id) => set((state) => ({
                imageStyles: state.imageStyles.filter((s) => s.id !== id)
            })),
        }),
        {
            name: 'nobrehub-settings-storage',
            // Only persist AI-related fields to localStorage; WhatsApp is Supabase-backed
            partialize: (state) => ({
                gemini: state.gemini,
                openai: state.openai,
                aiModels: state.aiModels,
                imageStyles: state.imageStyles,
            }),
            merge: (persisted: unknown, current: IntegrationsState): IntegrationsState => {
                const p = persisted as Partial<IntegrationsState> | undefined;
                const merged = { ...current, ...p } as IntegrationsState;
                // Ensure new default models are always available
                if (p?.aiModels) {
                    const persistedIds = new Set(p.aiModels.map((m: AIModel) => m.id));
                    const newModels = DEFAULT_AI_MODELS.filter((m) => !persistedIds.has(m.id));
                    merged.aiModels = [...p.aiModels, ...newModels];
                }
                // Preserve default styles if not persisted yet
                if (!p?.imageStyles) {
                    merged.imageStyles = DEFAULT_IMAGE_STYLES;
                }
                // Restore WhatsApp to its default (non-persisted) state
                merged.whatsapp = current.whatsapp;
                return merged;
            },
        }
    )
);
