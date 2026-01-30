/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONFIGURAÇÃO: PERMISSÕES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de permissões baseado em roles (RBAC).
 * Define o que cada cargo pode acessar e fazer.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Roles disponíveis no sistema
 */
export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    CLOSER_HT: 'closer_ht',  // High Ticket
    CLOSER_LT: 'closer_lt',  // Low Ticket
    SDR: 'sdr',
    PRODUCTION: 'production',
    POST_SALES: 'post_sales',
    VIEWER: 'viewer', // Read-only default
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Permissões disponíveis
 */
export const PERMISSIONS = {
    // Dashboard
    DASHBOARD_VIEW: 'dashboard.view',

    // CRM
    CRM_VIEW: 'crm.view',
    CRM_CREATE: 'crm.create',
    CRM_EDIT: 'crm.edit',
    CRM_DELETE: 'crm.delete',
    CRM_TRANSFER: 'crm.transfer',

    // Inbox
    INBOX_VIEW: 'inbox.view',
    INBOX_SEND: 'inbox.send',
    INBOX_TRANSFER: 'inbox.transfer',

    // Production
    PRODUCTION_VIEW: 'production.view',
    PRODUCTION_MANAGE: 'production.manage',
    PRODUCTION_ASSIGN: 'production.assign',

    // Post-Sales
    POST_SALES_VIEW: 'post_sales.view',
    POST_SALES_MANAGE: 'post_sales.manage',

    // Team
    TEAM_VIEW: 'team.view',
    TEAM_MANAGE: 'team.manage',
    TEAM_CHAT: 'team.chat',

    // Analytics
    ANALYTICS_VIEW: 'analytics.view',
    ANALYTICS_EXPORT: 'analytics.export',

    // Settings
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_EDIT: 'settings.edit',
    SETTINGS_USERS: 'settings.users',
    SETTINGS_ROLES: 'settings.roles',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Matriz de permissões por role
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin tem todas as permissões

    [ROLES.MANAGER]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CRM_VIEW,
        PERMISSIONS.CRM_CREATE,
        PERMISSIONS.CRM_EDIT,
        PERMISSIONS.CRM_TRANSFER,
        PERMISSIONS.INBOX_VIEW,
        PERMISSIONS.INBOX_SEND,
        PERMISSIONS.INBOX_TRANSFER,
        PERMISSIONS.PRODUCTION_VIEW,
        PERMISSIONS.PRODUCTION_ASSIGN,
        PERMISSIONS.POST_SALES_VIEW,
        PERMISSIONS.TEAM_VIEW,
        PERMISSIONS.TEAM_CHAT,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ANALYTICS_EXPORT,
        PERMISSIONS.SETTINGS_VIEW,
    ],

    [ROLES.CLOSER_HT]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CRM_VIEW,
        PERMISSIONS.CRM_CREATE,
        PERMISSIONS.CRM_EDIT,
        PERMISSIONS.INBOX_VIEW,
        PERMISSIONS.INBOX_SEND,
        PERMISSIONS.TEAM_CHAT,
    ],

    [ROLES.CLOSER_LT]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CRM_VIEW,
        PERMISSIONS.CRM_CREATE,
        PERMISSIONS.CRM_EDIT,
        PERMISSIONS.INBOX_VIEW,
        PERMISSIONS.INBOX_SEND,
        PERMISSIONS.TEAM_CHAT,
    ],

    [ROLES.SDR]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CRM_VIEW,
        PERMISSIONS.CRM_CREATE,
        PERMISSIONS.INBOX_VIEW,
        PERMISSIONS.INBOX_SEND,
        PERMISSIONS.TEAM_CHAT,
    ],

    [ROLES.PRODUCTION]: [
        PERMISSIONS.PRODUCTION_VIEW,
        PERMISSIONS.PRODUCTION_MANAGE,
        PERMISSIONS.TEAM_CHAT,
    ],

    [ROLES.POST_SALES]: [
        PERMISSIONS.POST_SALES_VIEW,
        PERMISSIONS.POST_SALES_MANAGE,
        PERMISSIONS.PRODUCTION_VIEW,
        PERMISSIONS.INBOX_VIEW,
        PERMISSIONS.INBOX_SEND,
        PERMISSIONS.TEAM_CHAT,
    ],

    [ROLES.VIEWER]: [],
};

/**
 * Menu items por role (quais items aparecem no sidebar)
 */
export const MENU_ITEMS = {
    dashboard: {
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        permission: PERMISSIONS.DASHBOARD_VIEW,
    },
    crm: {
        label: 'CRM',
        icon: 'Users',
        permission: PERMISSIONS.CRM_VIEW,
    },
    inbox: {
        label: 'Inbox',
        icon: 'MessageSquare',
        permission: PERMISSIONS.INBOX_VIEW,
    },
    production: {
        label: 'Produção',
        icon: 'Video',
        permission: PERMISSIONS.PRODUCTION_VIEW,
    },
    postSales: {
        label: 'Pós-Venda',
        icon: 'Package',
        permission: PERMISSIONS.POST_SALES_VIEW,
    },
    team: {
        label: 'Equipe',
        icon: 'UsersRound',
        permission: PERMISSIONS.TEAM_VIEW,
    },
    analytics: {
        label: 'Analytics',
        icon: 'BarChart3',
        permission: PERMISSIONS.ANALYTICS_VIEW,
    },
    settings: {
        label: 'Configurações',
        icon: 'Settings',
        permission: PERMISSIONS.SETTINGS_VIEW,
    },
} as const;

/**
 * Helper: verifica se um role tem uma permissão
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Helper: retorna todas as permissões de um role
 */
export function getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}
