/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPES: COMMON
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Types utilitários e comuns usados em toda aplicação.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Response padrão para operações assíncronas
 */
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    status: 'success' | 'error';
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Response paginada
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Filtro genérico
 */
export interface FilterOption {
    label: string;
    value: string;
    count?: number;
}

/**
 * Estado de async operations
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Mensagem do sistema
 */
export interface SystemMessage {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    message: string;
    duration?: number;
}

/**
 * Opções para Select/Dropdown
 */
export interface SelectOption<T = string> {
    label: string;
    value: T;
    disabled?: boolean;
    icon?: string;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: string;
}

/**
 * Timestamp fields padrão
 */
export interface Timestamps {
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Ação em lote
 */
export interface BulkAction<T = string> {
    id: string;
    label: string;
    icon?: string;
    action: (ids: T[]) => Promise<void>;
    confirmMessage?: string;
}
