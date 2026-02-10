/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS TABLE
 * Tabela de contatos com presets de coluna e hierarquia orientada à operação CRM
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Checkbox, Tag, Spinner, Button } from '@/design-system';
import { Phone, Mail, Building2, ChevronUp, ChevronDown, ChevronsUpDown, Settings2 } from 'lucide-react';
import { getInitials, formatPhone } from '@/utils';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useLocalStorage } from '@/hooks';
import styles from './ContactsTable.module.css';

interface Contact {
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

interface ContactsTableProps {
    contacts: Contact[];
    isLoading?: boolean;
    onContactClick?: (contact: Contact) => void;
}

type SortColumn = 'name' | 'phone' | 'email' | 'pipeline' | 'status' | 'responsibleId' | 'postSalesId' | 'dealStatus' | 'estimatedValue' | 'updatedAt' | null;
type SortDirection = 'asc' | 'desc' | null;

type ColumnKey =
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

type ColumnPreset = 'comercial' | 'operacao' | 'gestao';

const COLUMN_ORDER: ColumnKey[] = [
    'contact',
    'pipelineStage',
    'responsible',
    'postSales',
    'dealStatus',
    'value',
    'tags',
    'lossReason',
    'temperature',
    'createdAt',
    'updatedAt',
];

const COLUMN_PRESETS: Record<ColumnPreset, ColumnKey[]> = {
    comercial: ['contact', 'pipelineStage', 'responsible', 'dealStatus', 'value', 'tags', 'updatedAt'],
    operacao: ['contact', 'pipelineStage', 'responsible', 'postSales', 'temperature', 'tags', 'updatedAt'],
    gestao: ['contact', 'pipelineStage', 'responsible', 'postSales', 'dealStatus', 'value', 'lossReason', 'createdAt', 'updatedAt'],
};

const COLUMN_LABELS: Record<ColumnKey, string> = {
    contact: 'Contato',
    pipelineStage: 'Pipeline / Etapa',
    responsible: 'Responsável Vendas',
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

export const ContactsTable: React.FC<ContactsTableProps> = ({
    contacts,
    isLoading = false,
    onContactClick,
}) => {
    const { selectedIds, toggleSelect, selectAll, clearSelection } = useContactsStore();
    const { stages } = useKanbanStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();

    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [showColumnsMenu, setShowColumnsMenu] = useState(false);
    const [columnPreset, setColumnPreset] = useLocalStorage<ColumnPreset>(LOCAL_STORAGE_KEYS.preset, 'comercial');
    const [visibleColumns, setVisibleColumns] = useLocalStorage<ColumnKey[]>(LOCAL_STORAGE_KEYS.columns, COLUMN_PRESETS.comercial);

    const tablePresetClass =
        columnPreset === 'comercial'
            ? styles.tableComercial
            : columnPreset === 'operacao'
                ? styles.tableOperacao
                : styles.tableGestao;

    React.useEffect(() => {
        if (collaborators.length === 0) {
            fetchCollaborators();
        }
    }, [collaborators.length, fetchCollaborators]);

    const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < contacts.length;

    const stagesMap = useMemo(() => {
        const map: Record<string, { name: string; pipeline: string }> = {};
        stages.forEach(stage => {
            map[stage.id] = { name: stage.name, pipeline: stage.pipeline };
        });
        return map;
    }, [stages]);

    const collaboratorMap = useMemo(() => {
        const map: Record<string, string> = {};
        collaborators.forEach(c => {
            map[c.id] = c.name;
        });
        return map;
    }, [collaborators]);

    const displayedColumns = useMemo(() => {
        const safe = visibleColumns.filter(column => Object.keys(COLUMN_LABELS).includes(column));
        const source = safe.length === 0 ? COLUMN_PRESETS[columnPreset] : safe;
        return [...source].sort((a, b) => COLUMN_ORDER.indexOf(a) - COLUMN_ORDER.indexOf(b));
    }, [visibleColumns, columnPreset]);

    const getColumnClass = (column: ColumnKey) => {
        switch (column) {
            case 'contact':
                return styles.colContact;
            case 'pipelineStage':
                return styles.colPipeline;
            case 'responsible':
                return styles.colResponsible;
            case 'postSales':
                return styles.colPostSales;
            case 'dealStatus':
                return styles.colDealStatus;
            case 'value':
                return styles.colValue;
            case 'tags':
                return `${styles.tagsColumn} ${styles.colTags}`;
            case 'updatedAt':
                return styles.colUpdatedAt;
            case 'temperature':
                return styles.colTemperature;
            case 'lossReason':
                return styles.colLossReason;
            case 'createdAt':
                return styles.colCreatedAt;
            default:
                return '';
        }
    };

    const handleSelectAll = () => {
        if (allSelected) {
            clearSelection();
        } else {
            selectAll(contacts.map(c => c.id));
        }
    };

    const handleRowClick = (contact: Contact) => {
        if (onContactClick) {
            onContactClick(contact);
        }
    };

    const handleCheckboxClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        toggleSelect(id);
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn !== column) {
            // New column: start with ascending
            setSortColumn(column);
            setSortDirection('asc');
        } else if (sortDirection === 'asc') {
            // Same column, was asc: switch to desc
            setSortDirection('desc');
        } else if (sortDirection === 'desc') {
            // Same column, was desc: clear sort
            setSortColumn(null);
            setSortDirection(null);
        }
    };

