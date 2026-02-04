/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS TABLE
 * Tabela de contatos com colunas ordenáveis e novas colunas de associação
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Checkbox, Tag, Spinner } from '@/design-system';
import { Phone, Mail, Building2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getInitials, formatPhone } from '@/utils';
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
}

interface ContactsTableProps {
    contacts: Contact[];
    isLoading?: boolean;
    onContactClick?: (contact: Contact) => void;
}

type SortColumn = 'name' | 'phone' | 'email' | 'vendedora' | 'posVenda' | 'dealsCount' | null;
type SortDirection = 'asc' | 'desc' | null;

export const ContactsTable: React.FC<ContactsTableProps> = ({
    contacts,
    isLoading = false,
    onContactClick,
}) => {
    const { selectedIds, toggleSelect, selectAll, clearSelection } = useContactsStore();

    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < contacts.length;

    const handleSelectAll = () => {
        if (allSelected) {
            clearSelection();
        } else {
            selectAll();
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
                case 'vendedora':
                    aVal = a.vendedora?.toLowerCase() || '';
                    bVal = b.vendedora?.toLowerCase() || '';
                    break;
                case 'posVenda':
                    aVal = a.posVenda?.toLowerCase() || '';
                    bVal = b.posVenda?.toLowerCase() || '';
                    break;
                case 'dealsCount':
                    aVal = a.dealsCount || 0;
                    bVal = b.dealsCount || 0;
                    break;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [contacts, sortColumn, sortDirection]);

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
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.checkboxCell}>
                            <Checkbox
                                checked={allSelected || someSelected}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className={styles.sortableHeader} onClick={() => handleSort('name')}>
                            Nome {getSortIcon('name')}
                        </th>
                        <th className={styles.sortableHeader} onClick={() => handleSort('phone')}>
                            Telefone {getSortIcon('phone')}
                        </th>
                        <th className={styles.sortableHeader} onClick={() => handleSort('email')}>
                            Email {getSortIcon('email')}
                        </th>
                        <th className={styles.sortableHeader} onClick={() => handleSort('vendedora')}>
                            Vendedora {getSortIcon('vendedora')}
                        </th>
                        <th className={styles.sortableHeader} onClick={() => handleSort('posVenda')}>
                            Pós-Venda {getSortIcon('posVenda')}
                        </th>
                        <th className={styles.sortableHeader} onClick={() => handleSort('dealsCount')}>
                            Negócios {getSortIcon('dealsCount')}
                        </th>
                        <th>Tags</th>
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

                            {/* Avatar + Nome */}
                            <td>
                                <div className={styles.nameCell}>
                                    <div className={styles.avatar}>
                                        {getInitials(contact.name)}
                                    </div>
                                    <div className={styles.nameInfo}>
                                        <span className={styles.name}>{contact.name}</span>
                                        {contact.company && (
                                            <span className={styles.company}>
                                                <Building2 size={12} />
                                                {contact.company}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* Telefone */}
                            <td>
                                <div className={styles.infoCell}>
                                    <Phone size={14} className={styles.infoIcon} />
                                    <span>{formatPhone(contact.phone)}</span>
                                </div>
                            </td>

                            {/* Email */}
                            <td>
                                {contact.email ? (
                                    <div className={styles.infoCell}>
                                        <Mail size={14} className={styles.infoIcon} />
                                        <span>{contact.email}</span>
                                    </div>
                                ) : (
                                    <span className={styles.noData}>—</span>
                                )}
                            </td>

                            {/* Vendedora */}
                            <td>
                                {contact.vendedora ? (
                                    <span className={styles.personName}>{contact.vendedora}</span>
                                ) : (
                                    <span className={styles.noData}>—</span>
                                )}
                            </td>

                            {/* Pós-Venda */}
                            <td>
                                {contact.posVenda ? (
                                    <span className={styles.personName}>{contact.posVenda}</span>
                                ) : (
                                    <span className={styles.noData}>—</span>
                                )}
                            </td>

                            {/* Negócios */}
                            <td>
                                {contact.dealsCount && contact.dealsCount > 0 ? (
                                    <span className={styles.dealsCount}>
                                        {contact.dealsCount} negócio{contact.dealsCount > 1 ? 's' : ''}
                                    </span>
                                ) : (
                                    <span className={styles.noData}>—</span>
                                )}
                            </td>

                            {/* Tags */}
                            <td>
                                <div className={styles.tagsCell}>
                                    {contact.tags.length > 0 ? (
                                        contact.tags.slice(0, 3).map((tag) => (
                                            <Tag
                                                key={tag}
                                                variant={getTagVariant(tag)}
                                                size="sm"
                                            >
                                                {tag}
                                            </Tag>
                                        ))
                                    ) : (
                                        <span className={styles.noData}>—</span>
                                    )}
                                    {contact.tags.length > 3 && (
                                        <span className={styles.moreTags}>
                                            +{contact.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
