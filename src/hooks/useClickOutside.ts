/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - HOOKS: useClickOutside
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook para detectar cliques fora de um elemento
 * Útil para dropdowns, modais, etc.
 * 
 * @example
 * const ref = useRef(null);
 * useClickOutside(ref, () => setIsOpen(false));
 */
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T>,
    handler: (event: MouseEvent | TouchEvent) => void,
    enabled: boolean = true
): void {
    useEffect(() => {
        if (!enabled) return;

        const listener = (event: MouseEvent | TouchEvent) => {
            const el = ref.current;
            if (!el || el.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, enabled]);
}

/**
 * Hook alternativo que retorna a ref
 */
export function useClickOutsideRef<T extends HTMLElement>(
    handler: (event: MouseEvent | TouchEvent) => void,
    enabled: boolean = true
): RefObject<T> {
    const ref = useRef<T>(null);
    useClickOutside(ref, handler, enabled);
    return ref;
}
