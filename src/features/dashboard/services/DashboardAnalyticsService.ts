/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DASHBOARD ANALYTICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Aggregates production data for dashboard metrics
 * Supports both legacy projects and historical imported data
 */

import {
    collection,
    getDocs,
    query,
    Timestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Lead } from '@/types/lead.types';
import { HolidaysService } from '@/features/settings/services/holidaysService';

const PROJECTS_COLLECTION = 'projects';

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
    activeProducers: number;
    totalPoints: number;
    mvpProducer: { name: string; projects: number } | null;
    fastestProducer: { name: string; avgDays: number } | null;
    topPointsProducer: { name: string; points: number } | null;
    topProjectsProducer: { name: string; count: number } | null;
    rocketProducer: { name: string; points: number; inDays: number } | null;
    finisherProducer: { name: string; count: number; inDays: number } | null;
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
}

/** Unified dashboard metrics - aggregates all sections */
export interface UnifiedDashboardMetrics {
    dateFilter: DateFilter;
    fetchedAt: Date;
    general: GeneralMetrics;
    production: ProductionMetrics;
    sales: SalesMetrics;
    admin: AdminMetrics;
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
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return { start: weekAgo, end: now };
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
            // Fixed range for imported historical data
            const jan2026Start = new Date(2026, 0, 1); // Jan 1, 2026
            const jan2026End = new Date(2026, 0, 31, 23, 59, 59); // Jan 31, 2026
            return { start: jan2026Start, end: jan2026End };
        }
        default:
            return { start: today, end: now };
    }
}

/** Parse date from various formats */
function parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return undefined;
}

/** Collaborators data with name map and producer count */
interface CollaboratorsData {
    nameMap: Record<string, string>;
    producerCount: number;
}

// Sector ID for "Produção"
const PRODUCAO_SECTOR_ID = '7OhlXcRc8Vih9n7p4PdZ';

// Role ID for "Líder" (to be excluded from producer count)
const LIDER_ROLE_ID = '2Qb0NHjub0kaYFYDITqQ';

/** Fetch collaborators data for name lookups and producer counting */
async function getCollaboratorsData(): Promise<CollaboratorsData> {
    // Fetch collaborators
    const collabRef = collection(db, 'collaborators');
    const snapshot = await getDocs(collabRef);

    const nameMap: Record<string, string> = {};
    let producerCount = 0;

    snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const name = data.name || data.displayName || 'Desconhecido';

        // Add to name map (all collaborators)
        nameMap[docSnap.id] = name;

        // Count producers: sectorId = Produção AND roleId != Líder
        const sectorId = data.sectorId || '';
        const roleId = data.roleId || '';

        if (sectorId === PRODUCAO_SECTOR_ID && roleId !== LIDER_ROLE_ID) {
            producerCount++;
        }
    });

    return { nameMap, producerCount };
}

/** Goal configuration interface */
interface GoalConfig {
    dailyProductionGoal: number;
    workdaysPerWeek: number;
    workdaysPerMonth: number;
}

/** Fetch goal configuration from Firebase */
async function getGoalConfig(): Promise<GoalConfig> {
    const DEFAULT_CONFIG: GoalConfig = {
        dailyProductionGoal: 100,
        workdaysPerWeek: 5,
        workdaysPerMonth: 22
    };

    try {
        const docRef = doc(db, 'settings/goals');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                dailyProductionGoal: data.dailyProductionGoal ?? DEFAULT_CONFIG.dailyProductionGoal,
                workdaysPerWeek: data.workdaysPerWeek ?? DEFAULT_CONFIG.workdaysPerWeek,
                workdaysPerMonth: data.workdaysPerMonth ?? DEFAULT_CONFIG.workdaysPerMonth
            };
        }

        return DEFAULT_CONFIG;
    } catch (error) {
        console.error('Error fetching goal config:', error);
        return DEFAULT_CONFIG;
    }
}

/** 
 * Calculate actual workdays in a period, excluding non-working days and holidays 
 * @param startDate - Start of period
 * @param endDate - End of period
 * @param workdaysPerWeek - How many days the team works per week (5 = Mon-Fri, 6 = Mon-Sat)
 * Returns the number of workdays (excluding holidays)
 */
