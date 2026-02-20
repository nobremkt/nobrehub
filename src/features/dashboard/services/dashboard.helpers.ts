/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DASHBOARD HELPERS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shared helper functions used by all dashboard metric services
 */

import { supabase } from '@/config/supabase';
import { HolidaysService } from '@/features/settings/services/holidaysService';
import { GoalsService, type GoalsConfig } from '@/features/settings/services/goalsService';
import type { DateFilter, CollaboratorsData, SharedData } from './dashboard.types';

// ─── Constants ──────────────────────────────────────────────────────────────

export const PROJECTS_TABLE = 'projects';

/** Category colors for the donut chart — supports both uppercase and title-case */
export const CATEGORY_COLORS: Record<string, string> = {
    '3D PREMIUM': '#8b5cf6',
    '3D Premium': '#8b5cf6',
    'FLOW': '#06b6d4',
    'Flow': '#06b6d4',
    'EXPLAINER': '#f59e0b',
    'Explainer': '#f59e0b',
    'CREATE': '#22c55e',
    'Create': '#22c55e',
    'POST': '#3b82f6',
    'Post': '#3b82f6',
    'REELS': '#ec4899',
    'Reels': '#ec4899',
    'MOTION': '#dc2626',
    'Motion': '#dc2626',
    'CARROSSEL': '#f97316',
    'Carrossel': '#f97316',
    'WHITEBOARD': '#84cc16',
    'Whiteboard': '#84cc16',
    'MASCOTE': '#a855f7',
    'Mascote': '#a855f7',
    'LOGOTIPO': '#14b8a6',
    'Logotipo': '#14b8a6',
    'VSL': '#ef4444',
    'Vsl': '#ef4444',
    'PORTFÓLIO': '#10b981',
    'Portfólio': '#10b981',
    'Outro': '#6b7280',
};

// Sector/Role names — resolved dynamically from SharedData
export const PRODUCAO_SECTOR_NAME = 'Produção';
export const LIDER_ROLE_NAME = 'Líder';
export const POS_VENDAS_SECTOR_NAME = 'Pós-vendas';

// ─── Date Helpers ───────────────────────────────────────────────────────────

export function getDateRange(filter: DateFilter): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
        case 'today':
            return { start: today, end: now };
        case 'yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { start: yesterday, end: today };
        }
        case 'week': {
            const dayOfWeek = today.getDay();
            const monday = new Date(today);
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            monday.setDate(today.getDate() - daysFromMonday);
            return { start: monday, end: now };
        }
        case 'month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: monthStart, end: now };
        }
        case '2025': {
            return { start: new Date(2025, 0, 1), end: new Date(2025, 11, 31, 23, 59, 59) };
        }
        case '2026': {
            return { start: new Date(2026, 0, 1), end: now > new Date(2026, 11, 31) ? new Date(2026, 11, 31, 23, 59, 59) : now };
        }
        case 'quarter': {
            const quarterStart = new Date(now);
            quarterStart.setMonth(quarterStart.getMonth() - 3);
            return { start: quarterStart, end: now };
        }
        default: {
            // Handle dynamic YYYY-MM month keys (e.g. '2025-09')
            const monthMatch = filter.match(/^(\d{4})-(\d{2})$/);
            if (monthMatch) {
                const year = parseInt(monthMatch[1], 10);
                const month = parseInt(monthMatch[2], 10) - 1; // 0-indexed
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
                return { start: monthStart, end: monthEnd };
            }
            return { start: today, end: now };
        }
    }
}

/**
 * Get date range for GOAL calculation (FULL period, not "up to today")
 */
