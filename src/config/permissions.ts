export const PERMISSIONS = {
    VIEW_CRM: 'view_crm',
    VIEW_PRODUCTION: 'view_production',
    MANAGE_PROJECTS: 'manage_projects',
    VIEW_POST_SALES: 'view_post_sales',
    VIEW_ADMIN: 'view_admin',
    // Dashboard section permissions
    VIEW_DASHBOARD_SALES: 'view_dashboard_sales',
    VIEW_DASHBOARD_PRODUCTION: 'view_dashboard_production',
    VIEW_DASHBOARD_FINANCIAL: 'view_dashboard_financial',
    VIEW_DASHBOARD_ADMIN: 'view_dashboard_admin',
} as const;

export const PERMISSION_LABELS = {
    [PERMISSIONS.VIEW_CRM]: 'Visualizar CRM',
    [PERMISSIONS.VIEW_PRODUCTION]: 'Visualizar Produção',
    [PERMISSIONS.MANAGE_PROJECTS]: 'Gerenciar Projetos',
    [PERMISSIONS.VIEW_POST_SALES]: 'Visualizar Pós-Vendas',
    [PERMISSIONS.VIEW_ADMIN]: 'Administração',
    // Dashboard section labels
    [PERMISSIONS.VIEW_DASHBOARD_SALES]: 'Ver métricas de Vendas',
    [PERMISSIONS.VIEW_DASHBOARD_PRODUCTION]: 'Ver métricas de Produção',
    [PERMISSIONS.VIEW_DASHBOARD_FINANCIAL]: 'Ver métricas Financeiras',
    [PERMISSIONS.VIEW_DASHBOARD_ADMIN]: 'Ver métricas de Administração',
};
