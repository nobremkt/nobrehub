
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
    canViewTeam: ['admin', 'manager_sales', 'manager_production', 'strategic', 'sdr'], // SDR helps distribute? Maybe not.

    // Module Access
    canAccessFinance: ['admin', 'strategic', 'post_sales'],
    canAccessSales: ['admin', 'manager_sales', 'sdr', 'closer_ht', 'closer_lt'],
    canAccessProduction: ['admin', 'manager_production', 'production', 'post_sales'],
    canAccessPostSales: ['admin', 'strategic', 'post_sales', 'manager_sales'],

    // Administrative
    canManageUsers: ['admin', 'manager_sales', 'manager_production', 'strategic'],
    canDeleteLeads: ['admin', 'strategic'],
};

export const canAccess = (role: string, requiredRoles: string[] | 'ALL') => {
    if (requiredRoles === 'ALL') return true;
    return requiredRoles.includes(role);
};
