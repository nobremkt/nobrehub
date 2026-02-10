/**
 * Shared project status helpers for the Production module.
 * Used by ProjectBoard, ProducersSidebar, and any component that displays project status.
 */

const STATUS_LABELS: Record<string, string> = {
    'aguardando': 'Aguardando',
    'em-producao': 'Em Produção',
    'a-revisar': 'A Revisar',
    'revisado': 'Revisado',
    'alteracao': 'Em Alteração',
};

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
    'aguardando': 'default',
    'em-producao': 'primary',
    'a-revisar': 'warning',
    'revisado': 'success',
    'alteracao': 'warning',
};

export const getStatusLabel = (status: string): string =>
    STATUS_LABELS[status] || status;

export const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' =>
    STATUS_COLORS[status] || 'default';
