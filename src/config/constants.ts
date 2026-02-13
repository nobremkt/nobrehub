/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONFIGURAÇÃO: CONSTANTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Constantes globais da aplicação.
 * Centraliza valores que podem mudar no futuro.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const APP_CONFIG = {
    name: 'Nobre Hub',
    version: '2.0.0',
    company: 'Nobre Marketing',

    // API & Network
    api: {
        timeout: 10000,
        retries: 3,
        retryDelay: 1000,
    },

    // Paginação
    pagination: {
        defaultLimit: 20,
        maxLimit: 100,
        defaultPage: 1,
    },

    // Storage keys
    storage: {
        theme: 'nobre-hub-theme',
        authToken: 'nobre-hub-auth',
        user: 'nobre-hub-user',
        sidebarCollapsed: 'nobre-hub-sidebar',
    },

    // Datas
    dateFormats: {
        display: 'dd/MM/yyyy',
        displayTime: 'dd/MM/yyyy HH:mm',
        api: 'yyyy-MM-dd',
        time: 'HH:mm',
    },
} as const;

export const PIPELINE_COLORS = {
    lead: {
        novo: '#3b82f6',      // Blue
        qualificado: '#8b5cf6', // Purple
        proposta: '#f59e0b',    // Amber
        negociacao: '#f97316',  // Orange
        fechado: '#22c55e',     // Green
        perdido: '#ef4444',     // Red
    },
    production: {
        aguardando: '#94a3b8',  // Gray
        'em-producao': '#3b82f6', // Blue
        'a-revisar': '#f59e0b',   // Amber
        revisado: '#22c55e',      // Green
        alteracao: '#ef4444',     // Red
    },
} as const;

export const STATUS_LABELS = {
    lead: {
        novo: 'Novo',
        qualificado: 'Qualificado',
        proposta: 'Proposta',
        negociacao: 'Negociação',
        fechado: 'Fechado',
        perdido: 'Perdido',
    },
    production: {
        aguardando: 'Aguardando',
        'em-producao': 'Em Produção',
        'a-revisar': 'A Revisar',
        revisado: 'Revisado',
        alteracao: 'Alteração',
    },
    user: {
        active: 'Ativo',
        inactive: 'Inativo',
    },
} as const;

// ─── Hardcoded Supabase/Firestore IDs (single source of truth) ───────────────

export const SECTOR_IDS = {
    PRODUCAO: '7OhlXcRc8Vih9n7p4PdZ',
    POS_VENDAS: '2OByfKttFYPi5Cxbcs2t',
    VENDAS: 'vQIAMfIXt1xKWXHG2Scq',
    ESTRATEGICO: 'zeekJ4iY9voX3AURpar5',
    GERENCIA: 'YIK77HEH6qESkWzVYvXK',
} as const;

export const LIDER_ROLE_ID = '2Qb0NHjub0kaYFYDITqQ';

export const STRATEGIC_SECTOR_ID = SECTOR_IDS.ESTRATEGICO;
