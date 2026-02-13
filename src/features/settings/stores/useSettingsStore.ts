import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface IntegrationsState {
    whatsapp: {
        provider: 'evolution' | '360dialog' | null;
        baseUrl: string;
        apiKey: string;
    };
    gemini: {
        apiKey: string;
    };
    openai: {
        apiKey: string;
    };
    aiModels: AIModel[];
    imageStyles: ImageStyle[];
    setWhatsappConfig: (config: Partial<IntegrationsState['whatsapp']>) => void;
    setGeminiApiKey: (apiKey: string) => void;
    setOpenaiApiKey: (apiKey: string) => void;
    toggleModel: (modelId: string) => void;
    addImageStyle: (style: ImageStyle) => void;
    updateImageStyle: (id: string, updates: Partial<Omit<ImageStyle, 'id'>>) => void;
    removeImageStyle: (id: string) => void;
}

export const useSettingsStore = create<IntegrationsState>()(
    persist(
        (set) => ({
            whatsapp: {
                provider: 'evolution',
                baseUrl: '',
                apiKey: ''
            },
            gemini: {
                apiKey: '',
            },
            openai: {
                apiKey: '',
            },
            aiModels: DEFAULT_AI_MODELS,
            imageStyles: DEFAULT_IMAGE_STYLES,
            setWhatsappConfig: (config) => set((state) => ({
                whatsapp: { ...state.whatsapp, ...config }
            })),
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
            merge: (persisted: unknown, current: IntegrationsState): IntegrationsState => {
                const p = persisted as Partial<IntegrationsState> | undefined;
                const merged = { ...current, ...p } as IntegrationsState;
                if (p?.aiModels) {
                    const persistedIds = new Set(p.aiModels.map((m: AIModel) => m.id));
                    const newModels = DEFAULT_AI_MODELS.filter((m) => !persistedIds.has(m.id));
                    merged.aiModels = [...p.aiModels, ...newModels];
                }
                // Preserve default styles if not persisted yet
                if (!p?.imageStyles) {
                    merged.imageStyles = DEFAULT_IMAGE_STYLES;
                }
                return merged;
            }
        }
    )
);
