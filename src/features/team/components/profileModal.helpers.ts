/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COLLABORATOR PROFILE MODAL — Goal History Helpers
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { GoalPeriod, DayData, WeekData } from './profileModal.types';

// Nome dos dias da semana
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Check if a date is a working day (Mon-Fri, not a holiday)
 */
export const isWorkingDay = (date: Date, holidayDates: Set<string>): boolean => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    const dateStr = date.toISOString().split('T')[0];
    return !holidayDates.has(dateStr);
};

/**
 * Get the Monday of the week for a given date
 */
export const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Get Friday of the week for a given date
 */
export const getFriday = (date: Date): Date => {
    const monday = getMonday(date);
    monday.setDate(monday.getDate() + 4);
    return monday;
};

/**
 * Generate mock goal history - properly structured (includes future days)
 */
export const generateMockGoalHistory = (
    collaboratorId: string,
    period: GoalPeriod,
    holidayDates: Set<string>
): WeekData[] => {
    const hash = collaboratorId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate: Date;

    switch (period) {
        case 'dia': {
            startDate = new Date(today);
            endDate = new Date(today);
            break;
        }
        case 'semana': {
            startDate = getMonday(today);
            endDate = getFriday(today);
            break;
        }
        case 'mes': {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        }
        case '3meses': {
            startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        }
    }

    const allDays: DayData[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        if (isWorkingDay(current, holidayDates)) {
            const isFuture = current > today;
            const dayHash = hash + current.getDate() + current.getMonth();
            const achieved = isFuture ? false : dayHash % 10 >= 3;

            allDays.push({
                date: new Date(current),
                achieved,
                isFuture,
                dayOfWeek: DAY_NAMES[current.getDay()],
                dayNumber: current.getDate(),
                monthName: MONTH_NAMES[current.getMonth()]
            });
        }
        current.setDate(current.getDate() + 1);
    }

    if (period === 'dia' || period === 'semana') {
        const label = period === 'dia'
            ? 'Hoje'
            : `${startDate.getDate()} - ${Math.min(today.getDate(), getMonday(today).getDate() + 4)} ${MONTH_NAMES[today.getMonth()]}`;

        return allDays.length > 0 ? [{
            weekLabel: label,
            days: allDays
        }] : [];
    }

    const weeks: WeekData[] = [];
    let currentWeekDays: DayData[] = [];
    let currentWeekMonday: Date | null = null;

    allDays.forEach((day) => {
        const dayMonday = getMonday(day.date);

        if (!currentWeekMonday || dayMonday.getTime() !== currentWeekMonday.getTime()) {
            if (currentWeekDays.length > 0 && currentWeekMonday) {
                const firstDay = currentWeekDays[0];
                const lastDay = currentWeekDays[currentWeekDays.length - 1];

                let weekLabel: string;
                if (firstDay.date.getMonth() === lastDay.date.getMonth()) {
                    weekLabel = `${firstDay.dayNumber} - ${lastDay.dayNumber} ${MONTH_NAMES[lastDay.date.getMonth()]}`;
                } else {
                    weekLabel = `${firstDay.dayNumber} ${firstDay.monthName} - ${lastDay.dayNumber} ${lastDay.monthName}`;
                }

                weeks.push({ weekLabel, days: [...currentWeekDays] });
            }

            currentWeekMonday = dayMonday;
            currentWeekDays = [day];
        } else {
            currentWeekDays.push(day);
        }
    });

    if (currentWeekDays.length > 0) {
        const firstDay = currentWeekDays[0];
        const lastDay = currentWeekDays[currentWeekDays.length - 1];

        let weekLabel: string;
        if (firstDay.date.getMonth() === lastDay.date.getMonth()) {
            weekLabel = `${firstDay.dayNumber} - ${lastDay.dayNumber} ${MONTH_NAMES[lastDay.date.getMonth()]}`;
        } else {
            weekLabel = `${firstDay.dayNumber} ${firstDay.monthName} - ${lastDay.dayNumber} ${lastDay.monthName}`;
        }

        weeks.push({ weekLabel, days: [...currentWeekDays] });
    }

    return weeks;
};

/**
 * Calcular estatísticas de metas
 */
export const calculateGoalStats = (weeks: WeekData[]) => {
    const allDays = weeks.flatMap(w => w.days);
    const achieved = allDays.filter(d => d.achieved).length;
    const total = allDays.length;
    const percentage = total > 0 ? Math.round((achieved / total) * 100) : 0;

    let streak = 0;
    for (let i = allDays.length - 1; i >= 0; i--) {
        if (allDays[i].achieved) {
            streak++;
        } else {
            break;
        }
    }

    return { achieved, total, percentage, streak };
};
