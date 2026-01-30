export const PERMISSIONS = {
    VIEW_CRM: 'view_crm',
    VIEW_PRODUCTION: 'view_production',
    VIEW_POST_SALES: 'view_post_sales',
    VIEW_ADMIN: 'view_admin', // Configurações, Usuários, etc.
} as const;

export const PERMISSION_LABELS = {
    [PERMISSIONS.VIEW_CRM]: 'Visualizar CRM',
    [PERMISSIONS.VIEW_PRODUCTION]: 'Visualizar Produção',
    [PERMISSIONS.VIEW_POST_SALES]: 'Visualizar Pós-Vendas',
    [PERMISSIONS.VIEW_ADMIN]: 'Administração',
};
