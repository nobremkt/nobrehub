/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - UTILS: HELPERS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Funções utilitárias gerais.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Gera ID único
 */
export function generateId(prefix?: string): string {
    const id = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}-${id}` : id;
}

/**
 * Delay/Sleep
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp número entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return function (...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return function (...args: Parameters<T>) {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Verifica se objeto está vazio
 */
export function isEmpty(obj: unknown): boolean {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string') return obj.trim() === '';
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

/**
 * Remove propriedades undefined de um objeto
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key as keyof T] = value as T[keyof T];
        }
        return acc;
    }, {} as Partial<T>);
}

/**
 * Agrupa array por chave
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key]);
        groups[groupKey] = groups[groupKey] || [];
        groups[groupKey].push(item);
        return groups;
    }, {} as Record<string, T[]>);
}

/**
 * Ordena array por chave
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Retorna item único de array
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
        const k = item[key];
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

/**
 * Pick: seleciona propriedades de um objeto
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    return keys.reduce((acc, key) => {
        if (key in obj) acc[key] = obj[key];
        return acc;
    }, {} as Pick<T, K>);
}

/**
 * Omit: remove propriedades de um objeto
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result as Omit<T, K>;
}

/**
 * Capitaliza primeira letra
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Slugify string
 */
export function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
