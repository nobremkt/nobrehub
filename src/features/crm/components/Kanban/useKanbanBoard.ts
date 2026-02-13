/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE KANBAN BOARD — state, DnD handlers, and action handlers
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';
import { Lead } from '@/types/lead.types';
import { LeadService } from '@/features/crm/services/LeadService';
import { InboxService } from '@/features/inbox/services/InboxService';
import { ROUTES } from '@/config';
import {
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
    arrayMove,
} from '@dnd-kit/sortable';

export function useKanbanBoard() {
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

    // ─── Computed ────────────────────────────────────────────────────────

    const totalOpportunities = useMemo(() => {
        return localLeads.filter(lead => {
            const stageIds = stages.map(s => s.id);
            return stageIds.includes(lead.status);
        }).length;
    }, [localLeads, stages]);

    // ─── Effects ─────────────────────────────────────────────────────────

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    useEffect(() => {
        if (!activeDragLead) {
            setLocalLeads(storeLeads);
        }
    }, [storeLeads, activeDragLead]);

    // ─── Lead helpers ────────────────────────────────────────────────────

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

    // ─── Sensors ─────────────────────────────────────────────────────────

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ─── Action Handlers ─────────────────────────────────────────────────

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    const handleLeadChat = async (lead: Lead) => {
        try {
            const conversationId = await InboxService.findOrCreateConversation({
                leadId: lead.id,
                leadName: lead.name,
                leadPhone: lead.phone,
                leadEmail: lead.email,
                leadCompany: lead.company,
            });
            navigate(ROUTES.inbox.conversation(conversationId));
        } catch (error) {
            console.error('Error opening chat:', error);
            toast.error('Erro ao abrir conversa');
        }
    };

    const handleLeadEdit = (lead: Lead) => {
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
            setLocalLeads(prev => prev.filter(l => l.id !== leadToDelete.id));
            toast.success('Lead excluído com sucesso!');
            setIsDeleteModalOpen(false);
            setLeadToDelete(null);
            fetchLeads();
        } catch (error) {
            console.error('Error deleting lead:', error);
            toast.error('Erro ao excluir lead');
        } finally {
            setIsDeleting(false);
        }
    };

    // ─── DnD Handlers ────────────────────────────────────────────────────

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.type === 'Lead') {
            setActiveDragLead(active.data.current.lead);
        }
    };

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
                const columnLeads = getLocalLeadsByStage(activeStatus);
                const activeIndex = columnLeads.findIndex(l => l.id === activeId);
                const overIndex = columnLeads.findIndex(l => l.id === overId);

                if (activeIndex !== overIndex) {
                    const newColumnLeads = arrayMove(columnLeads, activeIndex, overIndex);
                    const updatedColumnLeads = newColumnLeads.map((lead, idx) => ({
                        ...lead,
                        order: idx,
                    }));
                    setLocalLeads(prev => [
                        ...prev.filter(l => l.status !== activeStatus),
                        ...updatedColumnLeads,
                    ]);
                }
            } else {
                const overColumnLeads = getLocalLeadsByStage(overStatus);
                const overIndex = overColumnLeads.findIndex(l => l.id === overId);

                const sourceColumnLeads = getLocalLeadsByStage(activeStatus)
                    .filter(l => l.id !== activeId)
                    .map((lead, idx) => ({ ...lead, order: idx }));

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
                const sourceColumnLeads = getLocalLeadsByStage(activeStatus)
                    .filter(l => l.id !== activeId)
                    .map((lead, idx) => ({ ...lead, order: idx }));

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

        const movedLead = localLeads.find(l => l.id === active.id);
        setLeads(localLeads);

        if (movedLead) {
            try {
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
            styles: { active: { opacity: '0.5' } },
        }),
    };

    return {
        // State
        activeDragLead,
        selectedLead,
        isModalOpen, setIsModalOpen,
        isCreateModalOpen, setIsCreateModalOpen,
        isDeleteModalOpen, setIsDeleteModalOpen,
        leadToDelete, setLeadToDelete,
        isDeleting,
        searchTerm, setSearchTerm,
        // Computed
        stages,
        totalOpportunities,
        // DnD
        sensors,
        dropAnimation,
        getLocalLeadsByStage,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragCancel,
        // Action handlers
        handleLeadClick,
        handleLeadChat,
        handleLeadEdit,
        handleLeadDelete,
        confirmDelete,
        fetchLeads,
    };
}
