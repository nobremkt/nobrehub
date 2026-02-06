/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - KANBAN BOARD (DND-KIT VERSION)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Implementação premium do Kanban usando @dnd-kit.
 * Suporta animações suaves, acessibilidade e drag-and-drop avançado.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';
import { Lead } from '@/types/lead.types';
import { Calendar, AlertCircle, TrendingUp, Crown, Zap, MessageCircle, Edit2, Trash2, Search } from 'lucide-react';
import { Modal, Button } from '@/design-system';
import styles from './Kanban.module.css';
import { Lead360Modal } from '../Lead360Modal/Lead360Modal';
import { LeadService } from '@/features/crm/services/LeadService';

// DND-KIT Imports
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
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
// KANBAN BOARD (Main Component)
// ─────────────────────────────────────────────────────────────────────────────import { Lead360Modal } from '../Lead360Modal/Lead360Modal';
import { CreateLeadModal } from '../CreateLeadModal/CreateLeadModal';

export function KanbanBoard() {
    const navigate = useNavigate();
    const { activePipeline, getStagesByPipeline, leads: storeLeads, setLeads, fetchLeads, updateLead } = useKanbanStore();
    const [localLeads, setLocalLeads] = useState<Lead[]>(storeLeads);
    const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const stages = getStagesByPipeline(activePipeline);

    // Calculate total opportunities for current pipeline
    const totalOpportunities = useMemo(() => {
        return localLeads.filter(lead => {
            const stageIds = stages.map(s => s.id);
            return stageIds.includes(lead.status);
        }).length;
    }, [localLeads, stages]);

    // Initial Fetch
    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Sincroniza estado local com store quando não está arrastando
    useEffect(() => {
        if (!activeDragLead) {
            setLocalLeads(storeLeads);
        }
    }, [storeLeads, activeDragLead]);

    // ... (unchanged helpers)

    // Função para pegar leads de uma coluna do estado local (com filtro de busca)
    const getLocalLeadsByStage = useCallback((stageId: string) => {
        return localLeads
            .filter(lead => lead.status === stageId)
            .filter(lead => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                return (
                    lead.name.toLowerCase().includes(search) ||
                    lead.company?.toLowerCase().includes(search) ||
                    lead.email?.toLowerCase().includes(search) ||
                    lead.phone?.includes(search)
                );
            })
            .sort((a, b) => a.order - b.order);
    }, [localLeads, searchTerm]);

    // ... (unchanged sensors and lead click)

    // Configuração dos sensores (Mouse, Touch, Teclado)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    // Action Handlers
    const handleLeadChat = (lead: Lead) => {
        // Navigate to inbox with lead data for finding or creating conversation
        const params = new URLSearchParams({
            phone: lead.phone,
            name: lead.name,
            ...(lead.email && { email: lead.email }),
            ...(lead.company && { company: lead.company }),
            ...(lead.id && { leadId: lead.id }),
        });
        navigate(`/inbox?${params.toString()}`);
    };

    const handleLeadEdit = (lead: Lead) => {
        // Edit action now opens Lead360Modal (same as click)
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    const handleLeadDelete = (lead: Lead) => {
        setLeadToDelete(lead);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!leadToDelete) return;

        setIsDeleting(true);
        try {
            await LeadService.deleteLead(leadToDelete.id);
            // Remove from local state immediately
            setLocalLeads(prev => prev.filter(l => l.id !== leadToDelete.id));
            toast.success('Lead excluído com sucesso!');
            setIsDeleteModalOpen(false);
            setLeadToDelete(null);
            // Refresh from server
            fetchLeads();
        } catch (error) {
            console.error('Error deleting lead:', error);
            toast.error('Erro ao excluir lead');
        } finally {
            setIsDeleting(false);
        }
    };

    // DND Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.type === 'Lead') {
            setActiveDragLead(active.data.current.lead);
        }
    };

    // ... (unchanged handleDragOver)

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveLead = active.data.current?.type === 'Lead';
        const isOverLead = over.data.current?.type === 'Lead';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveLead) return;

        const activeLead = localLeads.find(l => l.id === activeId);
        if (!activeLead) return;

        // Cenário 1: Arrastando sobre outro Lead
        if (isOverLead) {
            const overLead = localLeads.find(l => l.id === overId);
            if (!overLead) return;

            const activeStatus = activeLead.status;
            const overStatus = overLead.status;

            if (activeStatus === overStatus) {
                // Mesma coluna - reordena
                const columnLeads = getLocalLeadsByStage(activeStatus);
                const activeIndex = columnLeads.findIndex(l => l.id === activeId);
                const overIndex = columnLeads.findIndex(l => l.id === overId);

                if (activeIndex !== overIndex) {
                    const newColumnLeads = arrayMove(columnLeads, activeIndex, overIndex);
                    // Atualiza orders
                    const updatedColumnLeads = newColumnLeads.map((lead, idx) => ({
                        ...lead,
                        order: idx,
                    }));
                    // Atualiza estado local
                    setLocalLeads(prev => [
                        ...prev.filter(l => l.status !== activeStatus),
                        ...updatedColumnLeads,
                    ]);
                }
            } else {
                // Coluna diferente - move para a coluna do overLead
                const overColumnLeads = getLocalLeadsByStage(overStatus);
                const overIndex = overColumnLeads.findIndex(l => l.id === overId);

                // Remove da coluna origem
                const sourceColumnLeads = getLocalLeadsByStage(activeStatus)
                    .filter(l => l.id !== activeId)
                    .map((lead, idx) => ({ ...lead, order: idx }));

                // Insere na coluna destino
                const movedLead = { ...activeLead, status: overStatus };
                const newTargetLeads = [...overColumnLeads];
                newTargetLeads.splice(overIndex, 0, movedLead);
                const updatedTargetLeads = newTargetLeads.map((lead, idx) => ({
                    ...lead,
                    order: idx,
                }));

                setLocalLeads(prev => [
                    ...prev.filter(l => l.status !== activeStatus && l.status !== overStatus),
                    ...sourceColumnLeads,
                    ...updatedTargetLeads,
                ]);
            }
        }

        // Cenário 2: Arrastando sobre uma coluna vazia
        if (isOverColumn) {
            const targetStageId = over.data.current?.stageId || overId;
            const activeStatus = activeLead.status;

            if (activeStatus !== targetStageId) {
                // Remove da coluna origem
                const sourceColumnLeads = getLocalLeadsByStage(activeStatus)
                    .filter(l => l.id !== activeId)
                    .map((lead, idx) => ({ ...lead, order: idx }));

                // Adiciona no final da coluna destino
                const targetColumnLeads = getLocalLeadsByStage(targetStageId);
                const movedLead = { ...activeLead, status: targetStageId, order: targetColumnLeads.length };

                setLocalLeads(prev => [
                    ...prev.filter(l => l.status !== activeStatus && l.status !== targetStageId),
                    ...sourceColumnLeads,
                    ...targetColumnLeads,
                    movedLead,
                ]);
            }
        }
    };

    const handleDragEnd = async (_event: DragEndEvent) => {
        const { active } = _event;
        setActiveDragLead(null);

        // Find the moved lead in the local state specifically to get its new details
        const movedLead = localLeads.find(l => l.id === active.id);

        // Update Global Store (Calls API if I update logic)
        setLeads(localLeads);

        // Simple Persistence Trigger
        if (movedLead) {
            try {
                // We should technically update ALL leads that changed (order or status)
                // For now, we update at least the active one so status changes persist
                // Ideal implementation requires batch update or "Sync Order" endpoint
                await updateLead(movedLead.id, {
                    status: movedLead.status,
                    order: movedLead.order
                });
            } catch (err) {
                console.error("Persist failed", err);
            }
        }
    };

    const handleDragCancel = () => {
        setActiveDragLead(null);
        setLocalLeads(storeLeads);
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <div className={styles.kanban}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <PipelineTabs />
                    <span className={styles.opportunityCounter}>
                        {totalOpportunities} oportunidades
                    </span>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar lead..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button
                        className={styles.addBtn}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        + Novo Lead
                    </button>
                </div>
            </div>

            {/* Board */}
            <div className={styles.board}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    {stages.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            id={stage.id}
                            name={stage.name}
                            color={stage.color}
                            leads={getLocalLeadsByStage(stage.id)}
                            onLeadClick={handleLeadClick}
                            onLeadChat={handleLeadChat}
                            onLeadEdit={handleLeadEdit}
                            onLeadDelete={handleLeadDelete}
                        />
                    ))}

                    {createPortal(
                        <DragOverlay dropAnimation={dropAnimation}>
                            {activeDragLead && (
                                <LeadCard lead={activeDragLead} isOverlay />
                            )}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>
            </div>

            <Lead360Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                lead={selectedLead}
            />

            <CreateLeadModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchLeads()}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setLeadToDelete(null);
                }}
                title="Confirmar Exclusão"
            >
                <div className={styles.deleteModal}>
                    <p>
                        Tem certeza que deseja excluir o lead <strong>{leadToDelete?.name}</strong>?
                    </p>
                    <p className={styles.deleteWarning}>
                        Esta ação não pode ser desfeita.
                    </p>
                    <div className={styles.deleteActions}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setLeadToDelete(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            isLoading={isDeleting}
                        >
                            Excluir
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
