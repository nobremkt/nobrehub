export const PERMISSIONS = {
    VIEW_CRM: 'view_crm',
    VIEW_PRODUCTION: 'view_production',
    MANAGE_PROJECTS: 'manage_projects',
    VIEW_POST_SALES: 'view_post_sales', // Fixed key
    VIEW_ADMIN: 'view_admin', // Configurações, Usuários, etc.
} as const;

export const PERMISSION_LABELS = {
    [PERMISSIONS.VIEW_CRM]: 'Visualizar CRM',
    [PERMISSIONS.VIEW_PRODUCTION]: 'Visualizar Produção',
    [PERMISSIONS.MANAGE_PROJECTS]: 'Gerenciar Projetos',
    [PERMISSIONS.VIEW_POST_SALES]: 'Visualizar Pós-Vendas',
    [PERMISSIONS.VIEW_ADMIN]: 'Administração',
};