async function getWorkdaysInPeriod(
    startDate: Date,
    endDate: Date,
    workdaysPerWeek: number = 5
): Promise<number> {
    // Get holidays for the years covered by the period
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

    // Determine max day of week based on config
    // Sunday = 0, Monday = 1, ... Saturday = 6
    // If workdaysPerWeek = 5 -> Mon-Fri (1-5)
    // If workdaysPerWeek = 6 -> Mon-Sat (1-6)
    const maxDayOfWeek = workdaysPerWeek >= 6 ? 6 : 5;

    while (current <= end) {
        const dayOfWeek = current.getDay();
        const dateStr = current.toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if it's a workday (Mon=1 to maxDay) and not a holiday
        // Sunday (0) is always a day off
        if (dayOfWeek >= 1 && dayOfWeek <= maxDayOfWeek && !holidayDates.has(dateStr)) {
            workdays++;
        }

        // Move to next day
        current.setDate(current.getDate() + 1);
    }

    return workdays;
}

/** 
 * Calculate goal target based on period filter 
 * Now async to fetch holidays and calculate actual workdays
 */
async function calculateGoalForPeriod(
    config: GoalConfig,
    period: DateFilter,
    startDate: Date,
    endDate: Date
): Promise<number> {
    // For "today" or "yesterday", check if it's a workday
    if (period === 'today' || period === 'yesterday') {
        const workdays = await getWorkdaysInPeriod(startDate, endDate, config.workdaysPerWeek);
        return workdays > 0 ? config.dailyProductionGoal : 0;
    }

    // For other periods, calculate actual workdays using config
    const workdays = await getWorkdaysInPeriod(startDate, endDate, config.workdaysPerWeek);
    return config.dailyProductionGoal * workdays;
}

