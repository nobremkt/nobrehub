/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COLLABORATOR PROFILE MODAL — Shared Types & Constants
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type TabType = 'info' | 'metas' | 'metricas';
export type GoalPeriod = 'dia' | 'semana' | 'mes' | '3meses';

// Re-export from centralized constants
export { SECTOR_IDS, LIDER_ROLE_ID } from '@/config/constants';



export interface CollaboratorMetrics {
    // Production
    points: number;
    projectsFinished: number;
    approvalRate: number;
    avgDeliveryDays: number;
    // Sales
    totalSold: number;
    leadsConverted: number;
    conversionRate: number;
    avgTicket: number;
    // Post-Sales
    clientsAttended: number;
    completedProjects: number;
}

export interface DayData {
    date: Date;
    achieved: boolean;
    isFuture: boolean;
    dayOfWeek: string;
    dayNumber: number;
    monthName: string;
}

export interface WeekData {
    weekLabel: string;
    days: DayData[];
}

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};
