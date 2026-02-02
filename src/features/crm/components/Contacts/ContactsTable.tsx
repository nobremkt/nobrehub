/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS TABLE
 * Tabela de contatos seguindo análise do Clint CRM:
 * Colunas: Checkbox | Avatar | Nome | Telefone | Email | Qtd Negócios | Tags
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Checkbox, Tag, Spinner } from '@/design-system';
import { Phone, Mail, Building2 } from 'lucide-react';
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
}

interface ContactsTableProps {
    contacts: Contact[];
    isLoading?: boolean;
    onContactClick?: (contact: Contact) => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
    contacts,
    isLoading = false,
    onContactClick,
}) => {
    const { selectedIds, toggleSelect, selectAll, clearSelection } = useContactsStore();

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
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Email</th>
                        <th>Negócios</th>
                        <th>Tags</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map((contact) => (
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
