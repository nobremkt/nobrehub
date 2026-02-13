/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - KANBAN BOARD (DND-KIT VERSION)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Implementação premium do Kanban usando @dnd-kit.
 * Suporta animações suaves, acessibilidade e drag-and-drop avançado.
 * State & DnD handlers delegated to useKanbanBoard hook.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lead } from '@/types/lead.types';
import { Calendar, AlertCircle, TrendingUp, Crown, Zap, MessageCircle, Edit2, Trash2, Search } from 'lucide-react';
import { Modal, Button } from '@/design-system';
import styles from './Kanban.module.css';
import { Lead360Modal } from '../Lead360Modal/Lead360Modal';
import { CreateLeadModal } from '../CreateLeadModal/CreateLeadModal';
import { useKanbanBoard } from './useKanbanBoard';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';

// DND-KIT Imports
import {
    DndContext,
    DragOverlay,
    closestCenter,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE TABS
// ─────────────────────────────────────────────────────────────────────────────

function PipelineTabs() {
    const { activePipeline, setActivePipeline } = useKanbanStore();

    return (
        <div className={styles.tabs}>
            <button
                className={`${styles.tab} ${activePipeline === 'high-ticket' ? styles.tabActive : ''}`}
                onClick={() => setActivePipeline('high-ticket')}
            >
                <Crown size={16} />
                High Ticket
            </button>
            <button
                className={`${styles.tab} ${activePipeline === 'low-ticket' ? styles.tabActive : ''}`}
                onClick={() => setActivePipeline('low-ticket')}
            >
                <Zap size={16} />
                Low Ticket
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD COMPONENT (Visual)
// ─────────────────────────────────────────────────────────────────────────────

interface LeadCardProps {
    lead: Lead;
    onClick?: (lead: Lead) => void;
    onChat?: (lead: Lead) => void;
    onEdit?: (lead: Lead) => void;
    onDelete?: (lead: Lead) => void;
    isOverlay?: boolean;
}

function LeadCard({ lead, onClick, onChat, onEdit, onDelete, isOverlay }: LeadCardProps) {
    const formatCurrency = (value?: number) => {
        if (!value) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'agora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const isUrgent = lead.tags.some(t => t.toLowerCase().includes('urgente'));

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
            className={`${styles.card} ${isOverlay ? styles.cardOverlay : ''}`}
            onClick={onClick ? () => onClick(lead) : undefined}
            style={{ cursor: isOverlay ? 'grabbing' : 'grab' }}
        >
            {/* Card Header with Avatar */}
            <div className={styles.cardHeader}>
                <div className={styles.avatarInitials}>
                    {getInitials(lead.name)}
                </div>
                <div className={styles.cardHeaderInfo}>
                    <div className={styles.cardTitle}>
                        <span className={styles.cardName}>{lead.name}</span>
                        {isUrgent && <AlertCircle size={14} className={styles.urgentIcon} />}
                    </div>
                    {lead.company && (
                        <span className={styles.cardCompany}>{lead.company}</span>
                    )}
                </div>
            </div>

            {/* Tags */}
            {lead.tags.length > 0 && (
                <div className={styles.cardTags}>
                    {lead.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className={styles.tag}>{tag}</span>
                    ))}
                    {lead.tags.length > 3 && (
                        <span className={styles.tagMore}>+{lead.tags.length - 3}</span>
                    )}
                </div>
            )}

            {/* Value */}
            <div className={styles.cardValue}>
                {formatCurrency(lead.estimatedValue)}
            </div>

            {/* Card Footer with Actions */}
            <div className={styles.cardFooter}>
                <div className={styles.cardActions}>
                    {onChat && (
                        <button
                            className={styles.actionBtn}
                            onClick={(e) => handleActionClick(e, () => onChat(lead))}
                            title="Abrir conversa"
                        >
                            <MessageCircle size={14} />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            className={styles.actionBtn}
                            onClick={(e) => handleActionClick(e, () => onEdit(lead))}
                            title="Editar"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={(e) => handleActionClick(e, () => onDelete(lead))}
                            title="Excluir"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
                <span className={styles.cardTime}>
                    <Calendar size={10} />
                    {getTimeAgo(lead.updatedAt)}
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SORTABLE ITEM (Logic)
// ─────────────────────────────────────────────────────────────────────────────

interface SortableLeadCardProps {
    lead: Lead;
    onClick: (lead: Lead) => void;
    onChat: (lead: Lead) => void;
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
}

function SortableLeadCard({ lead, onClick, onChat, onEdit, onDelete }: SortableLeadCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: lead.id,
        data: {
            type: 'Lead',
            lead,
        },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={styles.sortableWrapper}
        >
            <LeadCard lead={lead} onClick={onClick} onChat={onChat} onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// DROPPABLE COLUMN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface KanbanColumnProps {
    id: string;
    name: string;
    color: string;
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
    onLeadChat: (lead: Lead) => void;
    onLeadEdit: (lead: Lead) => void;
    onLeadDelete: (lead: Lead) => void;
}

function KanbanColumn({ id, name, color, leads, onLeadClick, onLeadChat, onLeadEdit, onLeadDelete }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: {
            type: 'Column',
            stageId: id,
        },
    });

    const leadsIds = useMemo(() => leads.map((l) => l.id), [leads]);

    const totalValue = leads.reduce((acc, lead) => acc + (lead.estimatedValue || 0), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className={styles.column}>
            {/* Column Header */}
            <div className={styles.columnHeader}>
                <div className={styles.columnColorBar} style={{ backgroundColor: color }} />
                <div className={styles.columnInfo}>
                    <div className={styles.columnTitleRow}>
                        <h3 className={styles.columnName}>{name}</h3>
                        <span className={styles.columnCount}>{leads.length}</span>
                    </div>
                    <span className={styles.columnTotal}>
                        <TrendingUp size={12} />
                        {formatCurrency(totalValue)}
                    </span>
                </div>
            </div>

            {/* Column Body (Droppable Area) */}
            <div
                ref={setNodeRef}
                className={`${styles.columnBody} ${isOver ? styles.columnBodyOver : ''}`}
            >
                <SortableContext items={leadsIds} strategy={verticalListSortingStrategy}>
                    {leads.map((lead) => (
                        <SortableLeadCard
                            key={lead.id}
                            lead={lead}
                            onClick={onLeadClick}
                            onChat={onLeadChat}
                            onEdit={onLeadEdit}
                            onDelete={onLeadDelete}
                        />
                    ))}
                </SortableContext>

                {leads.length === 0 && (
                    <div className={styles.emptyColumn}>
                        <span>Arraste aqui</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// KANBAN BOARD (Main Component) — uses useKanbanBoard hook for all logic
// ─────────────────────────────────────────────────────────────────────────────

export function KanbanBoard() {
    const kb = useKanbanBoard();

    return (
        <div className={styles.kanban}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <PipelineTabs />
                    <span className={styles.opportunityCounter}>
                        {kb.totalOpportunities} oportunidades
                    </span>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar lead..."
                            value={kb.searchTerm}
                            onChange={(e) => kb.setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button
                        className={styles.addBtn}
                        onClick={() => kb.setIsCreateModalOpen(true)}
                    >
                        + Novo Lead
                    </button>
                </div>
            </div>

            {/* Board */}
            <div className={styles.board}>
                <DndContext
                    sensors={kb.sensors}
                    collisionDetection={closestCenter}
                    onDragStart={kb.handleDragStart}
                    onDragOver={kb.handleDragOver}
                    onDragEnd={kb.handleDragEnd}
                    onDragCancel={kb.handleDragCancel}
                >
                    {kb.stages.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            id={stage.id}
                            name={stage.name}
                            color={stage.color}
                            leads={kb.getLocalLeadsByStage(stage.id)}
                            onLeadClick={kb.handleLeadClick}
                            onLeadChat={kb.handleLeadChat}
                            onLeadEdit={kb.handleLeadEdit}
                            onLeadDelete={kb.handleLeadDelete}
                        />
                    ))}

                    {createPortal(
                        <DragOverlay dropAnimation={kb.dropAnimation}>
                            {kb.activeDragLead && (
                                <LeadCard lead={kb.activeDragLead} isOverlay />
                            )}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>
            </div>

            <Lead360Modal
                isOpen={kb.isModalOpen}
                onClose={() => kb.setIsModalOpen(false)}
                lead={kb.selectedLead}
            />

            <CreateLeadModal
                isOpen={kb.isCreateModalOpen}
                onClose={() => kb.setIsCreateModalOpen(false)}
                onSuccess={() => kb.fetchLeads()}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={kb.isDeleteModalOpen}
                onClose={() => {
                    kb.setIsDeleteModalOpen(false);
                    kb.setLeadToDelete(null);
                }}
                title="Confirmar Exclusão"
            >
                <div className={styles.deleteModal}>
                    <p>
                        Tem certeza que deseja excluir o lead <strong>{kb.leadToDelete?.name}</strong>?
                    </p>
                    <p className={styles.deleteWarning}>
                        Esta ação não pode ser desfeita.
                    </p>
                    <div className={styles.deleteActions}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                kb.setIsDeleteModalOpen(false);
                                kb.setLeadToDelete(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={kb.confirmDelete}
                            isLoading={kb.isDeleting}
                        >
                            Excluir
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
