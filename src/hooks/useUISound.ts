import { useCallback, useRef, useEffect } from 'react';
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

/**
 * Hook for playing UI sound effects
 * 
 * @example
 * const { playSound } = useUISound();
 * 
 * // In a button onClick
 * <Button onClick={() => { playSound('click'); doSomething(); }}>
 *   Click Me
 * </Button>
 */
export function useUISound() {
    const audioCache = useRef<Map<UISoundType, HTMLAudioElement>>(new Map());

    // Get sound settings from store
    const soundEnabled = useUIStore((state) => state.soundEnabled);
    const masterVolume = useUIStore((state) => state.soundVolume);

    // Preload sounds
    useEffect(() => {
        if (!soundEnabled) return;

        Object.entries(SOUND_PATHS).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = (DEFAULT_VOLUMES[key as UISoundType] ?? 0.5) * masterVolume;
            audioCache.current.set(key as UISoundType, audio);
        });

        return () => {
            audioCache.current.forEach((audio) => {
                audio.pause();
                audio.src = '';
            });
            audioCache.current.clear();
        };
    }, [soundEnabled, masterVolume]);

    /**
     * Play a UI sound effect
     */
    const playSound = useCallback((type: UISoundType, volume?: number) => {
        if (!soundEnabled) return;

        const cachedAudio = audioCache.current.get(type);
        if (cachedAudio) {
            // Clone audio to allow overlapping sounds
            const audio = cachedAudio.cloneNode() as HTMLAudioElement;
            audio.volume = Math.min(1, (volume ?? (DEFAULT_VOLUMES[type] ?? 0.5)) * masterVolume);
            audio.play().catch(() => {
                // Ignore autoplay errors (user hasn't interacted yet)
            });
        } else {
            // Fallback: create new audio if not cached
            const path = SOUND_PATHS[type];
            if (path) {
                const audio = new Audio(path);
                audio.volume = Math.min(1, (volume ?? (DEFAULT_VOLUMES[type] ?? 0.5)) * masterVolume);
                audio.play().catch(() => { });
            }
        }
    }, [soundEnabled, masterVolume]);

    return {
        playSound,
        soundEnabled,
    };
}
