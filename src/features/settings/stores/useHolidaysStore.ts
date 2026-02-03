/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - HOLIDAYS STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Zustand store for managing holidays and days off state
 */

import { create } from 'zustand';
import {
    Holiday,
    DayOff,
    HolidaysService
} from '../services/holidaysService';

interface HolidaysState {
    holidays: Holiday[];
    customDaysOff: DayOff[];
    selectedYear: number;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;

    // Actions
    init: (year?: number) => Promise<void>;
    setYear: (year: number) => Promise<void>;
    addDayOff: (date: string, name: string) => Promise<void>;
    removeDayOff: (id: string) => Promise<void>;
}

export const useHolidaysStore = create<HolidaysState>((set, get) => ({
    holidays: [],
    customDaysOff: [],
    selectedYear: new Date().getFullYear(),
    isLoading: false,
    isSaving: false,
    error: null,

    init: async (year?: number) => {
        const targetYear = year || get().selectedYear;
        set({ isLoading: true, error: null, selectedYear: targetYear });

        try {
            const [holidays, customDaysOff] = await Promise.all([
                HolidaysService.getAllHolidays(targetYear),
                HolidaysService.getCustomDaysOff()
            ]);

            set({ holidays, customDaysOff, isLoading: false });
        } catch (error) {
            console.error('Error loading holidays:', error);
            set({
                error: 'Erro ao carregar feriados',
                isLoading: false
            });
        }
    },

    setYear: async (year: number) => {
        set({ selectedYear: year });
        await get().init(year);
    },

    addDayOff: async (date: string, name: string) => {
        set({ isSaving: true, error: null });

        try {
            const newDayOff = await HolidaysService.addDayOff(date, name);

            // Update local state
            const currentDaysOff = get().customDaysOff;
            set({
                customDaysOff: [...currentDaysOff, newDayOff],
                isSaving: false
            });

            // Refresh holidays list
            await get().init();
        } catch (error) {
            console.error('Error adding day off:', error);
            set({
                error: error instanceof Error ? error.message : 'Erro ao adicionar folga',
                isSaving: false
            });
            throw error;
        }
    },

    removeDayOff: async (id: string) => {
        set({ isSaving: true, error: null });

        try {
            await HolidaysService.removeDayOff(id);

            // Update local state
            const currentDaysOff = get().customDaysOff;
            set({
                customDaysOff: currentDaysOff.filter(d => d.id !== id),
                isSaving: false
            });

            // Refresh holidays list
            await get().init();
        } catch (error) {
            console.error('Error removing day off:', error);
            set({
                error: 'Erro ao remover folga',
                isSaving: false
            });
            throw error;
        }
    }
}));
