export const PERMISSIONS = {
    VIEW_CRM: 'view_crm',
    VIEW_PRODUCTION: 'view_production',
    MANAGE_PROJECTS: 'manage_projects',
    VIEW_POST_SALES: 'view_post_sales',
    MANAGE_POST_SALES_DISTRIBUTION: 'manage_post_sales_distribution',
    VIEW_ADMIN: 'view_admin',
    VIEW_STRATEGIC: 'view_strategic',
    VIEW_FINANCIAL: 'view_financial',
    // Dashboard section permissions
    VIEW_DASHBOARD_SALES: 'view_dashboard_sales',
    VIEW_DASHBOARD_PRODUCTION: 'view_dashboard_production',
    VIEW_DASHBOARD_FINANCIAL: 'view_dashboard_financial',
    VIEW_DASHBOARD_ADMIN: 'view_dashboard_admin',
    VIEW_DASHBOARD_POST_SALES: 'view_dashboard_post_sales',
} as const;

export const PERMISSION_LABELS: Record<string, string> = {
    [PERMISSIONS.VIEW_CRM]: 'CRM',
    [PERMISSIONS.VIEW_PRODUCTION]: 'Produção',
    [PERMISSIONS.MANAGE_PROJECTS]: 'Distribuição Projetos',
    [PERMISSIONS.VIEW_POST_SALES]: 'Pós-Vendas',
    [PERMISSIONS.MANAGE_POST_SALES_DISTRIBUTION]: 'Distribuição\nPós-Vendas',
    [PERMISSIONS.VIEW_ADMIN]: 'Configurações',
    [PERMISSIONS.VIEW_STRATEGIC]: 'Estratégico',
    [PERMISSIONS.VIEW_FINANCIAL]: 'Financeiro',
    // Dashboard
    [PERMISSIONS.VIEW_DASHBOARD_SALES]: '📊 Vendas',
    [PERMISSIONS.VIEW_DASHBOARD_POST_SALES]: '📊 Pós-Vendas',
    [PERMISSIONS.VIEW_DASHBOARD_PRODUCTION]: '📊 Produção',
    [PERMISSIONS.VIEW_DASHBOARD_FINANCIAL]: '📊 Financeiro',
    [PERMISSIONS.VIEW_DASHBOARD_ADMIN]: '📊 Admin',
};

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    [PERMISSIONS.VIEW_CRM]: 'Acesso ao Kanban de vendas, leads e base de contatos',
    [PERMISSIONS.VIEW_PRODUCTION]: 'Visualizar projetos em produção e atualizar status',
    [PERMISSIONS.MANAGE_PROJECTS]: 'Criar, editar e atribuir projetos aos produtores',
    [PERMISSIONS.VIEW_POST_SALES]: 'Acesso ao módulo de pós-vendas e carteira de clientes',
    [PERMISSIONS.MANAGE_POST_SALES_DISTRIBUTION]: 'Distribuir clientes entre pós-vendedores',
    [PERMISSIONS.VIEW_ADMIN]: 'Acesso a configurações: cargos, setores, equipe e permissões',
    [PERMISSIONS.VIEW_STRATEGIC]: 'Acesso ao módulo estratégico e planejamento',
    [PERMISSIONS.VIEW_FINANCIAL]: 'Acesso ao módulo financeiro: fluxo de caixa, transações e categorias',
    // Dashboard
    [PERMISSIONS.VIEW_DASHBOARD_SALES]: 'Ver métricas e indicadores de vendas no dashboard',
    [PERMISSIONS.VIEW_DASHBOARD_POST_SALES]: 'Ver métricas de pós-vendas no dashboard',
    [PERMISSIONS.VIEW_DASHBOARD_PRODUCTION]: 'Ver métricas de produção no dashboard',
    [PERMISSIONS.VIEW_DASHBOARD_FINANCIAL]: 'Ver métricas financeiras no dashboard',
    [PERMISSIONS.VIEW_DASHBOARD_ADMIN]: 'Ver métricas administrativas no dashboard',
};

/**
 * Ordem lógica das permissões na matriz.
 * Módulos primeiro (fluxo operacional), depois Dashboard (agrupado por setor).
 */
export const PERMISSION_ORDER: string[] = [
    // Módulos
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.VIEW_PRODUCTION,
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.VIEW_POST_SALES,
    PERMISSIONS.MANAGE_POST_SALES_DISTRIBUTION,
    PERMISSIONS.VIEW_STRATEGIC,
    PERMISSIONS.VIEW_ADMIN,
    PERMISSIONS.VIEW_FINANCIAL,
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD_SALES,
    PERMISSIONS.VIEW_DASHBOARD_POST_SALES,
    PERMISSIONS.VIEW_DASHBOARD_PRODUCTION,
    PERMISSIONS.VIEW_DASHBOARD_FINANCIAL,
    PERMISSIONS.VIEW_DASHBOARD_ADMIN,
];
