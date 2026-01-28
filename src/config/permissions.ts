
export type UserRole =
    | 'admin'
    | 'sdr'
    | 'closer_ht'
    | 'closer_lt'
    | 'production'
    | 'post_sales'
    | 'manager_sales'
    | 'manager_production'
    | 'strategic';

export const ROUTES = {
    LAUNCHPAD: '/team',
    MY_WORKSPACE: '/workspace/me',
    FINANCE: '/finance',
    CRM: '/leads',
    PRODUCTION_BOARD: '/production',
    POST_SALES: '/post-sales',
    SETTINGS: '/settings',
};

export const PERMISSIONS = {
    // Supervisor Mode (Launchpad)
    canViewTeam: ['admin', 'manager_sales', 'manager_production', 'strategic', 'sdr'],

    // Module Access
    canAccessFinance: ['admin', 'strategic', 'post_sales'],
    canAccessSales: ['admin', 'manager_sales', 'sdr', 'closer_ht', 'closer_lt'],
    canAccessProduction: ['admin', 'manager_production', 'production', 'post_sales'],
    canAccessPostSales: ['admin', 'strategic', 'post_sales', 'manager_sales'],

    // Administrative
    canManageUsers: ['admin', 'manager_sales', 'manager_production', 'strategic'],
    canDeleteLeads: ['admin', 'strategic'],
};

// Navigation/Menu Access - which roles can see which menu items
export const NAV_PERMISSIONS: Record<string, string[]> = {
    dashboard: ['admin', 'strategic'],
    kanban: ['admin', 'strategic', 'closer_ht', 'closer_lt', 'sdr', 'manager_sales', 'production', 'post_sales', 'manager_production'],
    inbox: ['admin', 'strategic', 'closer_ht', 'closer_lt', 'sdr', 'manager_sales', 'production', 'post_sales', 'manager_production'],
    contatos: ['admin', 'strategic', 'closer_ht', 'closer_lt', 'sdr', 'manager_sales', 'production', 'post_sales', 'manager_production'],
    producao: ['admin', 'strategic', 'production', 'manager_production'],
    equipe: ['admin', 'strategic', 'manager_sales', 'manager_production'],
    automacoes: ['admin', 'strategic'],
    configuracoes: ['admin', 'strategic'],
    personal: ['admin', 'strategic', 'closer_ht', 'closer_lt', 'sdr', 'manager_sales', 'production', 'post_sales', 'manager_production'],
};

export const canAccess = (role: string, requiredRoles: string[] | 'ALL') => {
    if (requiredRoles === 'ALL') return true;
    return requiredRoles.includes(role);
};

// Check if user can see a navigation item
export const canAccessNav = (role: string, navId: string): boolean => {
    const allowedRoles = NAV_PERMISSIONS[navId];
    if (!allowedRoles) {
        // Default: only admin/strategic if not defined
        return role === 'admin' || role === 'strategic';
    }
    return allowedRoles.includes(role);
};

// Role display names (Portuguese)
export const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    strategic: 'Estratégico',
    manager_sales: 'Gerente Vendas',
    manager_production: 'Gerente Produção',
    closer_ht: 'Vendas HT',
    closer_lt: 'Vendas LT',
    sdr: 'SDR',
    production: 'Produção',
    post_sales: 'Pós-Venda',
};

// Sector definitions for sidebar board navigation
export interface Sector {
    id: string;
    label: string;
    icon: string;
    roles: string[];
    pipeline?: string; // Optional: specific pipeline for this sector
}

export const SECTORS: Sector[] = [
    {
        id: 'vendas',
        label: 'Vendas',
        icon: 'DollarSign',
        roles: ['closer_ht', 'closer_lt', 'sdr', 'manager_sales'],
        pipeline: 'high_ticket' // or 'low_ticket' - shows both for vendas
    },
    {
        id: 'producao',
        label: 'Produção',
        icon: 'Clapperboard',
        roles: ['production', 'manager_production'],
        pipeline: 'production'
    },
    {
        id: 'pos_venda',
        label: 'Pós-Venda',
        icon: 'HeartHandshake',
        roles: ['post_sales'],
        pipeline: 'post_sales'
    }
];

// Check if user can see a sector in sidebar
export const canSeeSector = (userRole: string, sectorId: string): boolean => {
    // Admin and strategic can see all sectors
    if (userRole === 'admin' || userRole === 'strategic') {
        return true;
    }

    const sector = SECTORS.find(s => s.id === sectorId);
    if (!sector) return false;

    return sector.roles.includes(userRole);
};

// Check if user can see all users in a sector (admin/manager)
export const canSeeAllUsersInSector = (userRole: string): boolean => {
    return ['admin', 'strategic', 'manager_sales', 'manager_production'].includes(userRole);
};

// Get sector for a given role
export const getSectorForRole = (role: string): Sector | undefined => {
    return SECTORS.find(sector => sector.roles.includes(role));
};
