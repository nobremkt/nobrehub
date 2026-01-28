import { supabase } from '../../lib/supabase';

// Re-export supabase client for use in domain modules
export { supabase };

// Helper to convert snake_case to camelCase
export function toCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);

    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = toCamelCase(obj[key]);
        return acc;
    }, {} as any);
}

// Helper to convert camelCase to snake_case
export function toSnakeCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toSnakeCase);

    return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        acc[snakeKey] = toSnakeCase(obj[key]);
        return acc;
    }, {} as any);
}
