/**
 * Centralized database collection names.
 *
 * Keeps Firestore collection references consistent across features
 * (CRM, Produção, Pós-vendas, Analytics).
 */
export const COLLECTIONS = {
    LEADS: 'leads',
    PRODUCTION_PROJECTS: 'projects',
} as const;

