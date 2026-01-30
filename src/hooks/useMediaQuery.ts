/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - HOOKS: useMediaQuery
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';

/**
 * Hook para detectar media queries (responsividade)
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

        setMatches(mediaQuery.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

// Breakpoints pré-definidos
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');
export const useIsTablet = () => useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const usePrefersDark = () => useMediaQuery('(prefers-color-scheme: dark)');
