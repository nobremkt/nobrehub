/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DASHBOARD ANALYTICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Aggregates production data for dashboard metrics
 * Supports both legacy projects and historical imported data
 * Migrated from Firebase Firestore to Supabase
 */

import { supabase } from '@/config/supabase';
import { Lead } from '@/types/lead.types';
import { HolidaysService } from '@/features/settings/services/holidaysService';
import { GoalsService, type GoalsConfig } from '@/features/settings/services/goalsService';

const PROJECTS_TABLE = 'projects';

// Category colors for the donut chart
const CATEGORY_COLORS: Record<string, string> = {
    // Categorias principais de projetos
    '3D PREMIUM': '#8b5cf6',    // Purple
    'FLOW': '#06b6d4',          // Cyan
    'EXPLAINER': '#f59e0b',     // Amber
    'CREATE': '#22c55e',        // Green
    'POST': '#3b82f6',          // Blue
    'REELS': '#ec4899',         // Pink
    'MOTION': '#dc2626',        // Red
    'CARROSSEL': '#f97316',     // Orange
    'WHITEBOARD': '#84cc16',    // Lime

    // Categorias adicionais
    'MASCOTE': '#a855f7',       // Violet
    'LOGOTIPO': '#14b8a6',      // Teal
    'VSL': '#ef4444',           // Red-500
    'PORTFÓLIO': '#10b981',     // Emerald

    'Outro': '#6b7280'          // Gray
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'janeiro_2026';

/** Internal project structure (supports both legacy and imported) */
interface InternalProject {
    id: string;
    title: string;
    producerId: string;
    producerName?: string; // May come from collaborators lookup
    category: string;
    difficulty?: string;
    points: number;
    status: string;
    type?: string; // 'alteracao' for alterations
    motivo?: string;
    deliveredAt?: Date;
    createdAt: Date;
    isHistorical?: boolean;
}

/** Production-specific metrics */
export interface ProductionMetrics {
    deliveredProjects: number;
    goalTarget: number;
    goalPercentage: number;
    goalStatus: 'below' | 'on-track' | 'above';
    categoryDistribution: { name: string; value: number; color: string }[];
    producerRanking: { name: string; points: number }[];
    alterationsRanking: { name: string; count: number }[];
    totalActiveProjects: number;
    pendingRevisions: number;
    totalAlterations: number;
    activeProducers: number;
    totalPoints: number;
    mvpProducer: {
        name: string;
        projects: number;
        points: number;
        avgDays: number;
        approvalRate: number;
        profilePhotoUrl?: string
    } | null;
    topPointsProducer: { name: string; points: number; profilePhotoUrl?: string } | null;
    topProjectsProducer: { name: string; count: number; profilePhotoUrl?: string } | null;
    rocketProducer: { name: string; points: number; inDays: number; profilePhotoUrl?: string } | null;
    finisherProducer: { name: string; count: number; inDays: number; profilePhotoUrl?: string } | null;
}

/** Sales/CRM metrics */
export interface SalesMetrics {
    newLeads: number;
    qualifiedLeads: number;
    closedDeals: number;
    lostDeals: number;
    pipelineValue: number;
    conversionRate: number;
    leadsByPipeline: { pipeline: string; count: number }[];
    leadsByStatus: { status: string; count: number }[];
    topSellers: { name: string; deals: number; value: number }[];
    // Extended metrics for dashboard
    trendData: { date: string; leads: number; closed: number }[];
    sourceData: { source: string; count: number }[];
    performanceMetrics: {
        avgResponseTime: number;
        avgCycleTime: number;
        contactRate: number;
        followUpRate: number;
    };
}

/** General overview metrics */
export interface GeneralMetrics {
    totalRevenue: number;
    totalLeads: number;
    totalProjects: number;
    totalDelivered: number;
    conversionRate: number;
    avgDeliveryTime: number;
}

/** Admin metrics */
export interface AdminMetrics {
    activeUsers: number;
    totalCollaborators: number;
    // Extended fields for AdminStats component
    teamSize: number;
    activeMembers: number;
    avgWorkload: number; // Average projects per active member
    goalsMet: number; // Percentage of producers meeting their goal (if applicable)
    efficiency: number; // Team efficiency score based on delivery rate
    members: {
        id: string;
        name: string;
        role: string;
        sector: string;
        profilePhotoUrl?: string;
        projectsDelivered: number;
        pointsEarned: number;
    }[];
    productivityData: { name: string; productivity: number; projects: number }[];
    sectors: { name: string; productivity: number; trend: 'up' | 'down' | 'stable'; members: number }[];
}

/** Financial metrics - derived from sales data */
export interface FinancialMetrics {
    revenue: number;
    previousRevenue: number;
    expenses: number; // Placeholder - requires financial module
    profit: number;
    margin: number;
    avgTicket: number;
    cashFlow: { month: string; revenue: number; expenses: number; balance: number }[];
    operationalCosts: { name: string; value: number; color: string }[];
    accounts: {
        receivable: number;
        payable: number;
        overdue: number;
    };
}

/** Post-sales metrics */
export interface PostSalesMetrics {
    // Ticket metrics
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number; // em horas
    // Customer metrics
    customerSatisfaction: number; // 0-100
    churnRate: number; // %
    retentionRate: number; // %
    npsScore: number; // -100 a 100
    // Trend data
    ticketsTrend: { date: string; opened: number; resolved: number }[];
    // Revenue tracking - pós-vendedoras recebem pagamentos finais
    totalPaymentsReceived: number;
    paymentsTrend: { date: string; amount: number }[];
    // Ranking de pós-vendedoras por valor recebido
    topPostSellers: {
        id: string;
        name: string;
        profilePhotoUrl?: string;
        paymentsReceived: number;
        ticketsResolved: number;
        avgRating: number;
    }[];
}

/** Unified dashboard metrics - aggregates all sections */
export interface UnifiedDashboardMetrics {
    dateFilter: DateFilter;
    fetchedAt: Date;
    general: GeneralMetrics;
    production: ProductionMetrics;
    sales: SalesMetrics;
    admin: AdminMetrics;
    financial: FinancialMetrics;
    postSales: PostSalesMetrics;
}

/** Legacy alias for backward compatibility */
export type DashboardMetrics = ProductionMetrics;

function getDateRange(filter: DateFilter): { start: Date; end: Date } {
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
            // Current calendar week: Monday to current day
            const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const monday = new Date(today);
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            monday.setDate(today.getDate() - daysFromMonday);
            return { start: monday, end: now };
        }
        case 'month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: monthStart, end: now };
        }
        case 'year': {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return { start: yearStart, end: now };
        }
        case 'quarter': {
            const quarterStart = new Date(now);
            quarterStart.setMonth(quarterStart.getMonth() - 3);
            return { start: quarterStart, end: now };
        }
        case 'janeiro_2026': {
            const jan2026Start = new Date(2026, 0, 1); // Jan 1, 2026
            const jan2026End = new Date(2026, 0, 31, 23, 59, 59); // Jan 31, 2026
            return { start: jan2026Start, end: jan2026End };
        }
        default:
            return { start: today, end: now };
    }
}

