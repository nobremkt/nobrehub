/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DASHBOARD TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shared type definitions for all dashboard metric services
 */

// ─── Date Filter ────────────────────────────────────────────────────────────

export type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | '2025' | '2026' | (string & {});

// ─── Internal ───────────────────────────────────────────────────────────────

/** Internal project structure (supports both legacy and imported) */
export interface InternalProject {
    id: string;
    title: string;
    producerId: string;
    producerName?: string;
    category: string;
    difficulty?: string;
    points: number;
    status: string;
    type?: string;
    motivo?: string;
    deliveredAt?: Date;
    createdAt: Date;
    isHistorical?: boolean;
    internalRevisionCount?: number;
}

// ─── Production Metrics ─────────────────────────────────────────────────────

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

// ─── Sales Metrics ──────────────────────────────────────────────────────────

export interface SalesMetrics {
    newLeads: number;
    qualifiedLeads: number;
    closedDeals: number;
    lostDeals: number;
    pipelineValue: number;
    conversionRate: number;
    leadsByPipeline: { pipeline: string; count: number }[];
    leadsByStatus: { status: string; count: number; value: number }[];
    topSellers: { name: string; deals: number; value: number }[];
    trendData: { date: string; leads: number; closed: number }[];
    sourceData: { source: string; count: number }[];
    performanceMetrics: {
        avgResponseTime: number;
        avgCycleTime: number;
        contactRate: number;
        followUpRate: number;
    };
}

// ─── General Metrics ────────────────────────────────────────────────────────

export interface GeneralMetrics {
    totalRevenue: number;
    totalLeads: number;
    totalProjects: number;
    totalDelivered: number;
    conversionRate: number;
    avgDeliveryTime: number;
}

// ─── Admin Metrics ──────────────────────────────────────────────────────────

export interface AdminMetrics {
    activeUsers: number;
    totalCollaborators: number;
    teamSize: number;
    activeMembers: number;
    avgWorkload: number;
    goalsMet: number;
    efficiency: number;
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

// ─── Financial Metrics ──────────────────────────────────────────────────────

export interface FinancialMetrics {
    /** Real revenue: actual money received (from manager's spreadsheet / real_revenue table) */
    revenue: number;
    previousRevenue: number;
    /** Contracted revenue: value sold in commercial_sales (not yet collected) */
    contractedRevenue: number;
    expenses: number;
    /** profit = revenue (real) - expenses */
    profit: number;
    /** margin = profit / revenue (real) */
    margin: number;
    avgTicket: number;
    cashFlow: { month: string; revenue: number; expenses: number; balance: number }[];
    operationalCosts: { name: string; value: number; color: string }[];
}

// ─── Post-Sales Metrics ─────────────────────────────────────────────────────

export interface PostSalesMetrics {
    totalReceipts: number;
    totalSales: number;
    uniqueClientsReceipts: number;
    uniqueClientsSales: number;
    churnRate: number;
    retentionRate: number;
    /** Number of commercial clients in the period */
    commercialClients: number;
    /** Of those, how many ended up with pending debits */
    clientsWithDebits: number;
    ltv: number;
    avgReceiptValue: number;
    debitosPending: number;
    debitosTotal: number;
    cac: number;
    topPostSellers: {
        id: string;
        name: string;
        profilePhotoUrl?: string;
        totalReceived: number;
        receiptCount: number;
        uniqueClients: number;
    }[];
}


// ─── Unified ────────────────────────────────────────────────────────────────

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

// ─── Shared internal types ──────────────────────────────────────────────────

/** Collaborators data with name map and producer count */
export interface CollaboratorsData {
    nameMap: Record<string, string>;
    photoMap: Record<string, string>;
    producerCount: number;
}

/** Supabase row arrays, shared across sub-methods within getAllMetrics() */
export interface SharedData {
    collaborators: Record<string, unknown>[];
    projects: Record<string, unknown>[];
    leads: Record<string, unknown>[];
    sectors: Record<string, unknown>[];
    roles: Record<string, unknown>[];
}