export function getGoalDateRange(filter: DateFilter): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
        case 'today':
            return { start: today, end: today };
        case 'yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { start: yesterday, end: yesterday };
        }
        case 'week': {
            const dayOfWeek = today.getDay();
            const monday = new Date(today);
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            monday.setDate(today.getDate() - daysFromMonday);
            const friday = new Date(monday);
            friday.setDate(monday.getDate() + 4);
            return { start: monday, end: friday };
        }
        case 'month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { start: monthStart, end: monthEnd };
        }
        case '2025': {
            return { start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) };
        }
        case '2026': {
            return { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31) };
        }
        case 'quarter': {
            const currentMonth = now.getMonth();
            const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
            const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
            const quarterEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
            return { start: quarterStart, end: quarterEnd };
        }
        default: {
            // Handle dynamic YYYY-MM month keys (e.g. '2025-09')
            const monthMatch = filter.match(/^(\d{4})-(\d{2})$/);
            if (monthMatch) {
                const year = parseInt(monthMatch[1], 10);
                const month = parseInt(monthMatch[2], 10) - 1; // 0-indexed
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                return { start: monthStart, end: monthEnd };
            }
            return { start: today, end: today };
        }
    }
}

/** Parse date from various formats */
export function parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return undefined;
}

// ─── Data Helpers ───────────────────────────────────────────────────────────

/** Build a reverse lookup: name → id[] from preloaded rows */
export function findIdsByName(rows: Record<string, unknown>[], name: string): Set<string> {
    const ids = new Set<string>();
    rows.forEach(row => {
        const rowName = (row.name as string) || '';
        if (rowName.toLowerCase() === name.toLowerCase()) {
            ids.add(row.id as string);
        }
    });
    return ids;
}

/** Fetch collaborators data for name lookups and producer counting */
export async function getCollaboratorsData(preloaded?: SharedData): Promise<CollaboratorsData> {
    const rows = preloaded
        ? preloaded.collaborators
        : await supabase.from('users').select('*').then(r => r.data || []);

    const sectorRows = preloaded?.sectors || [];
    const roleRows = preloaded?.roles || [];
    const producaoSectorIds = findIdsByName(sectorRows, PRODUCAO_SECTOR_NAME);
    const liderRoleIds = findIdsByName(roleRows, LIDER_ROLE_NAME);

    const nameMap: Record<string, string> = {};
    const photoMap: Record<string, string> = {};
    let producerCount = 0;

    rows.forEach((row: Record<string, unknown>) => {
        const id = row.id as string;
        const name = (row.name as string) || 'Desconhecido';
        const profilePhotoUrl = (row.avatar_url as string) || '';

        nameMap[id] = name;
        photoMap[id] = profilePhotoUrl;

        const sectorId = (row.sector_id as string) || '';
        const roleId = (row.role_id as string) || '';

        if (producaoSectorIds.has(sectorId) && !liderRoleIds.has(roleId)) {
            producerCount++;
        }
    });

    return { nameMap, photoMap, producerCount };
}

// ─── Goal Helpers ───────────────────────────────────────────────────────────

/** Fetch goal configuration from centralized GoalsService */
export async function getGoalConfig(): Promise<GoalsConfig> {
    return GoalsService.getConfig();
}

/** Calculate actual workdays in a period, excluding weekends and holidays */
export async function getWorkdaysInPeriod(startDate: Date, endDate: Date): Promise<number> {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const holidayDates = new Set<string>();

    for (let year = startYear; year <= endYear; year++) {
        try {
            const holidays = await HolidaysService.getAllHolidays(year);
            holidays.forEach(h => holidayDates.add(h.date));
        } catch (error) {
            console.warn(`Could not fetch holidays for ${year}:`, error);
        }
    }

    let workdays = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
        const dayOfWeek = current.getDay();
        const dateStr = current.toISOString().split('T')[0];

        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidayDates.has(dateStr)) {
            workdays++;
        }
        current.setDate(current.getDate() + 1);
    }

    return workdays;
}

/** Calculate goal target based on period filter */
export async function calculateGoalForPeriod(
    config: GoalsConfig,
    period: DateFilter,
    startDate: Date,
    endDate: Date
): Promise<number> {
    if (period === 'today' || period === 'yesterday') {
        const workdays = await getWorkdaysInPeriod(startDate, endDate);
        return workdays > 0 ? config.dailyProductionGoal : 0;
    }

    const workdays = await getWorkdaysInPeriod(startDate, endDate);
    return config.dailyProductionGoal * workdays;
}
