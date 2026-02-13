/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE CONTACTS TABLE — sorting, column configuration, and cell helpers
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useLocalStorage } from '@/hooks';

// ─── Types ────────────────────────────────────────────────────────────────

export interface Contact {
    id: string;
    name: string;
    email?: string;
    phone: string;
    company?: string;
    tags: string[];
    dealsCount?: number;
    vendedora?: string;
    posVenda?: string;
    pipeline: 'high-ticket' | 'low-ticket';
    status: string;
    responsibleId: string;
    postSalesId?: string;
    dealStatus?: 'open' | 'won' | 'lost';
    estimatedValue?: number;
    dealValue?: number;
    lostReason?: string;
    temperature?: 'cold' | 'warm' | 'hot';
    createdAt: Date;
    updatedAt: Date;
}

export type SortColumn = 'name' | 'phone' | 'email' | 'pipeline' | 'status' |
    'responsibleId' | 'postSalesId' | 'dealStatus' | 'estimatedValue' | 'updatedAt' | null;
export type SortDirection = 'asc' | 'desc' | null;

export type ColumnKey =
    | 'contact'
    | 'pipelineStage'
    | 'responsible'
    | 'postSales'
    | 'dealStatus'
    | 'value'
    | 'tags'
    | 'lossReason'
    | 'temperature'
    | 'createdAt'
    | 'updatedAt';

export type ColumnPreset = 'comercial' | 'operacao' | 'gestao';

// ─── Constants ────────────────────────────────────────────────────────────

export const COLUMN_ORDER: ColumnKey[] = [
    'contact', 'pipelineStage', 'responsible', 'postSales',
    'dealStatus', 'value', 'tags', 'lossReason', 'temperature',
    'createdAt', 'updatedAt',
];

export const COLUMN_PRESETS: Record<ColumnPreset, ColumnKey[]> = {
    comercial: ['contact', 'pipelineStage', 'responsible', 'dealStatus', 'value', 'tags'],
    operacao: ['contact', 'pipelineStage', 'responsible', 'postSales', 'dealStatus', 'value'],
    gestao: ['contact', 'pipelineStage', 'responsible', 'postSales', 'dealStatus', 'value', 'tags', 'lossReason', 'temperature', 'createdAt', 'updatedAt'],
};

export const COLUMN_LABELS: Record<ColumnKey, string> = {
    contact: 'Contato',
    pipelineStage: 'Pipeline / Etapa',
    responsible: 'Resp. Vendas',
    postSales: 'Pós-venda',
    dealStatus: 'Status negócio',
    value: 'Valor',
    tags: 'Tags',
    lossReason: 'Motivo perda',
    temperature: 'Temperatura',
    createdAt: 'Criado em',
    updatedAt: 'Última atualização',
};

const LOCAL_STORAGE_KEYS = {
    preset: 'contacts-table-preset-v4',
    columns: 'contacts-table-columns-v4',
} as const;

// ─── Hook ────────────────────────────────────────────────────────────────

