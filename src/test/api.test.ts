import { describe, it, expect, vi } from 'vitest';

// Mock supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
    }
}));

describe('API Utils', () => {
    describe('toCamelCase', () => {
        it('should convert snake_case object keys to camelCase', async () => {
            const { toCamelCase } = await import('../services/api/utils');

            const input = { first_name: 'John', last_name: 'Doe' };
            const expected = { firstName: 'John', lastName: 'Doe' };

            expect(toCamelCase(input)).toEqual(expected);
        });

        it('should handle nested objects', async () => {
            const { toCamelCase } = await import('../services/api/utils');

            const input = { user_data: { first_name: 'John' } };
            const expected = { userData: { firstName: 'John' } };

            expect(toCamelCase(input)).toEqual(expected);
        });

        it('should handle null and primitives', async () => {
            const { toCamelCase } = await import('../services/api/utils');

            expect(toCamelCase(null)).toBe(null);
            expect(toCamelCase('hello')).toBe('hello');
            expect(toCamelCase(123)).toBe(123);
        });
    });

    describe('toSnakeCase', () => {
        it('should convert camelCase object keys to snake_case', async () => {
            const { toSnakeCase } = await import('../services/api/utils');

            const input = { firstName: 'John', lastName: 'Doe' };
            const expected = { first_name: 'John', last_name: 'Doe' };

            expect(toSnakeCase(input)).toEqual(expected);
        });

        it('should handle nested objects', async () => {
            const { toSnakeCase } = await import('../services/api/utils');

            const input = { userData: { firstName: 'John' } };
            const expected = { user_data: { first_name: 'John' } };

            expect(toSnakeCase(input)).toEqual(expected);
        });
    });
});

describe('Lead Data Validation', () => {
    it('should validate required lead fields', () => {
        const validLead = {
            name: 'John Doe',
            phone: '11999999999'
        };

        expect(validLead.name).toBeTruthy();
        expect(validLead.phone).toBeTruthy();
    });

    it('should format phone numbers correctly', () => {
        const phone = '11999999999';
        const formatted = phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');

        expect(formatted).toBe('(11) 99999-9999');
    });
});
