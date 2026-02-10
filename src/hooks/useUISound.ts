import { useCallback, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores';

/**
 * Available UI sound effects
 */
export type UISoundType =
    | 'click'
    | 'hover'
    | 'toggle-on'
    | 'toggle-off'
    | 'notification'
    | 'success'
    | 'error'
    | 'warning'
    | 'message'
    | 'checkbox';

/**
 * Sound file paths mapping
 */
const SOUND_PATHS: Record<UISoundType, string> = {
    'click': '/sounds/ui/click.mp3',
    'hover': '/sounds/ui/hover.mp3',
    'toggle-on': '/sounds/ui/toggle-on.mp3',
    'toggle-off': '/sounds/ui/toggle-off.mp3',
    'notification': '/sounds/ui/notification.mp3',
    'success': '/sounds/ui/sucesso.mp3',
    'error': '/sounds/ui/error.mp3',
    'warning': '/sounds/ui/warning.mp3',
    'message': '/sounds/ui/mensagem.mp3',
    'checkbox': '/sounds/ui/checkbox.mp3',
};

/**
 * Default volumes for each sound type (0 to 1)
 */
const DEFAULT_VOLUMES: Partial<Record<UISoundType, number>> = {
    'hover': 0.15,
    'click': 0.3,
    'toggle-on': 0.25,
    'toggle-off': 0.25,
    'notification': 0.4,
    'success': 0.35,
    'error': 0.4,
    'warning': 0.35,
    'message': 0.4,
    'checkbox': 0.3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL AUDIO CACHE (Singleton)
// Only 10 Audio elements total, shared by ALL components.
// This prevents the "too many WebMediaPlayers" browser intervention.
// ═══════════════════════════════════════════════════════════════════════════════

const globalAudioCache = new Map<UISoundType, HTMLAudioElement>();
let cacheInitialized = false;
let activeSubscribers = 0;

function initGlobalCache() {
    if (cacheInitialized) return;
    cacheInitialized = true;

    Object.entries(SOUND_PATHS).forEach(([key, path]) => {
        const audio = new Audio(path);
        audio.preload = 'auto';
        globalAudioCache.set(key as UISoundType, audio);
    });
}

function destroyGlobalCache() {
    globalAudioCache.forEach((audio) => {
        audio.pause();
        audio.src = '';
    });
    globalAudioCache.clear();
    cacheInitialized = false;
}

/**
 * Hook for playing UI sound effects.
 * 
 * Uses a global singleton cache — no matter how many Button/Checkbox/Switch
 * components are rendered, only 10 Audio elements are ever created.
 * 
 * @example
 * const { playSound } = useUISound();
 * <Button onClick={() => { playSound('click'); doSomething(); }}>
 */
export function useUISound() {
    const soundEnabled = useUIStore((state) => state.soundEnabled);
    const masterVolume = useUIStore((state) => state.soundVolume);
    const masterVolumeRef = useRef(masterVolume);
    masterVolumeRef.current = masterVolume;

    // Track subscribers to manage global cache lifecycle
    useEffect(() => {
        if (!soundEnabled) return;

        activeSubscribers++;
        initGlobalCache();

        // Update volumes when masterVolume changes
        globalAudioCache.forEach((audio, key) => {
            audio.volume = (DEFAULT_VOLUMES[key] ?? 0.5) * masterVolume;
        });

        return () => {
            activeSubscribers--;
            if (activeSubscribers <= 0) {
                activeSubscribers = 0;
                destroyGlobalCache();
            }
        };
    }, [soundEnabled, masterVolume]);

    /**
     * Play a UI sound effect.
     * Reuses the cached Audio element — resets currentTime instead of cloning.
     */
    const playSound = useCallback((type: UISoundType, volume?: number) => {
        if (!soundEnabled) return;

        const audio = globalAudioCache.get(type);
        if (audio) {
            audio.volume = Math.min(1, (volume ?? (DEFAULT_VOLUMES[type] ?? 0.5)) * masterVolumeRef.current);
            audio.currentTime = 0;
            audio.play().catch(() => {
                // Ignore autoplay errors (user hasn't interacted yet)
            });
        }
    }, [soundEnabled]);

    return {
        playSound,
        soundEnabled,
    };
}