export const DashboardAnalyticsService = {
    /**
     * Fetches all projects and calculates dashboard metrics
     */
    getMetrics: async (filter: DateFilter = 'month'): Promise<DashboardMetrics> => {
        const { start, end } = getDateRange(filter);

        // Fetch collaborators for name resolution and producer count
        const { nameMap: collaboratorsMap, producerCount } = await getCollaboratorsData();

        // Fetch all projects
        const projectsRef = collection(db, PROJECTS_COLLECTION);
        const snapshot = await getDocs(query(projectsRef));

        const allProjects: InternalProject[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || data.name || '',
                producerId: data.producerId || '',
                producerName: collaboratorsMap[data.producerId] || data.producerName || 'Desconhecido',
                category: data.category || data.tags?.[0] || 'Outro',
                difficulty: data.difficulty,
                points: Number(data.points) || 1, // Default 1 point if not specified
                status: data.status || 'entregue',
                type: data.type,
                motivo: data.motivo,
                deliveredAt: parseDate(data.deliveredAt),
                createdAt: parseDate(data.createdAt) || new Date(),
                isHistorical: data.isHistorical || false
            };
        });

        // Filter by type: exclude alteracoes from main projects count
        const projects = allProjects.filter(p => p.type !== 'alteracao' && p.status !== 'alteracao');
        const alteracoes = allProjects.filter(p => p.type === 'alteracao' || p.status === 'alteracao');

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
            p.deliveredAt || p.status === 'entregue' || p.isHistorical
        );
        const deliveredCount = deliveredProjects.length;

        // Total points in period
        const totalPointsInPeriod = deliveredProjects.reduce((sum, p) => sum + p.points, 0);

        // Get producer count (sector Produção, excluding Líder role)
        const producersForGoal = Math.max(producerCount, 1); // At least 1 to avoid division by zero

        // Fetch goal from Firebase (individual goal per producer)
        const goalConfig = await getGoalConfig();
        // Team goal = Individual goal × Total producers × Workdays in period (excluding holidays)
        const individualGoalForPeriod = await calculateGoalForPeriod(goalConfig, filter, start, end);
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

        // Producer ranking by POINTS
        const producerPointsMap: Record<string, { name: string; points: number; count: number }> = {};
        deliveredProjects.forEach(p => {
            if (!producerPointsMap[p.producerId]) {
                producerPointsMap[p.producerId] = { name: p.producerName || 'Desconhecido', points: 0, count: 0 };
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
        // Use total registered producers from database for consistency
        const activeProducers = producersForGoal;

        // Highlights - MVP (most points)
        const mvpEntry = producerRanking[0];
        const mvpProducer = mvpEntry
            ? { name: mvpEntry.name, projects: mvpEntry.count }
            : null;

        // Top points producer
        const topPointsProducer = mvpEntry
            ? { name: mvpEntry.name, points: mvpEntry.points }
            : null;

        // Top projects producer (by count)
        const topProjectsEntry = Object.values(producerPointsMap)
            .sort((a, b) => b.count - a.count)[0];
        const topProjectsProducer = topProjectsEntry
            ? { name: topProjectsEntry.name, count: topProjectsEntry.count }
            : null;

        // Fastest producer (lowest avg delivery time)
        const producerDeliveryTimes: Record<string, { name: string; totalDays: number; count: number }> = {};
        deliveredProjects.forEach(p => {
            if (p.deliveredAt && p.createdAt) {
                const days = Math.max(0, Math.ceil((p.deliveredAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                if (!producerDeliveryTimes[p.producerId]) {
                    producerDeliveryTimes[p.producerId] = { name: p.producerName || 'Desconhecido', totalDays: 0, count: 0 };
                }
                producerDeliveryTimes[p.producerId].totalDays += days;
                producerDeliveryTimes[p.producerId].count += 1;
            }
        });
        const fastestProducerEntry = Object.values(producerDeliveryTimes)
            .filter(p => p.count > 0)
            .map(p => ({ name: p.name, avgDays: Math.round(p.totalDays / p.count) }))
            .sort((a, b) => a.avgDays - b.avgDays)[0];
        const fastestProducer = fastestProducerEntry || null;

        // Rocket (most points in shortest time)
        const rocketProducer = topPointsProducer && fastestProducer
            ? { name: topPointsProducer.name, points: topPointsProducer.points, inDays: fastestProducer.avgDays || 1 }
            : null;

        // Finisher (most projects in shortest time)
        const finisherProducer = topProjectsProducer
            ? { name: topProjectsProducer.name, count: topProjectsProducer.count, inDays: 1 }
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
            activeProducers,
            totalPoints: totalPointsInPeriod,
            mvpProducer,
            fastestProducer,
            topPointsProducer,
            topProjectsProducer,
            rocketProducer,
            finisherProducer
        };
    },

    /**
     * Fetches sales/CRM metrics from leads collection
     */
    getSalesMetrics: async (filter: DateFilter = 'month'): Promise<SalesMetrics> => {
        const { start, end } = getDateRange(filter);

        const leadsRef = collection(db, 'leads');
        const snapshot = await getDocs(leadsRef);

        const allLeads: Lead[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: parseDate(data.createdAt) || new Date(),
                updatedAt: parseDate(data.updatedAt) || new Date(),
            } as Lead;
        });

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

        return {
            newLeads,
            qualifiedLeads,
            closedDeals,
            lostDeals,
            pipelineValue,
            conversionRate,
            leadsByPipeline,
            leadsByStatus,
            topSellers
        };
    },

    /**
     * Fetches admin metrics
     */
    getAdminMetrics: async (): Promise<AdminMetrics> => {
        const collabRef = collection(db, 'collaborators');
        const collabSnapshot = await getDocs(collabRef);
        const totalCollaborators = collabSnapshot.size;

        const activeUsers = collabSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.isActive !== false;
        }).length;

        return {
            activeUsers,
            totalCollaborators
        };
    },

    /**
     * Fetches all metrics unified
     */
    getAllMetrics: async (filter: DateFilter = 'month'): Promise<UnifiedDashboardMetrics> => {
        const [production, sales, admin] = await Promise.all([
            DashboardAnalyticsService.getMetrics(filter),
            DashboardAnalyticsService.getSalesMetrics(filter),
            DashboardAnalyticsService.getAdminMetrics()
        ]);

        const general: GeneralMetrics = {
            totalRevenue: sales.pipelineValue,
            totalLeads: sales.newLeads,
            totalProjects: production.totalActiveProjects + production.deliveredProjects,
            totalDelivered: production.deliveredProjects,
            conversionRate: sales.conversionRate,
            avgDeliveryTime: production.fastestProducer?.avgDays || 0
        };

        return {
            dateFilter: filter,
            fetchedAt: new Date(),
            general,
            production,
            sales,
            admin
        };
    }
};
