/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS FILTER BAR
 * Barra de filtros persistentes para operação CRM:
 * [🔍] [Pipeline ▼] [Etapa ▼] [Status ▼] [Resp. Vendas ▼] [Pós-venda ▼] [Tags ▼] [Perda ▼] [Mais filtros]
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Input, Tag, Checkbox } from '@/design-system';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { AdvancedFiltersModal } from './AdvancedFiltersModal';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
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

type DropdownKey = 'pipeline' | 'stage' | 'dealStatus' | 'responsible' | 'postSales' | 'tags' | 'loss';

const PIPELINE_OPTIONS = [
    { value: 'high-ticket', label: 'High Ticket' },
    { value: 'low-ticket', label: 'Low Ticket' },
] as const;

const DEAL_STATUS_OPTIONS = [
    { value: 'open', label: 'Aberto' },
    { value: 'won', label: 'Ganho' },
    { value: 'lost', label: 'Perdido' },
] as const;

const toggleArrayValue = <T extends string>(arr: T[], value: T): T[] => {
    return arr.includes(value)
        ? arr.filter(item => item !== value)
        : [...arr, value];
};

export const ContactsFilterBar: React.FC = () => {
    const {
        filters,
        setFilter,
        clearFilters,
        availableTags,
        availableLossReasons,
    } = useContactsStore();
    const { stages, fetchStages } = useKanbanStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

    useEffect(() => {
        if (stages.length === 0) fetchStages();
        if (collaborators.length === 0) fetchCollaborators();
    }, [stages.length, collaborators.length, fetchStages, fetchCollaborators]);

    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    const sortedCollaborators = [...collaborators]
        .filter(c => c.active !== false)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const stageMap = sortedStages.reduce<Record<string, string>>((acc, stage) => {
        acc[stage.id] = stage.name;
        return acc;
    }, {});

    const collaboratorMap = sortedCollaborators.reduce<Record<string, string>>((acc, collab) => {
        acc[collab.id] = collab.name;
        return acc;
    }, {});

    const lossReasonMap = availableLossReasons.reduce<Record<string, string>>((acc, reason) => {
        acc[reason.id] = reason.name;
        return acc;
    }, {});

    // Conta filtros ativos
    const activeFiltersCount = [
        filters.search.trim().length > 0,
        filters.pipelines.length > 0,
        filters.stages.length > 0,
        filters.dealStatus.length > 0,
        filters.responsibleIds.length > 0,
        filters.postSalesIds.length > 0,
        filters.temperatures.length > 0,
        filters.tags.length > 0,
        filters.motivoPerda.length > 0,
        filters.comDono,
        filters.semDono,
        filters.comTelefone,
        filters.semTelefone,
        filters.dataCriacaoInicio,
        filters.dataCriacaoFim,
        filters.dataAtualizacaoInicio,
        filters.dataAtualizacaoFim,
        typeof filters.valorMin === 'number',
        typeof filters.valorMax === 'number',
    ].filter(Boolean).length;

    const handleTagToggle = (tag: string) => {
        setFilter('tags', toggleArrayValue(filters.tags, tag));
    };

    const handleLossReasonToggle = (reasonId: string) => {
        setFilter('motivoPerda', toggleArrayValue(filters.motivoPerda, reasonId));
    };

    const handleDealStatusToggle = (status: 'open' | 'won' | 'lost') => {
        setFilter('dealStatus', toggleArrayValue(filters.dealStatus, status));
    };

    const handlePipelineToggle = (pipeline: 'high-ticket' | 'low-ticket') => {
        setFilter('pipelines', toggleArrayValue(filters.pipelines, pipeline));
    };

    const handleStageToggle = (stageId: string) => {
        setFilter('stages', toggleArrayValue(filters.stages, stageId));
    };

    const handleResponsibleToggle = (responsibleId: string) => {
        setFilter('responsibleIds', toggleArrayValue(filters.responsibleIds, responsibleId));
    };

    const handlePostSalesToggle = (postSalesId: string) => {
        setFilter('postSalesIds', toggleArrayValue(filters.postSalesIds, postSalesId));
    };

    const formatDateChip = (date?: Date) => {
        if (!date) return null;
        return date.toLocaleDateString('pt-BR');
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

                {/* Pipeline */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'pipeline' ? null : 'pipeline')}
                    >
                        Pipeline
                        {filters.pipelines.length > 0 && (
                            <span className={styles.filterCount}>{filters.pipelines.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'pipeline'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.optionsList}>
                                {PIPELINE_OPTIONS.map(option => (
                                    <label key={option.value} className={styles.checkboxLabel}>
                                        <Checkbox
                                            checked={filters.pipelines.includes(option.value)}
                                            onChange={() => handlePipelineToggle(option.value)}
                                        />
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </DropdownMenu>
                </div>

                {/* Etapa */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'stage' ? null : 'stage')}
                    >
                        Etapa
                        {filters.stages.length > 0 && (
                            <span className={styles.filterCount}>{filters.stages.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'stage'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.optionsList}>
                                {sortedStages.map(stage => (
                                    <label key={stage.id} className={styles.checkboxLabel}>
                                        <Checkbox
                                            checked={filters.stages.includes(stage.id)}
                                            onChange={() => handleStageToggle(stage.id)}
                                        />
                                        {stage.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </DropdownMenu>
                </div>

                {/* Status do negócio */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'dealStatus' ? null : 'dealStatus')}
                    >
                        Status
                        {filters.dealStatus.length > 0 && (
                            <span className={styles.filterCount}>{filters.dealStatus.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'dealStatus'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.optionsList}>
                                {DEAL_STATUS_OPTIONS.map(status => (
                                    <label key={status.value} className={styles.checkboxLabel}>
                                        <Checkbox
                                            checked={filters.dealStatus.includes(status.value)}
                                            onChange={() => handleDealStatusToggle(status.value)}
                                        />
                                        {status.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </DropdownMenu>
                </div>

                {/* Responsável Vendas */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'responsible' ? null : 'responsible')}
                    >
                        Resp. Vendas
                        {filters.responsibleIds.length > 0 && (
                            <span className={styles.filterCount}>{filters.responsibleIds.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'responsible'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.optionsList}>
                                {sortedCollaborators.map(collab => (
                                    <label key={collab.id} className={styles.checkboxLabel}>
                                        <Checkbox
                                            checked={filters.responsibleIds.includes(collab.id)}
                                            onChange={() => handleResponsibleToggle(collab.id)}
                                        />
                                        {collab.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </DropdownMenu>
                </div>

                {/* Pós-venda */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'postSales' ? null : 'postSales')}
                    >
                        Pós-venda
                        {filters.postSalesIds.length > 0 && (
                            <span className={styles.filterCount}>{filters.postSalesIds.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'postSales'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.optionsList}>
                                {sortedCollaborators.map(collab => (
                                    <label key={collab.id} className={styles.checkboxLabel}>
                                        <Checkbox
                                            checked={filters.postSalesIds.includes(collab.id)}
                                            onChange={() => handlePostSalesToggle(collab.id)}
                                        />
                                        {collab.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </DropdownMenu>
                </div>

                {/* Tags */}
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
                            <div className={styles.optionsList}>
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

                {/* Motivo de perda */}
                <div className={styles.dropdownWrapper}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setOpenDropdown(openDropdown === 'loss' ? null : 'loss')}
                    >
                        Motivo de perda
                        {filters.motivoPerda.length > 0 && (
                            <span className={styles.filterCount}>{filters.motivoPerda.length}</span>
                        )}
                        <ChevronDown size={14} />
                    </button>
                    <DropdownMenu
                        isOpen={openDropdown === 'loss'}
                        onClose={() => setOpenDropdown(null)}
                    >
                        <div className={styles.dropdownContent}>
                            <div className={styles.optionsList}>
                                {availableLossReasons.map(reason => (
                                    <label key={reason.id} className={styles.checkboxLabel}>
                                        <Checkbox
                                            checked={filters.motivoPerda.includes(reason.id)}
                                            onChange={() => handleLossReasonToggle(reason.id)}
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
            {activeFiltersCount > 0 && (
                <div className={styles.activeTags}>
                    {filters.search.trim() && (
                        <Tag variant="default" size="sm" onRemove={() => setFilter('search', '')}>
                            Busca: {filters.search.trim()}
                        </Tag>
                    )}

                    {filters.pipelines.map(pipeline => (
                        <Tag
                            key={pipeline}
                            variant="default"
                            size="sm"
                            onRemove={() => handlePipelineToggle(pipeline)}
                        >
                            Pipeline: {pipeline === 'high-ticket' ? 'High Ticket' : 'Low Ticket'}
                        </Tag>
                    ))}

                    {filters.stages.map(stageId => (
                        <Tag key={stageId} variant="default" size="sm" onRemove={() => handleStageToggle(stageId)}>
                            Etapa: {stageMap[stageId] || stageId}
                        </Tag>
                    ))}

                    {filters.dealStatus.map(status => (
                        <Tag key={status} variant="default" size="sm" onRemove={() => handleDealStatusToggle(status)}>
                            Status: {status === 'open' ? 'Aberto' : status === 'won' ? 'Ganho' : 'Perdido'}
                        </Tag>
                    ))}

                    {filters.responsibleIds.map(id => (
                        <Tag key={id} variant="default" size="sm" onRemove={() => handleResponsibleToggle(id)}>
                            Resp: {collaboratorMap[id] || id}
                        </Tag>
                    ))}

                    {filters.postSalesIds.map(id => (
                        <Tag key={id} variant="default" size="sm" onRemove={() => handlePostSalesToggle(id)}>
                            Pós-venda: {collaboratorMap[id] || id}
                        </Tag>
                    ))}

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
                            Perda: {lossReasonMap[reason] || reason}
                        </Tag>
                    ))}

                    {filters.comDono && (
                        <Tag variant="default" size="sm" onRemove={() => setFilter('comDono', false)}>
                            Com responsável
                        </Tag>
                    )}

                    {filters.semDono && (
                        <Tag variant="default" size="sm" onRemove={() => setFilter('semDono', false)}>
                            Sem responsável
                        </Tag>
                    )}

                    {filters.comTelefone && (
                        <Tag variant="default" size="sm" onRemove={() => setFilter('comTelefone', false)}>
                            Com telefone
                        </Tag>
                    )}

                    {filters.semTelefone && (
                        <Tag variant="default" size="sm" onRemove={() => setFilter('semTelefone', false)}>
                            Sem telefone
                        </Tag>
                    )}

                    {(typeof filters.valorMin === 'number' || typeof filters.valorMax === 'number') && (
                        <Tag
                            variant="default"
                            size="sm"
                            onRemove={() => {
                                setFilter('valorMin', undefined);
                                setFilter('valorMax', undefined);
                            }}
                        >
                            Valor: {typeof filters.valorMin === 'number' ? filters.valorMin.toLocaleString('pt-BR') : '0'}
                            {' - '}
                            {typeof filters.valorMax === 'number' ? filters.valorMax.toLocaleString('pt-BR') : '∞'}
                        </Tag>
                    )}

                    {(filters.dataCriacaoInicio || filters.dataCriacaoFim) && (
                        <Tag
                            variant="default"
                            size="sm"
                            onRemove={() => {
                                setFilter('dataCriacaoInicio', undefined);
                                setFilter('dataCriacaoFim', undefined);
                            }}
                        >
                            Criação: {formatDateChip(filters.dataCriacaoInicio) || '...'} até {formatDateChip(filters.dataCriacaoFim) || '...'}
                        </Tag>
                    )}

                    {(filters.dataAtualizacaoInicio || filters.dataAtualizacaoFim) && (
                        <Tag
                            variant="default"
                            size="sm"
                            onRemove={() => {
                                setFilter('dataAtualizacaoInicio', undefined);
                                setFilter('dataAtualizacaoFim', undefined);
                            }}
                        >
                            Atualização: {formatDateChip(filters.dataAtualizacaoInicio) || '...'} até {formatDateChip(filters.dataAtualizacaoFim) || '...'}
                        </Tag>
                    )}
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