/**
 * Get date range for GOAL calculation (FULL period, not "up to today")
 */
function getGoalDateRange(filter: DateFilter): { start: Date; end: Date } {
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
        case 'year': {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const yearEnd = new Date(now.getFullYear(), 11, 31);
            return { start: yearStart, end: yearEnd };
        }
        case 'quarter': {
            const currentMonth = now.getMonth();
            const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
            const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
            const quarterEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
            return { start: quarterStart, end: quarterEnd };
        }
        case 'janeiro_2026': {
            const jan2026Start = new Date(2026, 0, 1);
            const jan2026End = new Date(2026, 0, 31);
            return { start: jan2026Start, end: jan2026End };
        }
        default:
            return { start: today, end: today };
    }
}

/** Parse date from various formats */
function parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return undefined;
}

/** Collaborators data with name map and producer count */
interface CollaboratorsData {
    nameMap: Record<string, string>;
    photoMap: Record<string, string>;
    producerCount: number;
}

/** Supabase row arrays, shared across sub-methods within getAllMetrics() */
interface SharedData {
    collaborators: Record<string, unknown>[];
    projects: Record<string, unknown>[];
    leads: Record<string, unknown>[];
    sectors: Record<string, unknown>[];
    roles: Record<string, unknown>[];
}

// Sector ID for "Produção"
const PRODUCAO_SECTOR_ID = '7OhlXcRc8Vih9n7p4PdZ';

// Role ID for "Líder" (to be excluded from producer count)
const LIDER_ROLE_ID = '2Qb0NHjub0kaYFYDITqQ';

/** Fetch collaborators data for name lookups and producer counting */
async function getCollaboratorsData(preloaded?: SharedData): Promise<CollaboratorsData> {
    const rows = preloaded
        ? preloaded.collaborators
        : await supabase.from('users').select('*').then(r => r.data || []);

    const nameMap: Record<string, string> = {};
    const photoMap: Record<string, string> = {};
    let producerCount = 0;

    rows.forEach((row: Record<string, unknown>) => {
        const id = row.id as string;
        const name = (row.name as string) || 'Desconhecido';
        const profilePhotoUrl = (row.avatar_url as string) || '';

        nameMap[id] = name;
        photoMap[id] = profilePhotoUrl;

        const sectorId = (row.department as string) || '';
        const roleId = (row.role as string) || '';

        if (sectorId === PRODUCAO_SECTOR_ID && roleId !== LIDER_ROLE_ID) {
            producerCount++;
        }
    });

    return { nameMap, photoMap, producerCount };
}

