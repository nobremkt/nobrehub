/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONFIGURAÇÃO: ROTAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Definição centralizada de rotas da aplicação.
 * Facilita manutenção e previne hardcoding de paths.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const ROUTES = {
    // Auth
    auth: {
        login: '/login',
        logout: '/logout',
        forgotPassword: '/forgot-password',
    },

    // Main
    dashboard: '/',
    debug_ui: '/debug-ui',
    data_import: '/data-import',

    // CRM
    crm: {
        root: '/crm',
        kanban: '/crm/kanban',
        leads: '/crm/leads',
        lead: (id: string) => `/crm/leads/${id}`,
    },

    // Inbox
    inbox: {
        root: '/inbox',
        conversation: (id: string) => `/inbox/${id}`,
    },

    // Production
    production: {
        root: '/producao',
        project: (id: string) => `/producao/${id}`,
        producer: (id: string) => `/producao/produtor/${id}`,
    },

    // Post-Sales
    postSales: {
        root: '/pos-venda',
    },

    // Team
    team: {
        root: '/equipe',
        members: '/equipe/membros',
        member: (id: string) => `/equipe/membros/${id}`,
        chat: '/equipe/chat',
    },

    // Analytics
    analytics: {
        root: '/analytics',
    },

    // Settings
    settings: {
        root: '/configuracoes',
        organization: '/configuracoes/organizacao',
        pipeline: '/configuracoes/pipeline',
        products: '/configuracoes/produtos',
        lossReasons: '/configuracoes/motivos-perda',
        customFields: '/configuracoes/campos-customizados',
        integrations: '/configuracoes/integracoes',
        permissions: '/configuracoes/permissoes',
        sectors: '/configuracoes/setores',
        roles: '/configuracoes/cargos',
        appearance: '/configuracoes/aparencia',
        collaborators: '/configuracoes/colaboradores',
        goals: '/configuracoes/metas',
        holidays: '/configuracoes/feriados',
    },
} as const;

/**
 * Rotas que não requerem autenticação
 */
export const PUBLIC_ROUTES = [
    ROUTES.auth.login,
    ROUTES.auth.forgotPassword,
] as const;