export function useContactsTable(contacts: Contact[]) {
    const { selectedIds, toggleSelect, selectAll, clearSelection } = useContactsStore();
    const { stages } = useKanbanStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();

    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [showColumnsMenu, setShowColumnsMenu] = useState(false);
    const [columnPreset, setColumnPreset] = useLocalStorage<ColumnPreset>(LOCAL_STORAGE_KEYS.preset, 'comercial');
    const [visibleColumns, setVisibleColumns] = useLocalStorage<ColumnKey[]>(LOCAL_STORAGE_KEYS.columns, COLUMN_PRESETS.comercial);

    // Fetch collaborators if needed
    useEffect(() => {
        if (collaborators.length === 0) {
            fetchCollaborators();
        }
    }, [collaborators.length, fetchCollaborators]);

    // ─── Computed maps ───────────────────────────────────────────────────

    const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < contacts.length;

    const stagesMap = useMemo(() => {
        const map: Record<string, { name: string; pipeline: string }> = {};
        stages.forEach(stage => { map[stage.id] = { name: stage.name, pipeline: stage.pipeline }; });
        return map;
    }, [stages]);

    const collaboratorMap = useMemo(() => {
        const map: Record<string, string> = {};
        collaborators.forEach(c => { map[c.id] = c.name; });
        return map;
    }, [collaborators]);

    const displayedColumns = useMemo(() => {
        const safe = visibleColumns.filter(col => Object.keys(COLUMN_LABELS).includes(col));
        const source = safe.length === 0 ? COLUMN_PRESETS[columnPreset] : safe;
        return [...source].sort((a, b) => COLUMN_ORDER.indexOf(a) - COLUMN_ORDER.indexOf(b));
    }, [visibleColumns, columnPreset]);

    const tablePresetClass = columnPreset === 'comercial' ? 'tableComercial'
        : columnPreset === 'operacao' ? 'tableOperacao' : 'tableGestao';

    // ─── Sorting ─────────────────────────────────────────────────────────

    const sortedContacts = useMemo(() => {
        if (!sortColumn || !sortDirection) return contacts;

        return [...contacts].sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            switch (sortColumn) {
                case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                case 'phone': aVal = a.phone; bVal = b.phone; break;
                case 'email': aVal = a.email?.toLowerCase() || ''; bVal = b.email?.toLowerCase() || ''; break;
                case 'pipeline': aVal = a.pipeline || ''; bVal = b.pipeline || ''; break;
                case 'status':
                    aVal = stagesMap[a.status]?.name?.toLowerCase() || a.status || '';
                    bVal = stagesMap[b.status]?.name?.toLowerCase() || b.status || '';
                    break;
                case 'responsibleId':
                    aVal = collaboratorMap[a.responsibleId]?.toLowerCase() || '';
                    bVal = collaboratorMap[b.responsibleId]?.toLowerCase() || '';
                    break;
                case 'postSalesId':
                    aVal = collaboratorMap[a.postSalesId || '']?.toLowerCase() || '';
                    bVal = collaboratorMap[b.postSalesId || '']?.toLowerCase() || '';
                    break;
                case 'dealStatus': aVal = a.dealStatus || 'open'; bVal = b.dealStatus || 'open'; break;
                case 'estimatedValue':
                    aVal = a.dealValue ?? a.estimatedValue ?? 0;
                    bVal = b.dealValue ?? b.estimatedValue ?? 0;
                    break;
                case 'updatedAt':
                    aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                    bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    break;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [contacts, sortColumn, sortDirection, stagesMap, collaboratorMap]);

    // ─── Handlers ────────────────────────────────────────────────────────

    const handleSelectAll = () => {
        if (allSelected) clearSelection();
        else selectAll(contacts.map(c => c.id));
    };

    const handleRowClick = (contact: Contact, onContactClick?: (c: Contact) => void) => {
        onContactClick?.(contact);
    };

    const handleCheckboxClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        toggleSelect(id);
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn !== column) {
            setSortColumn(column);
            setSortDirection('asc');
        } else if (sortDirection === 'asc') {
            setSortDirection('desc');
        } else if (sortDirection === 'desc') {
            setSortColumn(null);
            setSortDirection(null);
        }
    };

    const handlePresetChange = (preset: ColumnPreset) => {
        setColumnPreset(preset);
        setVisibleColumns(COLUMN_PRESETS[preset]);
    };

    const toggleColumnVisibility = (column: ColumnKey) => {
        setVisibleColumns(prev => {
            const next = prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column];
            return next.length === 0 ? prev : next;
        });
    };

    // ─── Cell helpers ────────────────────────────────────────────────────

    const getDealStatusLabel = (status?: Contact['dealStatus']) =>
        status === 'won' ? 'Ganho' : status === 'lost' ? 'Perdido' : 'Aberto';

    const getDealStatusTagVariant = (status?: Contact['dealStatus']) =>
        status === 'won' ? 'success' : status === 'lost' ? 'danger' : 'default';

    const formatDate = (date?: Date) =>
        date ? new Date(date).toLocaleDateString('pt-BR') : '—';

    const formatCurrency = (value?: number) =>
        typeof value !== 'number' ? '—' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

    const getTemperatureLabel = (temperature?: Contact['temperature']) =>
        temperature === 'hot' ? 'Quente' : temperature === 'warm' ? 'Morno' : temperature === 'cold' ? 'Frio' : '—';

    const formatTagLabel = (tag: string) =>
        tag.length <= 14 ? tag : `${tag.slice(0, 14)}…`;

    const getTagVariant = (tag: string) => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('quente') || lowerTag.includes('hot')) return 'warning';
        if (lowerTag.includes('frio') || lowerTag.includes('cold')) return 'info';
        if (lowerTag.includes('engajado') || lowerTag.includes('ativo')) return 'success';
        if (lowerTag.includes('nov') || lowerTag.includes('new')) return 'primary';
        return 'default';
    };

    return {
        // Selection
        selectedIds, allSelected, someSelected,
        handleSelectAll, handleCheckboxClick, toggleSelect,
        // Sorting
        sortColumn, sortDirection, sortedContacts,
        handleSort,
        // Columns
        columnPreset, displayedColumns, showColumnsMenu, setShowColumnsMenu,
        tablePresetClass,
        handlePresetChange, toggleColumnVisibility,
        // Maps
        stagesMap, collaboratorMap,
        // Cell helpers
        getDealStatusLabel, getDealStatusTagVariant,
        formatDate, formatCurrency,
        getTemperatureLabel, formatTagLabel, getTagVariant,
        // Row actions
        handleRowClick,
    };
}
