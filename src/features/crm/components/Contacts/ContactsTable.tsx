/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS TABLE
 * Tabela de contatos com presets de coluna e hierarquia orientada à operação CRM.
 * State/logic delegated to useContactsTable hook.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { Checkbox, Tag, Spinner, Button } from '@/design-system';
import { Phone, Mail, Building2, ChevronUp, ChevronDown, ChevronsUpDown, Settings2 } from 'lucide-react';
import { getInitials, formatPhone } from '@/utils';
import styles from './ContactsTable.module.css';
import { Contact, COLUMN_LABELS, ColumnKey, useContactsTable } from './useContactsTable';

export type { Contact };

interface ContactsTableProps {
    contacts: Contact[];
    isLoading?: boolean;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
    onContactClick?: (contact: Contact) => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
    contacts,
    isLoading = false,
    hasMore = false,
    isLoadingMore = false,
    onLoadMore,
    onContactClick,
}) => {
    const ct = useContactsTable(contacts);

    // ─── Column class helper ─────────────────────────────────────────────
    const getColumnClass = (column: ColumnKey) => {
        switch (column) {
            case 'contact': return styles.colContact;
            case 'pipelineStage': return styles.colPipeline;
            case 'responsible': return styles.colResponsible;
            case 'postSales': return styles.colPostSales;
            case 'dealStatus': return styles.colDealStatus;
            case 'value': return styles.colValue;
            case 'tags': return `${styles.tagsColumn} ${styles.colTags}`;
            case 'updatedAt': return styles.colUpdatedAt;
            case 'temperature': return styles.colTemperature;
            case 'lossReason': return styles.colLossReason;
            case 'createdAt': return styles.colCreatedAt;
            default: return '';
        }
    };

    const getSortIcon = (column: typeof ct.sortColumn) => {
        if (ct.sortColumn !== column) return <ChevronsUpDown size={14} className={styles.sortIconInactive} />;
        if (ct.sortDirection === 'asc') return <ChevronUp size={14} className={styles.sortIconActive} />;
        return <ChevronDown size={14} className={styles.sortIconActive} />;
    };

    // ─── Loading / Empty ─────────────────────────────────────────────────
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
                        className={`${styles.presetButton} ${ct.columnPreset === 'comercial' ? styles.activePreset : ''}`}
                        onClick={() => ct.handlePresetChange('comercial')}
                    >
                        Comercial
                    </button>
                    <button
                        className={`${styles.presetButton} ${ct.columnPreset === 'operacao' ? styles.activePreset : ''}`}
                        onClick={() => ct.handlePresetChange('operacao')}
                    >
                        Operação
                    </button>
                    <button
                        className={`${styles.presetButton} ${ct.columnPreset === 'gestao' ? styles.activePreset : ''}`}
                        onClick={() => ct.handlePresetChange('gestao')}
                    >
                        Gestão
                    </button>
                </div>

                <div className={styles.columnsWrapper}>
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Settings2 size={14} />}
                        onClick={() => ct.setShowColumnsMenu(prev => !prev)}
                    >
                        Colunas
                    </Button>

                    {ct.showColumnsMenu && (
                        <div className={styles.columnsMenu}>
                            {Object.entries(COLUMN_LABELS).map(([key, label]) => {
                                const column = key as ColumnKey;
                                return (
                                    <label key={column} className={styles.columnOption}>
                                        <Checkbox
                                            checked={ct.displayedColumns.includes(column)}
                                            onChange={() => ct.toggleColumnVisibility(column)}
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
                <table className={`${styles.table} ${styles[ct.tablePresetClass]}`}>
                    <thead>
                        <tr>
                            <th className={styles.checkboxCell}>
                                <Checkbox
                                    checked={ct.allSelected || ct.someSelected}
                                    onChange={ct.handleSelectAll}
                                />
                            </th>
                            {ct.displayedColumns.includes('contact') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('contact')}`} onClick={() => ct.handleSort('name')}>
                                    Contato {getSortIcon('name')}
                                </th>
                            )}
                            {ct.displayedColumns.includes('pipelineStage') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('pipelineStage')}`} onClick={() => ct.handleSort('status')}>
                                    Pipeline / Etapa {getSortIcon('status')}
                                </th>
                            )}
                            {ct.displayedColumns.includes('responsible') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('responsible')}`} onClick={() => ct.handleSort('responsibleId')}>
                                    Resp. Vendas {getSortIcon('responsibleId')}
                                </th>
                            )}
                            {ct.displayedColumns.includes('postSales') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('postSales')}`} onClick={() => ct.handleSort('postSalesId')}>
                                    Pós-venda {getSortIcon('postSalesId')}
                                </th>
                            )}
                            {ct.displayedColumns.includes('dealStatus') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('dealStatus')}`} onClick={() => ct.handleSort('dealStatus')}>
                                    Status negócio {getSortIcon('dealStatus')}
                                </th>
                            )}
                            {ct.displayedColumns.includes('value') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('value')}`} onClick={() => ct.handleSort('estimatedValue')}>
                                    Valor {getSortIcon('estimatedValue')}
                                </th>
                            )}
                            {ct.displayedColumns.includes('tags') && <th className={getColumnClass('tags')}>Tags</th>}
                            {ct.displayedColumns.includes('lossReason') && <th className={getColumnClass('lossReason')}>Motivo perda</th>}
                            {ct.displayedColumns.includes('temperature') && <th className={getColumnClass('temperature')}>Temperatura</th>}
                            {ct.displayedColumns.includes('createdAt') && <th className={getColumnClass('createdAt')}>Criado em</th>}
                            {ct.displayedColumns.includes('updatedAt') && (
                                <th className={`${styles.sortableHeader} ${getColumnClass('updatedAt')}`} onClick={() => ct.handleSort('updatedAt')}>
                                    Última atualização {getSortIcon('updatedAt')}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {ct.sortedContacts.map((contact) => (
                            <tr
                                key={contact.id}
                                className={`${ct.selectedIds.has(contact.id) ? styles.selectedRow : ''} ${styles.clickableRow}`}
                                onClick={() => ct.handleRowClick(contact, onContactClick)}
                            >
                                {/* Checkbox */}
                                <td className={styles.checkboxCell} onClick={(e) => ct.handleCheckboxClick(e, contact.id)}>
                                    <Checkbox
                                        checked={ct.selectedIds.has(contact.id)}
                                        onChange={() => ct.toggleSelect(contact.id)}
                                    />
                                </td>

                                {ct.displayedColumns.includes('contact') && (
                                    <td className={getColumnClass('contact')}>
                                        <div className={styles.nameCell}>
                                            <div className={styles.avatar}>{getInitials(contact.name)}</div>
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

                                {ct.displayedColumns.includes('pipelineStage') && (
                                    <td className={getColumnClass('pipelineStage')}>
                                        <div className={styles.pipelineCell}>
                                            <span className={styles.pipelineBadge}>{contact.pipeline === 'high-ticket' ? 'High Ticket' : 'Low Ticket'}</span>
                                            <span className={styles.stageName}>{ct.stagesMap[contact.status]?.name || contact.status}</span>
                                        </div>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('responsible') && (
                                    <td className={getColumnClass('responsible')}>
                                        <span className={styles.personName}>{ct.collaboratorMap[contact.responsibleId] || contact.vendedora || '—'}</span>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('postSales') && (
                                    <td className={getColumnClass('postSales')}>
                                        <span className={styles.personName}>{ct.collaboratorMap[contact.postSalesId || ''] || contact.posVenda || '—'}</span>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('dealStatus') && (
                                    <td className={getColumnClass('dealStatus')}>
                                        <Tag variant={ct.getDealStatusTagVariant(contact.dealStatus)} size="sm">
                                            {ct.getDealStatusLabel(contact.dealStatus)}
                                        </Tag>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('value') && (
                                    <td className={getColumnClass('value')}>
                                        <span className={styles.valueText}>{ct.formatCurrency(contact.dealValue ?? contact.estimatedValue)}</span>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('tags') && (
                                    <td className={getColumnClass('tags')}>
                                        <div className={styles.tagsCell}>
                                            {contact.tags.length > 0 ? (
                                                contact.tags.slice(0, 2).map((tag) => (
                                                    <Tag key={tag} variant={ct.getTagVariant(tag)} size="sm" className={styles.compactTag}>
                                                        {ct.formatTagLabel(tag)}
                                                    </Tag>
                                                ))
                                            ) : (
                                                <span className={styles.noData}>—</span>
                                            )}
                                            {contact.tags.length > 2 && (
                                                <span className={styles.moreTags}>+{contact.tags.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('lossReason') && (
                                    <td className={getColumnClass('lossReason')}>
                                        <span className={styles.noData}>{contact.lostReason || '—'}</span>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('temperature') && (
                                    <td className={getColumnClass('temperature')}>
                                        <span className={styles.noData}>{ct.getTemperatureLabel(contact.temperature)}</span>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('createdAt') && (
                                    <td className={getColumnClass('createdAt')}>
                                        <span className={styles.noData}>{ct.formatDate(contact.createdAt)}</span>
                                    </td>
                                )}

                                {ct.displayedColumns.includes('updatedAt') && (
                                    <td className={getColumnClass('updatedAt')}>
                                        <span className={styles.noData}>{ct.formatDate(contact.updatedAt)}</span>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Sentinel for infinite scroll */}
                {hasMore && (
                    <LoadMoreSentinel isLoadingMore={isLoadingMore} onLoadMore={onLoadMore} />
                )}
            </div>
        </div>
    );
};

/** Sentinel component that triggers loadMore via IntersectionObserver */
const LoadMoreSentinel: React.FC<{
    isLoadingMore: boolean;
    onLoadMore?: () => void;
}> = ({ isLoadingMore, onLoadMore }) => {
    const sentinelRef = useRef<HTMLDivElement>(null);

    const handleIntersect = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0]?.isIntersecting && !isLoadingMore && onLoadMore) {
                onLoadMore();
            }
        },
        [isLoadingMore, onLoadMore]
    );

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, [handleIntersect]);

    return (
        <div ref={sentinelRef} style={{ padding: '16px', textAlign: 'center' }}>
            {isLoadingMore && <Spinner size="sm" />}
        </div>
    );
};
