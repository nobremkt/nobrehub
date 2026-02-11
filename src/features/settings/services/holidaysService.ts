/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - HOLIDAYS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Manages holidays from Brazil API and custom days off from Supabase
 */

import { supabase } from '@/config/supabase';

// Types
export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
    type: 'national' | 'custom';
}

export interface DayOff {
    id: string;
    date: string; // YYYY-MM-DD
    name: string;
    createdAt: Date;
}

export interface HolidaysConfig {
    customDaysOff: DayOff[];
    updatedAt: Date;
}

/**
 * Fetch national holidays from Brasil API
 */
export async function fetchNationalHolidays(year: number): Promise<Holiday[]> {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch holidays: ${response.status}`);
        }

        const data = await response.json();

        return data.map((h: { date: string; name: string; type: string }) => ({
            date: h.date,
            name: h.name,
            type: 'national' as const
        }));
    } catch (error) {
        console.error('Error fetching national holidays:', error);
        return [];
    }
}

/**
 * Get custom days off from Supabase
 */
export async function getCustomDaysOff(): Promise<DayOff[]> {
    try {
        const { data, error } = await supabase
            .from('holidays_config')
            .select('custom_days_off')
            .limit(1)
            .single();

        if (error) {
            // No row found yet
            if (error.code === 'PGRST116') return [];
            throw error;
        }

        return (data.custom_days_off as unknown as DayOff[]) || [];
    } catch (error) {
        console.error('Error fetching custom days off:', error);
        return [];
    }
}

/**
 * Save custom days off to Supabase
 */
export async function saveCustomDaysOff(daysOff: DayOff[]): Promise<void> {
    try {
        // Check if row exists
        const { data: existing } = await supabase
            .from('holidays_config')
            .select('id')
            .limit(1)
            .single();

        const payload = {
            custom_days_off: daysOff as unknown,
            updated_at: new Date().toISOString()
        } as any;

        if (existing) {
            const { error } = await supabase
                .from('holidays_config')
                .update(payload)
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('holidays_config')
                .insert(payload);
            if (error) throw error;
        }
    } catch (error) {
        console.error('Error saving custom days off:', error);
        throw error;
    }
}

/**
 * Add a custom day off
 */
export async function addDayOff(date: string, name: string): Promise<DayOff> {
    const currentDaysOff = await getCustomDaysOff();

    // Check if date already exists
    const exists = currentDaysOff.some(d => d.date === date);
    if (exists) {
        throw new Error('Esta data já está cadastrada como folga');
    }

    const newDayOff: DayOff = {
        id: `${date}-${Date.now()}`,
        date,
        name,
        createdAt: new Date()
    };

    const updatedDaysOff = [...currentDaysOff, newDayOff];
    await saveCustomDaysOff(updatedDaysOff);

    return newDayOff;
}

/**
 * Remove a custom day off
 */
export async function removeDayOff(id: string): Promise<void> {
    const currentDaysOff = await getCustomDaysOff();
    const updatedDaysOff = currentDaysOff.filter(d => d.id !== id);
    await saveCustomDaysOff(updatedDaysOff);
}

/**
 * Get all holidays (national + custom) for a year
 */
export async function getAllHolidays(year: number): Promise<Holiday[]> {
    const [nationalHolidays, customDaysOff] = await Promise.all([
        fetchNationalHolidays(year),
        getCustomDaysOff()
    ]);

    // Filter custom days off for the given year
    const customForYear = customDaysOff
        .filter(d => d.date.startsWith(String(year)))
        .map(d => ({
            date: d.date,
            name: d.name,
            type: 'custom' as const
        }));

    // Combine and sort by date
    const allHolidays = [...nationalHolidays, ...customForYear];
    allHolidays.sort((a, b) => a.date.localeCompare(b.date));

    return allHolidays;
}

export const HolidaysService = {
    fetchNationalHolidays,
    getCustomDaysOff,
    saveCustomDaysOff,
    addDayOff,
    removeDayOff,
    getAllHolidays
};
