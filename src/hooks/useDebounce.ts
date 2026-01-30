/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - HOOKS: useDebounce
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * Útil para buscas, inputs, etc.
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
