/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS FILTER BAR
 * Barra de filtros seguindo análise do Clint CRM:
 * [🔍] [Campos ▼] [Tags ▼] [Motivo de Perda ▼] [Mais filtros ▼]
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Input, Tag, Checkbox } from '@/design-system';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { AdvancedFiltersModal } from './AdvancedFiltersModal';
import styles from './ContactsFilterBar.module.css';

interface DropdownMenuProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ isOpen, onClose, children }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={menuRef} className={styles.dropdownMenu}>
            {children}
        </div>
    );
};

export const ContactsFilterBar: React.FC = () => {
    const {
        filters,
        setFilter,
        clearFilters,
        availableTags,
        availableLossReasons,
    } = useContactsStore();

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<'campos' | 'tags' | 'perda' | null>(null);

    // Conta filtros ativos
    const activeFiltersCount = [
        filters.tags.length > 0,
        filters.motivoPerda.length > 0,
        filters.campos.length > 0,
        filters.comTelefone,
        filters.semTelefone,
        filters.dataInicio,
        filters.dataFim,
    ].filter(Boolean).length;

    const handleTagToggle = (tag: string) => {
        const newTags = filters.tags.includes(tag)
            ? filters.tags.filter(t => t !== tag)
            : [...filters.tags, tag];
        setFilter('tags', newTags);
    };

    const handleLossReasonToggle = (reason: string) => {
        const newReasons = filters.motivoPerda.includes(reason)
            ? filters.motivoPerda.filter(r => r !== reason)
            : [...filters.motivoPerda, reason];
        setFilter('motivoPerda', newReasons);
    };

    return (
        <div className={styles.container}>
            {/* Barra principal de filtros */}
            <div className={styles.filterBar}>
                {/* Busca */}
                <div className={styles.searchWrapper}>
                    <Input
                        placeholder="Buscar por nome, email, telefone..."
                        value={filters.search}
                        onChange={(e) => setFilter('search', e.target.value)}
                        leftIcon={<Search size={18} />}
                        className={styles.searchInput}
                    />
                </div>

                {/* Campos - Dropdown */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'campos' ? null : 'campos')}
                    >
                        Campos
                        {filters.campos.length > 0 && (
                            <span className={styles.filterCount}>{filters.campos.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'campos'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.optionsList}>
                                <label className={styles.checkboxLabel}>
                                    <Checkbox
                                        checked={filters.campos.includes('contato')}
                                        onChange={() => {
                                            const newCampos = filters.campos.includes('contato')
                                                ? filters.campos.filter(c => c !== 'contato')
                                                : [...filters.campos, 'contato' as const];
                                            setFilter('campos', newCampos);
                                        }}
                                    />
                                    Contato
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <Checkbox
                                        checked={filters.campos.includes('empresa')}
                                        onChange={() => {
                                            const newCampos = filters.campos.includes('empresa')
                                                ? filters.campos.filter(c => c !== 'empresa')
                                                : [...filters.campos, 'empresa' as const];
                                            setFilter('campos', newCampos);
                                        }}
                                    />
                                    Empresa
                                </label>
                            </div>
                        </div>
                    </DropdownMenu>
                </div>

                {/* Tags - Dropdown */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'tags' ? null : 'tags')}
                    >
                        Tags
                        {filters.tags.length > 0 && (
                            <span className={styles.filterCount}>{filters.tags.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'tags'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.dropdownSearch}>
                                <Search size={14} />
                                <input type="text" placeholder="Buscar por..." />
                            </div>
                            <div className={styles.optionsList}>
                                <label className={styles.checkboxLabel}>
                                    <Checkbox
                                        checked={filters.tags.length === 0}
                                        onChange={() => setFilter('tags', [])}
                                    />
                                    Sem tag
                                </label>
                                {availableTags.map(tag => (
                                    <label key={tag} className={styles.checkboxLabel}>
                                        <Checkbox
                                            checked={filters.tags.includes(tag)}
                                            onChange={() => handleTagToggle(tag)}
                                        />
                                        <Tag
                                            variant={
                                                tag === 'Quente' ? 'warning' :
                                                    tag === 'FRIO' ? 'info' :
                                                        tag === 'engajado' ? 'success' :
                                                            'default'
                                            }
                                            size="sm"
                                        >
                                            {tag}
                                        </Tag>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </DropdownMenu>
                </div>

                {/* Motivo de Perda - Dropdown */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'perda' ? null : 'perda')}
                    >
                        Motivo de Perda
                        {filters.motivoPerda.length > 0 && (
                            <span className={styles.filterCount}>{filters.motivoPerda.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'perda'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.optionsList}>
                                {availableLossReasons.map(reason => (
                                    <label key={reason.id} className={styles.checkboxLabel}>
                                        <Checkbox
                                            checked={filters.motivoPerda.includes(reason.name)}
                                            onChange={() => handleLossReasonToggle(reason.name)}
                                        />
                                        {reason.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </DropdownMenu>
                </div>

                {/* Mais Filtros */}
                <button
                    className={styles.filterButton}
                    onClick={() => setShowAdvancedFilters(true)}
                >
                    <SlidersHorizontal size={16} />
                    Mais filtros
                    {activeFiltersCount > 0 && (
                        <span className={styles.filterCount}>{activeFiltersCount}</span>
                    )}
                </button>

                {/* Limpar filtros */}
                {activeFiltersCount > 0 && (
                    <button
                        className={styles.clearButton}
                        onClick={clearFilters}
                    >
                        <X size={14} />
                        Limpar
                    </button>
                )}
            </div>

            {/* Tags ativas (pills) */}
            {(filters.tags.length > 0 || filters.motivoPerda.length > 0) && (
                <div className={styles.activeTags}>
                    {filters.tags.map(tag => (
                        <Tag
                            key={tag}
                            variant="primary"
                            size="sm"
                            onRemove={() => handleTagToggle(tag)}
                        >
                            {tag}
                        </Tag>
                    ))}
                    {filters.motivoPerda.map(reason => (
                        <Tag
                            key={reason}
                            variant="danger"
                            size="sm"
                            onRemove={() => handleLossReasonToggle(reason)}
                        >
                            {reason}
                        </Tag>
                    ))}
                </div>
            )}

            {/* Modal de Filtros Avançados */}
            <AdvancedFiltersModal
                isOpen={showAdvancedFilters}
                onClose={() => setShowAdvancedFilters(false)}
            />
        </div>
    );
};