    const getSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) {
            return <ChevronsUpDown size={14} className={styles.sortIconInactive} />;
        }
        if (sortDirection === 'asc') {
            return <ChevronUp size={14} className={styles.sortIconActive} />;
        }
        return <ChevronDown size={14} className={styles.sortIconActive} />;
    };

    // Sort contacts
    const sortedContacts = useMemo(() => {
        if (!sortColumn || !sortDirection) return contacts;

        return [...contacts].sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            switch (sortColumn) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'phone':
                    aVal = a.phone;
                    bVal = b.phone;
                    break;
                case 'email':
                    aVal = a.email?.toLowerCase() || '';
                    bVal = b.email?.toLowerCase() || '';
                    break;
                case 'pipeline':
                    aVal = a.pipeline || '';
                    bVal = b.pipeline || '';
                    break;
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
                case 'dealStatus':
                    aVal = a.dealStatus || 'open';
                    bVal = b.dealStatus || 'open';
                    break;
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

    const handlePresetChange = (preset: ColumnPreset) => {
        setColumnPreset(preset);
        setVisibleColumns(COLUMN_PRESETS[preset]);
    };

    const toggleColumnVisibility = (column: ColumnKey) => {
        setVisibleColumns(prev => {
            const next = prev.includes(column)
                ? prev.filter(c => c !== column)
                : [...prev, column];
            return next.length === 0 ? prev : next;
        });
    };

    const getDealStatusLabel = (status?: Contact['dealStatus']) => {
        if (status === 'won') return 'Ganho';
        if (status === 'lost') return 'Perdido';
        return 'Aberto';
    };

    const getDealStatusTagVariant = (status?: Contact['dealStatus']) => {
        if (status === 'won') return 'success';
        if (status === 'lost') return 'danger';
        return 'default';
    };

    const formatDate = (date?: Date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value?: number) => {
        if (typeof value !== 'number') return '—';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    };

    const getTemperatureLabel = (temperature?: Contact['temperature']) => {
        if (temperature === 'hot') return 'Quente';
        if (temperature === 'warm') return 'Morno';
        if (temperature === 'cold') return 'Frio';
        return '—';
    };

    const formatTagLabel = (tag: string) => {
        if (tag.length <= 14) return tag;
        return `${tag.slice(0, 14)}…`;
    };

    const getTagVariant = (tag: string) => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('quente') || lowerTag.includes('hot')) return 'warning';
        if (lowerTag.includes('frio') || lowerTag.includes('cold')) return 'info';
        if (lowerTag.includes('engajado') || lowerTag.includes('ativo')) return 'success';
        if (lowerTag.includes('nov') || lowerTag.includes('new')) return 'primary';
        return 'default';
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <Spinner size="lg" />
                <span>Carregando contatos...</span>
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIcon}>👥</div>
                <h3>Nenhum contato encontrado</h3>
                <p>Tente ajustar os filtros ou adicionar um novo contato.</p>
            </div>
        );
    }

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableToolbar}>
                <div className={styles.presetGroup}>
                    <button
                        className={`${styles.presetButton} ${columnPreset === 'comercial' ? styles.activePreset : ''}`}
                        onClick={() => handlePresetChange('comercial')}
                    >
                        Comercial
                    </button>
                    <button
                        className={`${styles.presetButton} ${columnPreset === 'operacao' ? styles.activePreset : ''}`}
                        onClick={() => handlePresetChange('operacao')}
                    >
                        Operação
                    </button>
                    <button
                        className={`${styles.presetButton} ${columnPreset === 'gestao' ? styles.activePreset : ''}`}
                        onClick={() => handlePresetChange('gestao')}
                    >
                        Gestão
                    </button>
                </div>

                <div className={styles.columnsWrapper}>
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Settings2 size={14} />}
                        onClick={() => setShowColumnsMenu(prev => !prev)}
                    >
                        Colunas
                    </Button>

                    {showColumnsMenu && (
                        <div className={styles.columnsMenu}>
                            {Object.entries(COLUMN_LABELS).map(([key, label]) => {
                                const column = key as ColumnKey;
                                return (
                                    <label key={column} className={styles.columnOption}>
                                        <Checkbox
                                            checked={displayedColumns.includes(column)}
                                            onChange={() => toggleColumnVisibility(column)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={`${styles.table} ${tablePresetClass}`}>
                    <thead>
                        <tr>
                            <th className={styles.checkboxCell}>
                                <Checkbox
                                    checked={allSelected || someSelected}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            {displayedColumns.includes('contact') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('contact')}`} onClick={() => handleSort('name')}>
                                    Contato {getSortIcon('name')}
                                </th>
                            )}
                            {displayedColumns.includes('pipelineStage') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('pipelineStage')}`} onClick={() => handleSort('status')}>
                                    Pipeline / Etapa {getSortIcon('status')}
                                </th>
                            )}
                            {displayedColumns.includes('responsible') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('responsible')}`} onClick={() => handleSort('responsibleId')}>
                                    Resp. Vendas {getSortIcon('responsibleId')}
                                </th>
                            )}
                            {displayedColumns.includes('postSales') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('postSales')}`} onClick={() => handleSort('postSalesId')}>
                                    Pós-venda {getSortIcon('postSalesId')}
                                </th>
                            )}
                            {displayedColumns.includes('dealStatus') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('dealStatus')}`} onClick={() => handleSort('dealStatus')}>
                                    Status negócio {getSortIcon('dealStatus')}
                                </th>
                            )}
                            {displayedColumns.includes('value') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('value')}`} onClick={() => handleSort('estimatedValue')}>
                                    Valor {getSortIcon('estimatedValue')}
                                </th>
                            )}
                            {displayedColumns.includes('tags') && <th className={getColumnClass('tags')}>Tags</th>}
                            {displayedColumns.includes('lossReason') && <th className={getColumnClass('lossReason')}>Motivo perda</th>}
                            {displayedColumns.includes('temperature') && <th className={getColumnClass('temperature')}>Temperatura</th>}
                            {displayedColumns.includes('createdAt') && <th className={getColumnClass('createdAt')}>Criado em</th>}
                            {displayedColumns.includes('updatedAt') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('updatedAt')}`} onClick={() => handleSort('updatedAt')}>
                                    Última atualização {getSortIcon('updatedAt')}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedContacts.map((contact) => (
                            <tr
                                key={contact.id}
                                className={`${selectedIds.has(contact.id) ? styles.selectedRow : ''} ${styles.clickableRow}`}
                                onClick={() => handleRowClick(contact)}
                            >
                                {/* Checkbox */}
                                <td className={styles.checkboxCell} onClick={(e) => handleCheckboxClick(e, contact.id)}>
                                    <Checkbox
                                        checked={selectedIds.has(contact.id)}
                                        onChange={() => toggleSelect(contact.id)}
                                    />
                                </td>

                                {displayedColumns.includes('contact') && (
                                    <td className={getColumnClass('contact')}>
                                        <div className={styles.nameCell}>
                                            <div className={styles.avatar}>
                                                {getInitials(contact.name)}
                                            </div>
                                            <div className={styles.nameInfo}>
                                                <span className={styles.name}>{contact.name}</span>
                                                <div className={styles.contactMeta}>
                                                    <span className={styles.inlineMeta}><Phone size={12} /> {formatPhone(contact.phone)}</span>
                                                    {contact.email && <span className={styles.inlineMeta}><Mail size={12} /> {contact.email}</span>}
                                                    {contact.company && <span className={styles.inlineMeta}><Building2 size={12} /> {contact.company}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                )}

                                {displayedColumns.includes('pipelineStage') && (
                                    <td className={getColumnClass('pipelineStage')}>
                                        <div className={styles.pipelineCell}>
                                            <span className={styles.pipelineBadge}>{contact.pipeline === 'high-ticket' ? 'High Ticket' : 'Low Ticket'}</span>
                                            <span className={styles.stageName}>{stagesMap[contact.status]?.name || contact.status}</span>
                                        </div>
                                    </td>
                                )}

                                {displayedColumns.includes('responsible') && (
                                    <td className={getColumnClass('responsible')}>
                                        <span className={styles.personName}>{collaboratorMap[contact.responsibleId] || contact.vendedora || '—'}</span>
                                    </td>
                                )}

                                {displayedColumns.includes('postSales') && (
                                    <td className={getColumnClass('postSales')}>
                                        <span className={styles.personName}>{collaboratorMap[contact.postSalesId || ''] || contact.posVenda || '—'}</span>
                                    </td>
                                )}

                                {displayedColumns.includes('dealStatus') && (
                                    <td className={getColumnClass('dealStatus')}>
                                        <Tag variant={getDealStatusTagVariant(contact.dealStatus)} size="sm">
                                            {getDealStatusLabel(contact.dealStatus)}
                                        </Tag>
                                    </td>
                                )}

                                {displayedColumns.includes('value') && (
                                    <td className={getColumnClass('value')}>
                                        <span className={styles.valueText}>{formatCurrency(contact.dealValue ?? contact.estimatedValue)}</span>
                                    </td>
                                )}

                                {displayedColumns.includes('tags') && (
                                    <td className={getColumnClass('tags')}>
                                        <div className={styles.tagsCell}>
                                            {contact.tags.length > 0 ? (
                                                contact.tags.slice(0, 2).map((tag) => (
                                                    <Tag
                                                        key={tag}
                                                        variant={getTagVariant(tag)}
                                                        size="sm"
                                                        className={styles.compactTag}
                                                    >
                                                        {formatTagLabel(tag)}
                                                    </Tag>
                                                ))
                                            ) : (
                                                <span className={styles.noData}>—</span>
                                            )}
                                            {contact.tags.length > 2 && (
                                                <span className={styles.moreTags}>
                                                    +{contact.tags.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                )}

                                {displayedColumns.includes('lossReason') && (
                                    <td className={getColumnClass('lossReason')}>
                                        <span className={styles.noData}>{contact.lostReason || '—'}</span>
                                    </td>
                                )}

                                {displayedColumns.includes('temperature') && (
                                    <td className={getColumnClass('temperature')}>
                                        <span className={styles.noData}>{getTemperatureLabel(contact.temperature)}</span>
                                    </td>
                                )}

                                {displayedColumns.includes('createdAt') && (
                                    <td className={getColumnClass('createdAt')}>
                                        <span className={styles.noData}>{formatDate(contact.createdAt)}</span>
                                    </td>
                                )}

                                {displayedColumns.includes('updatedAt') && (
                                    <td className={getColumnClass('updatedAt')}>
                                        <span className={styles.noData}>{formatDate(contact.updatedAt)}</span>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