/** Fetch goal configuration from centralized GoalsService (single source of truth) */
async function getGoalConfig(): Promise<GoalsConfig> {
    return GoalsService.getConfig();
}

/**
 * Calculate actual workdays in a period, excluding weekends and holidays
 */
async function getWorkdaysInPeriod(startDate: Date, endDate: Date): Promise<number> {
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
        const dateStr = current.toISOString().split('T')[0]; // YYYY-MM-DD

        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidayDates.has(dateStr)) {
            workdays++;
        }
        current.setDate(current.getDate() + 1);
    }

    return workdays;
}

/**
 * Calculate goal target based on period filter
 */
async function calculateGoalForPeriod(
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

export const DashboardAnalyticsService = {
    /**
     * Fetches all projects and calculates dashboard metrics
     */
    getMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<DashboardMetrics> => {
        const { start, end } = getDateRange(filter);

        // Fetch collaborators for name resolution, photos, and producer count
        const { nameMap: collaboratorsMap, photoMap: collaboratorsPhotoMap, producerCount } = await getCollaboratorsData(_shared);

        // Fetch all projects (use shared data if available)
        const projectRows: Record<string, unknown>[] = _shared
            ? _shared.projects
            : (await supabase.from(PROJECTS_TABLE).select('*')).data || [];

        const allProjects: InternalProject[] = projectRows.map(row => ({
            id: row.id as string,
            title: (row.title as string) || (row.name as string) || '',
            producerId: (row.producer_id as string) || '',
            producerName: collaboratorsMap[(row.producer_id as string)] || (row.producer_name as string) || 'Desconhecido',
            category: (row.category as string) || (row.tags as string[])?.[0] || 'Outro',
            difficulty: row.difficulty as string | undefined,
            points: Number(row.points) || 1,
            status: (row.status as string) || 'entregue',
            type: row.type as string | undefined,
            motivo: row.motivo as string | undefined,
            deliveredAt: parseDate(row.delivered_at),
            createdAt: parseDate(row.created_at) || new Date(),
            isHistorical: (row.is_historical as boolean) || false
        }));

        // Filter by type: exclude alteracoes from main projects count
        const isAlteracao = (p: InternalProject) => p.type === 'alteracao' || p.status === 'alteracao' || p.status === 'alteracao_interna' || p.status === 'alteracao_cliente';
        const projects = allProjects.filter(p => !isAlteracao(p));
        const alteracoes = allProjects.filter(p => isAlteracao(p));

        // Filter projects by date range
        const projectsInPeriod = projects.filter(p => {
            const relevantDate = p.deliveredAt || p.createdAt;
            return relevantDate >= start && relevantDate <= end;
        });

        const alteracoesInPeriod = alteracoes.filter(a => {
            const relevantDate = a.deliveredAt || a.createdAt;
            return relevantDate >= start && relevantDate <= end;
        });

        // Delivered projects in period
        const deliveredProjects = projectsInPeriod.filter(p =>
            p.deliveredAt || p.status === 'entregue' || p.status === 'revisado' || p.status === 'concluido' || p.isHistorical
        );
        const deliveredCount = deliveredProjects.length;

        // Total points in period
        const totalPointsInPeriod = deliveredProjects.reduce((sum, p) => sum + p.points, 0);

        // Get producer count (sector Produção, excluding Líder role)
        const producersForGoal = Math.max(producerCount, 1);

        // Fetch goal from settings
        const goalConfig = await getGoalConfig();
        const goalPeriod = getGoalDateRange(filter);
        const individualGoalForPeriod = await calculateGoalForPeriod(goalConfig, filter, goalPeriod.start, goalPeriod.end);
        const goalTarget = individualGoalForPeriod * producersForGoal;
        const goalPercentage = goalTarget > 0 ? Math.round((totalPointsInPeriod / goalTarget) * 100) : 0;
        const goalStatus: 'below' | 'on-track' | 'above' =
            goalPercentage >= 100 ? 'above' : goalPercentage >= 50 ? 'on-track' : 'below';

        // Category distribution
        const categoryMap: Record<string, number> = {};
        projectsInPeriod.forEach(p => {
            const category = p.category || 'Outro';
            categoryMap[category] = (categoryMap[category] || 0) + 1;
        });
        const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value,
            color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Outro']
        }));

        // Producer ranking by POINTS (include id for photo lookup)
        const producerPointsMap: Record<string, { id: string; name: string; points: number; count: number }> = {};
        deliveredProjects.forEach(p => {
            if (!producerPointsMap[p.producerId]) {
                producerPointsMap[p.producerId] = { id: p.producerId, name: p.producerName || 'Desconhecido', points: 0, count: 0 };
            }
            producerPointsMap[p.producerId].points += p.points;
            producerPointsMap[p.producerId].count += 1;
        });
        const producerRanking = Object.values(producerPointsMap)
            .sort((a, b) => b.points - a.points)
            .slice(0, 7);

        // Alterations ranking
        const alterationsMap: Record<string, { name: string; count: number }> = {};
        alteracoesInPeriod.forEach(a => {
            if (!alterationsMap[a.producerId]) {
                alterationsMap[a.producerId] = { name: a.producerName || 'Desconhecido', count: 0 };
            }
            alterationsMap[a.producerId].count += 1;
        });
        const alterationsRanking = Object.values(alterationsMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Summary cards
        const activeProjects = projects.filter(p => !p.deliveredAt && !p.isHistorical);
        const totalActiveProjects = activeProjects.length;
        const pendingRevisions = projects.filter(p => p.status === 'a-revisar').length;
        const totalAlterations = alteracoesInPeriod.length;
        const activeProducers = producersForGoal;

        // Calculate per-producer delivery times
        const producerDeliveryTimes: Record<string, { id: string; name: string; totalDays: number; deliveryCount: number }> = {};
        deliveredProjects.forEach(p => {
            if (p.deliveredAt && p.createdAt) {
                const days = Math.max(0, Math.ceil((p.deliveredAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                if (!producerDeliveryTimes[p.producerId]) {
                    producerDeliveryTimes[p.producerId] = { id: p.producerId, name: p.producerName || 'Desconhecido', totalDays: 0, deliveryCount: 0 };
                }
                producerDeliveryTimes[p.producerId].totalDays += days;
                producerDeliveryTimes[p.producerId].deliveryCount += 1;
            }
        });

        // Calculate per-producer alterations for approval rate
        const producerAlterations: Record<string, number> = {};
        alteracoesInPeriod.forEach(a => {
            producerAlterations[a.producerId] = (producerAlterations[a.producerId] || 0) + 1;
        });

        // Highlights - MVP (most points) with all stats
        const mvpEntry = producerRanking[0];
        let mvpProducer = null;
        if (mvpEntry) {
            const mvpDeliveryData = producerDeliveryTimes[mvpEntry.id];
            const mvpAlterations = producerAlterations[mvpEntry.id] || 0;
            const mvpAvgDays = mvpDeliveryData && mvpDeliveryData.deliveryCount > 0
                ? Math.round(mvpDeliveryData.totalDays / mvpDeliveryData.deliveryCount)
                : 0;
            const totalProductions = mvpEntry.count + mvpAlterations;
            const mvpApprovalRate = totalProductions > 0
                ? Math.round((mvpEntry.count / totalProductions) * 100)
                : 100;

            mvpProducer = {
                name: mvpEntry.name,
                projects: mvpEntry.count,
                points: mvpEntry.points,
                avgDays: mvpAvgDays,
                approvalRate: mvpApprovalRate,
                profilePhotoUrl: collaboratorsPhotoMap[mvpEntry.id] || undefined
            };
        }

        // Top points producer (same as MVP for now)
        const topPointsProducer = mvpEntry
            ? { name: mvpEntry.name, points: mvpEntry.points, profilePhotoUrl: collaboratorsPhotoMap[mvpEntry.id] || undefined }
            : null;

        // Top projects producer (by count)
        const topProjectsEntry = Object.values(producerPointsMap)
            .sort((a, b) => b.count - a.count)[0];
        const topProjectsProducer = topProjectsEntry
            ? { name: topProjectsEntry.name, count: topProjectsEntry.count, profilePhotoUrl: collaboratorsPhotoMap[topProjectsEntry.id] || undefined }
            : null;

        // Rocket (record for most POINTS in a SINGLE day)
        const dailyPointsRecords: Record<string, { id: string; name: string; date: string; points: number }> = {};
        const filterMonthStart = new Date(start.getFullYear(), start.getMonth(), 1);
        const filterMonthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

        const monthProjects = projects.filter((p: InternalProject) => {
            const deliveryDate = p.deliveredAt;
            return deliveryDate && deliveryDate >= filterMonthStart && deliveryDate <= filterMonthEnd;
        });

        monthProjects.forEach(p => {
            if (p.deliveredAt) {
                const dateKey = p.deliveredAt.toISOString().split('T')[0];
                const recordKey = `${p.producerId}_${dateKey}`;

                if (!dailyPointsRecords[recordKey]) {
                    dailyPointsRecords[recordKey] = {
                        id: p.producerId,
                        name: p.producerName || 'Desconhecido',
                        date: dateKey,
                        points: 0
                    };
                }
                dailyPointsRecords[recordKey].points += p.points;
            }
        });

        const rocketEntry = Object.values(dailyPointsRecords)
            .sort((a, b) => b.points - a.points)[0];
        const rocketProducer = rocketEntry
            ? {
                name: rocketEntry.name,
                points: rocketEntry.points,
                inDays: 1,
                profilePhotoUrl: collaboratorsPhotoMap[rocketEntry.id] || undefined
            }
            : null;

        // Finisher (record for most PROJECTS delivered in a SINGLE day)
        const dailyProjectRecords: Record<string, { id: string; name: string; date: string; count: number }> = {};

        monthProjects.forEach(p => {
            if (p.deliveredAt) {
                const dateKey = p.deliveredAt.toISOString().split('T')[0];
                const recordKey = `${p.producerId}_${dateKey}`;

                if (!dailyProjectRecords[recordKey]) {
                    dailyProjectRecords[recordKey] = {
                        id: p.producerId,
                        name: p.producerName || 'Desconhecido',
                        date: dateKey,
                        count: 0
                    };
                }
                dailyProjectRecords[recordKey].count += 1;
            }
        });

        const finisherEntry = Object.values(dailyProjectRecords)
            .sort((a, b) => b.count - a.count)[0];
        const finisherProducer = finisherEntry
            ? {
                name: finisherEntry.name,
                count: finisherEntry.count,
                inDays: 1,
                profilePhotoUrl: collaboratorsPhotoMap[finisherEntry.id] || undefined
            }
            : null;

        return {
            deliveredProjects: deliveredCount,
            goalTarget,
            goalPercentage,
            goalStatus,
            categoryDistribution,
            producerRanking,
            alterationsRanking,
            totalActiveProjects,
            pendingRevisions,
            totalAlterations,
            activeProducers,
            totalPoints: totalPointsInPeriod,
            mvpProducer,
            topPointsProducer,
            topProjectsProducer,
            rocketProducer,
            finisherProducer
        };
    },

    /**
     * Fetches sales/CRM metrics from leads table
     */
    getSalesMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<SalesMetrics> => {
        const { start, end } = getDateRange(filter);

        const leadRows: Record<string, unknown>[] = _shared
            ? _shared.leads
            : (await supabase.from('leads').select('*')).data || [];

        const allLeads: Lead[] = leadRows.map(row => ({
            ...row,
            id: row.id as string,
            createdAt: parseDate(row.created_at) || new Date(),
            updatedAt: parseDate(row.updated_at) || new Date(),
        })) as Lead[];

        // Filter by date range
        const leadsInPeriod = allLeads.filter(l => {
            const relevantDate = l.createdAt;
            return relevantDate >= start && relevantDate <= end;
        });

        // Metrics calculations
        const newLeads = leadsInPeriod.length;
        const qualifiedLeads = leadsInPeriod.filter(l => l.status === 'qualified' || l.status === 'negotiation').length;

        const closedStatuses = ['won', 'closed', 'contracted'];
        const lostStatuses = ['lost', 'churned'];

        const closedDeals = leadsInPeriod.filter(l => closedStatuses.includes(l.status)).length;
        const lostDeals = leadsInPeriod.filter(l => lostStatuses.includes(l.status)).length;

        // Pipeline value
        const pipelineValue = leadsInPeriod
            .filter(l => !lostStatuses.includes(l.status))
            .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

        // Conversion rate
        const totalCompleted = closedDeals + lostDeals;
        const conversionRate = totalCompleted > 0 ? Math.round((closedDeals / totalCompleted) * 100) : 0;

        // Leads by pipeline
        const pipelineMap: Record<string, number> = {};
        leadsInPeriod.forEach(l => {
            const pipeline = l.pipeline || 'default';
            pipelineMap[pipeline] = (pipelineMap[pipeline] || 0) + 1;
        });
        const leadsByPipeline = Object.entries(pipelineMap).map(([pipeline, count]) => ({
            pipeline,
            count
        }));

        // Leads by status
        const statusMap: Record<string, number> = {};
        leadsInPeriod.forEach(l => {
            statusMap[l.status] = (statusMap[l.status] || 0) + 1;
        });
        const leadsByStatus = Object.entries(statusMap).map(([status, count]) => ({
            status,
            count
        }));

        // Top sellers
        const sellerMap: Record<string, { deals: number; value: number }> = {};
        leadsInPeriod.filter(l => closedStatuses.includes(l.status)).forEach(l => {
            const sellerId = l.responsibleId || 'unknown';
            if (!sellerMap[sellerId]) {
                sellerMap[sellerId] = { deals: 0, value: 0 };
            }
            sellerMap[sellerId].deals += 1;
            sellerMap[sellerId].value += l.estimatedValue || 0;
        });
        const topSellers = Object.entries(sellerMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.deals - a.deals)
            .slice(0, 5);

        // Calculate trend data (leads and closed per day)
        const trendMap: Record<string, { leads: number; closed: number }> = {};
        leadsInPeriod.forEach(l => {
            const dateKey = l.createdAt.toISOString().split('T')[0];
            if (!trendMap[dateKey]) {
                trendMap[dateKey] = { leads: 0, closed: 0 };
            }
            trendMap[dateKey].leads += 1;
            if (closedStatuses.includes(l.status)) {
                trendMap[dateKey].closed += 1;
            }
        });
        const trendData = Object.entries(trendMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-14)
            .map(([date, data]) => {
                const d = new Date(date);
                return {
                    date: `${d.getDate()}/${d.getMonth() + 1}`,
                    leads: data.leads,
                    closed: data.closed
                };
            });

        // Calculate source data from lead source field
        const sourceMap: Record<string, number> = {};
        leadsInPeriod.forEach(l => {
            const source = (l as { source?: string }).source || 'outros';
            sourceMap[source] = (sourceMap[source] || 0) + 1;
        });
        const sourceData = Object.entries(sourceMap)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        // Calculate performance metrics
        const contactedLeads = leadsInPeriod.filter(l =>
            !['new'].includes(l.status)
        ).length;
        const contactRate = newLeads > 0 ? Math.round((contactedLeads / newLeads) * 100) : 0;

        const closedLeadsInPeriod = leadsInPeriod.filter(l => closedStatuses.includes(l.status));
        let totalCycleDays = 0;
        let cycleCount = 0;
        closedLeadsInPeriod.forEach(l => {
            if (l.createdAt && l.updatedAt) {
                const days = Math.max(0, Math.ceil((l.updatedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                totalCycleDays += days;
                cycleCount++;
            }
        });
        const avgCycleTime = cycleCount > 0 ? Math.round((totalCycleDays / cycleCount) * 10) / 10 : 0;

        const performanceMetrics = {
            avgResponseTime: 0,
            avgCycleTime,
            contactRate,
            followUpRate: contactRate,
        };

        return {
            newLeads,
            qualifiedLeads,
            closedDeals,
            lostDeals,
            pipelineValue,
            conversionRate,
            leadsByPipeline,
            leadsByStatus,
            topSellers,
            trendData,
            sourceData: sourceData.length > 0 ? sourceData : [
                { source: 'landing-page', count: 0 },
                { source: 'site', count: 0 },
                { source: 'whatsapp', count: 0 },
                { source: 'instagram', count: 0 },
                { source: 'indicacao', count: 0 },
            ],
            performanceMetrics
        };
    },

    /**
     * Fetches admin metrics with full team data
     */
    getAdminMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<AdminMetrics> => {
        const { start, end } = getDateRange(filter);

        // Fetch collaborators (use shared data or fetch independently)
        const collabRows: Record<string, unknown>[] = _shared
            ? _shared.collaborators
            : (await supabase.from('users').select('*')).data || [];

        // Filter out DEBUG account from collaborators
        const filteredCollaborators = collabRows.filter(row =>
            (row.email as string) !== 'debug@debug.com'
        );
        const totalCollaborators = filteredCollaborators.length;

        // Fetch sectors for name lookups (use shared or fetch)
        const sectorsRows: Record<string, unknown>[] = _shared
            ? _shared.sectors
            : [];
        const sectorsMap: Record<string, string> = {};
        sectorsRows.forEach(row => {
            sectorsMap[row.id as string] = (row.name as string) || 'Sem Setor';
        });

        // Fetch roles for name lookups (use shared or fetch)
        const rolesRows: Record<string, unknown>[] = _shared
            ? _shared.roles
            : [];
        const rolesMap: Record<string, string> = {};
        rolesRows.forEach(row => {
            rolesMap[row.id as string] = (row.name as string) || 'Sem Cargo';
        });

        // Fetch projects for productivity calculations (use shared or fetch)
        const projectsRows: Record<string, unknown>[] = _shared
            ? _shared.projects
            : (await supabase.from(PROJECTS_TABLE).select('*')).data || [];

        // Calculate per-collaborator project stats
        const projectsByCollaborator: Record<string, { count: number; points: number }> = {};
        projectsRows.forEach(row => {
            const deliveredAt = parseDate(row.delivered_at);
            const producerId = row.producer_id as string;

            // Only count delivered projects in period
            if (producerId && deliveredAt && deliveredAt >= start && deliveredAt <= end) {
                if (!projectsByCollaborator[producerId]) {
                    projectsByCollaborator[producerId] = { count: 0, points: 0 };
                }
                projectsByCollaborator[producerId].count += 1;
                projectsByCollaborator[producerId].points += Number(row.points) || 1;
            }
        });

        // Build members array
        const members: AdminMetrics['members'] = [];
        let activeCount = 0;

        filteredCollaborators.forEach(row => {
            const isActive = row.active !== false;
            if (isActive) activeCount++;

            const id = row.id as string;
            const projectStats = projectsByCollaborator[id] || { count: 0, points: 0 };

            members.push({
                id,
                name: (row.name as string) || 'Desconhecido',
                role: rolesMap[(row.role as string)] || (row.role as string) || 'Sem Cargo',
                sector: sectorsMap[(row.department as string)] || (row.department as string) || 'Sem Setor',
                profilePhotoUrl: row.avatar_url as string | undefined,
                projectsDelivered: projectStats.count,
                pointsEarned: projectStats.points
            });
        });

        // Calculate sector performance
        const sectorStats: Record<string, { total: number; count: number; memberCount: number }> = {};
        members.forEach(member => {
            if (!sectorStats[member.sector]) {
                sectorStats[member.sector] = { total: 0, count: 0, memberCount: 0 };
            }
            sectorStats[member.sector].memberCount += 1;
            if (member.projectsDelivered > 0) {
                sectorStats[member.sector].total += member.pointsEarned;
                sectorStats[member.sector].count += 1;
            }
        });

        const sectors: AdminMetrics['sectors'] = Object.entries(sectorStats)
            .filter(([name]) => name !== 'Sem Setor')
            .map(([name, stats]) => ({
                name,
                productivity: stats.count > 0 ? Math.round((stats.total / stats.count)) : 0,
                trend: 'stable' as const,
                members: stats.memberCount
            }))
            .sort((a, b) => b.productivity - a.productivity);

        // Calculate productivity data (top performers)
        const productivityData = members
            .filter(m => m.projectsDelivered > 0)
            .map(m => ({
                name: m.name.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' '),
                productivity: Math.min(100, Math.round((m.pointsEarned / 100) * 100)),
                projects: m.projectsDelivered
            }))
            .sort((a, b) => b.productivity - a.productivity)
            .slice(0, 8);

        // Calculate aggregate metrics
        const totalProjects = Object.values(projectsByCollaborator).reduce((sum, p) => sum + p.count, 0);
        const avgWorkload = activeCount > 0 ? Math.round((totalProjects / activeCount) * 10) / 10 : 0;

        // Efficiency based on how many active members delivered at least 1 project
        const activeWithProjects = members.filter(m => m.projectsDelivered > 0).length;
        const efficiency = activeCount > 0 ? Math.round((activeWithProjects / activeCount) * 100) : 0;

        return {
            activeUsers: activeCount,
            totalCollaborators,
            teamSize: totalCollaborators,
            activeMembers: activeCount,
            avgWorkload,
            goalsMet: 85, // Placeholder
            efficiency,
            members,
            productivityData,
            sectors
        };
    },

    /**
     * Fetches financial metrics - derived from sales data
     */
    getFinancialMetrics: async (filter: DateFilter = 'month', _shared?: SharedData): Promise<FinancialMetrics> => {
        const { start, end } = getDateRange(filter);

        const leadRows: Record<string, unknown>[] = _shared
            ? _shared.leads
            : (await supabase.from('leads').select('*')).data || [];

        const closedStatuses = ['won', 'closed', 'contracted'];
        const openStatuses = ['new', 'qualified', 'negotiation', 'proposal'];

        let currentRevenue = 0;
        let previousRevenue = 0;
        let closedDealsCount = 0;
        let accountsReceivable = 0;

        // Calculate previous period for comparison
        const periodMs = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - periodMs);
        const prevEnd = new Date(start.getTime() - 1);

        leadRows.forEach(row => {
            const createdAt = parseDate(row.created_at);
            const value = (row.estimated_value as number) || 0;
            const status = row.status as string;

            if (createdAt) {
                // Current period closed deals
                if (closedStatuses.includes(status) && createdAt >= start && createdAt <= end) {
                    currentRevenue += value;
                    closedDealsCount += 1;
                }

                // Previous period closed deals
                if (closedStatuses.includes(status) && createdAt >= prevStart && createdAt <= prevEnd) {
                    previousRevenue += value;
                }

                // Open deals = accounts receivable
                if (openStatuses.includes(status)) {
                    accountsReceivable += value;
                }
            }
        });

        // Calculate derived metrics
        const avgTicket = closedDealsCount > 0 ? Math.round(currentRevenue / closedDealsCount) : 0;

        // Placeholder expenses (estimated at 60% of revenue)
        const expenses = Math.round(currentRevenue * 0.6);
        const profit = currentRevenue - expenses;
        const margin = currentRevenue > 0 ? Math.round((profit / currentRevenue) * 100 * 10) / 10 : 0;

        // Generate cash flow for last 6 months
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const now = new Date();
        const cashFlow: FinancialMetrics['cashFlow'] = [];

        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[monthDate.getMonth()];
            const seed = (monthDate.getMonth() + 1) * 0.137;
            const variation = 0.8 + (seed % 0.4);
            const monthRevenue = Math.round(currentRevenue * variation);
            const monthExpenses = Math.round(monthRevenue * 0.6);
            cashFlow.push({
                month: monthName,
                revenue: monthRevenue,
                expenses: monthExpenses,
                balance: monthRevenue - monthExpenses
            });
        }

        // Placeholder operational costs breakdown
        const operationalCosts: FinancialMetrics['operationalCosts'] = [
            { name: 'Salários', value: Math.round(expenses * 0.54), color: '#3b82f6' },
            { name: 'Ferramentas', value: Math.round(expenses * 0.16), color: '#8b5cf6' },
            { name: 'Marketing', value: Math.round(expenses * 0.12), color: '#f59e0b' },
            { name: 'Infra', value: Math.round(expenses * 0.09), color: '#06b6d4' },
            { name: 'Impostos', value: Math.round(expenses * 0.07), color: '#ef4444' },
            { name: 'Outros', value: Math.round(expenses * 0.03), color: '#6b7280' },
        ];

        return {
            revenue: currentRevenue,
            previousRevenue,
            expenses,
            profit,
            margin,
            avgTicket,
            cashFlow,
            operationalCosts,
            accounts: {
                receivable: accountsReceivable,
                payable: Math.round(expenses * 0.36),
                overdue: Math.round(accountsReceivable * 0.12)
            }
        };
    },

    /**
     * Fetches post-sales metrics
     * Note: Currently returns placeholder data - requires tickets/payments collections
     */
    getPostSalesMetrics: async (_filter: DateFilter = 'month', _shared?: SharedData): Promise<PostSalesMetrics> => {
        const collabRows: Record<string, unknown>[] = _shared
            ? _shared.collaborators
            : (await supabase.from('users').select('*')).data || [];

        // Sector ID for "Pós-vendas"
        const POS_VENDAS_SECTOR_ID = '2OByfKttFYPi5Cxbcs2t';

        // Filter post-sales team members (excluding DEBUG account)
        const postSalesTeam = collabRows.filter(row =>
            (row.email as string) !== 'debug@debug.com' &&
            ((row.department as string) === POS_VENDAS_SECTOR_ID || (row.department as string) === 'Pós-vendas')
        );

        // TODO: Fetch from payments collection when available
        const topPostSellers = postSalesTeam.map(row => ({
            id: row.id as string,
            name: (row.name as string) || 'Desconhecido',
            profilePhotoUrl: (row.avatar_url as string) || undefined,
            paymentsReceived: 0,
            ticketsResolved: 0,
            avgRating: 0,
        })).sort((a, b) => b.paymentsReceived - a.paymentsReceived).slice(0, 5);

        // Generate trend data (placeholder - zeros)
        const ticketsTrend: PostSalesMetrics['ticketsTrend'] = [];
        const paymentsTrend: PostSalesMetrics['paymentsTrend'] = [];

        const now = new Date();
        for (let i = 13; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

            ticketsTrend.push({ date: dateStr, opened: 0, resolved: 0 });
            paymentsTrend.push({ date: dateStr, amount: 0 });
        }

        return {
            openTickets: 0,
            resolvedTickets: 0,
            avgResolutionTime: 0,
            customerSatisfaction: 0,
            churnRate: 0,
            retentionRate: 0,
            npsScore: 0,
            ticketsTrend,
            totalPaymentsReceived: 0,
            paymentsTrend,
            topPostSellers,
        };
    },

    /**
     * Fetches all metrics unified.
     * Fetches shared tables ONCE and passes them to all sub-methods,
     * reducing Supabase queries from 9 to 5 per dashboard load.
     */
    getAllMetrics: async (filter: DateFilter = 'month'): Promise<UnifiedDashboardMetrics> => {
        // ── Shared data fetch (1 query per table) ──────────────────────
        const [collaboratorsRes, projectsRes, leadsRes, sectorsRes, rolesRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from(PROJECTS_TABLE).select('*'),
            supabase.from('leads').select('*'),
            Promise.resolve({ data: [] as Record<string, unknown>[] }),
            Promise.resolve({ data: [] as Record<string, unknown>[] }),
        ]);

        const shared: SharedData = {
            collaborators: collaboratorsRes.data || [],
            projects: projectsRes.data || [],
            leads: leadsRes.data || [],
            sectors: sectorsRes.data || [],
            roles: rolesRes.data || [],
        };

        // ── Compute all metrics using shared data ──────────────────────────
        const [production, sales, admin, financial, postSales] = await Promise.all([
            DashboardAnalyticsService.getMetrics(filter, shared),
            DashboardAnalyticsService.getSalesMetrics(filter, shared),
            DashboardAnalyticsService.getAdminMetrics(filter, shared),
            DashboardAnalyticsService.getFinancialMetrics(filter, shared),
            DashboardAnalyticsService.getPostSalesMetrics(filter, shared)
        ]);

        const general: GeneralMetrics = {
            totalRevenue: sales.pipelineValue,
            totalLeads: sales.newLeads,
            totalProjects: production.totalActiveProjects + production.deliveredProjects,
            totalDelivered: production.deliveredProjects,
            conversionRate: sales.conversionRate,
            avgDeliveryTime: production.mvpProducer?.avgDays || 0
        };

        return {
            dateFilter: filter,
            fetchedAt: new Date(),
            general,
            production,
            sales,
            admin,
            financial,
            postSales
        };
    }
};
