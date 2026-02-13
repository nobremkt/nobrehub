/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE CONTACTS QUICK ACTIONS — state & handlers for ContactsQuickActions
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo, useEffect } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { useKanbanStore, PipelineType } from '../../stores/useKanbanStore';
import { useLossReasonStore } from '@/features/settings/stores/useLossReasonStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { LeadService } from '../../services/LeadService';
import { toast } from 'react-toastify';

export const PIPELINE_OPTIONS = [
    { value: 'high-ticket', label: 'High Ticket' },
    { value: 'low-ticket', label: 'Low Ticket' },
];

export function useContactsQuickActions() {
    const { selectedIds, contacts, availableTags, setAvailableTags, setContacts } = useContactsStore();
    const { getStagesByPipeline } = useKanbanStore();

    // Team members
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const { sectors, fetchSectors } = useSectorStore();

    // Modal states
    const [showAddTagModal, setShowAddTagModal] = useState(false);
    const [showRemoveTagModal, setShowRemoveTagModal] = useState(false);
    const [showAssignVendedoraModal, setShowAssignVendedoraModal] = useState(false);
    const [showAssignPosVendaModal, setShowAssignPosVendaModal] = useState(false);
    const [showMoveStageModal, setShowMoveStageModal] = useState(false);
    const [showLostModal, setShowLostModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Selected values
    const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
    const [selectedTagsToRemove, setSelectedTagsToRemove] = useState<Set<string>>(new Set());
    const [newTagName, setNewTagName] = useState('');
    const [isCreatingNewTag, setIsCreatingNewTag] = useState(false);
    const [selectedVendedora, setSelectedVendedora] = useState<string | undefined>(undefined);
    const [selectedPosVenda, setSelectedPosVenda] = useState<string | undefined>(undefined);
    const [selectedPipeline, setSelectedPipeline] = useState<PipelineType | undefined>(undefined);
    const [selectedStage, setSelectedStage] = useState<string | undefined>(undefined);
    const [selectedLossReason, setSelectedLossReason] = useState<string>('');

    // Loss reasons
    const { lossReasons, fetchLossReasons } = useLossReasonStore();

    // ─── Effects ────────────────────────────────────────────────────────

    useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (sectors.length === 0) fetchSectors();
    }, [collaborators.length, sectors.length, fetchCollaborators, fetchSectors]);

    useEffect(() => {
        if (lossReasons.length === 0) fetchLossReasons();
    }, [lossReasons.length, fetchLossReasons]);

    // ─── Memoized values ────────────────────────────────────────────────

    const sectorNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        sectors.forEach(s => { map[s.id] = s.name; });
        return map;
    }, [sectors]);

    const vendedoras = useMemo(() =>
        collaborators
            .filter(c => c.active !== false && sectorNameMap[c.sectorId || '']?.toLowerCase().includes('venda'))
            .filter(c => !sectorNameMap[c.sectorId || '']?.toLowerCase().includes('pós'))
            .map(c => ({ id: c.id, name: c.name, sector: sectorNameMap[c.sectorId || ''] || 'Vendas' })),
        [collaborators, sectorNameMap]
    );

    const posVendaMembers = useMemo(() =>
        collaborators
            .filter(c => c.active !== false && sectorNameMap[c.sectorId || '']?.toLowerCase().includes('pós'))
            .map(c => ({ id: c.id, name: c.name, sector: sectorNameMap[c.sectorId || ''] || 'Pós-Venda' })),
        [collaborators, sectorNameMap]
    );

    const LOSS_REASONS = [...lossReasons]
        .filter(r => r.active)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map(r => ({ value: r.id, label: r.name }));

    const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

    const tagsInSelection = useMemo(() =>
        Array.from(new Set(selectedContacts.flatMap(c => c.tags || []))),
        [selectedContacts]
    );

    const stagesForPipeline = useMemo(() => {
        if (!selectedPipeline) return [];
        return getStagesByPipeline(selectedPipeline);
    }, [selectedPipeline, getStagesByPipeline]);

    // ─── Handlers ───────────────────────────────────────────────────────

    const handlePipelineChange = (val: string | number | undefined) => {
        setSelectedPipeline(val as PipelineType);
        setSelectedStage(undefined);
    };

    const handleExportCSV = () => {
        if (selectedContacts.length === 0) return;

        const headers = ['Nome', 'Telefone', 'Email', 'Empresa', 'Tags', 'Pipeline', 'Etapa'];
        const csvContent = [
            headers.join(','),
            ...selectedContacts.map(c => [
                `"${c.name || ''}"`,
                `"${c.phone || ''}"`,
                `"${c.email || ''}"`,
                `"${c.company || ''}"`,
                `"${(c.tags || []).join('; ')}"`,
                `"${c.pipeline || ''}"`,
                `"${c.status || ''}"`,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `contatos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast.success(`${selectedContacts.length} contatos exportados!`);
    };

    const handleAddTag = async () => {
        const tagToAdd = isCreatingNewTag ? newTagName.trim() : selectedTag;
        if (!tagToAdd) return;

        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                const contact = contacts.find(c => c.id === id);
                if (contact) {
                    const currentTags = contact.tags || [];
                    if (!currentTags.includes(tagToAdd)) {
                        const newTags = [...currentTags, tagToAdd];
                        await LeadService.updateLead(id, { tags: newTags });
                    }
                }
            }

            if (isCreatingNewTag && !availableTags.includes(tagToAdd)) {
                setAvailableTags([...availableTags, tagToAdd]);
            }

            const updatedContacts = contacts.map(c => {
                if (selectedIds.has(c.id)) {
                    const currentTags = c.tags || [];
                    if (!currentTags.includes(tagToAdd)) {
                        return { ...c, tags: [...currentTags, tagToAdd] };
                    }
                }
                return c;
            });
            setContacts(updatedContacts);

            toast.success(`Tag "${tagToAdd}" adicionada a ${ids.length} contato(s)`);
            resetAddTagModal();
        } catch (error) {
            console.error('Error adding tag:', error);
            toast.error('Erro ao adicionar tag.');
        }
    };

    const resetAddTagModal = () => {
        setShowAddTagModal(false);
        setSelectedTag(undefined);
        setNewTagName('');
        setIsCreatingNewTag(false);
    };

    const handleRemoveTag = async () => {
        if (selectedTagsToRemove.size === 0) return;

        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                const contact = contacts.find(c => c.id === id);
                if (contact) {
                    const currentTags = contact.tags || [];
                    const newTags = currentTags.filter(t => !selectedTagsToRemove.has(t));
                    if (newTags.length !== currentTags.length) {
                        await LeadService.updateLead(id, { tags: newTags });
                    }
                }
            }

            const updatedContacts = contacts.map(c => {
                if (selectedIds.has(c.id)) {
                    return { ...c, tags: (c.tags || []).filter(t => !selectedTagsToRemove.has(t)) };
                }
                return c;
            });
            setContacts(updatedContacts);

            toast.success(`${selectedTagsToRemove.size} tag(s) removida(s) de ${ids.length} contato(s)`);
            setShowRemoveTagModal(false);
            setSelectedTagsToRemove(new Set());
        } catch (error) {
            console.error('Error removing tags:', error);
            toast.error('Erro ao remover tags.');
        }
    };

    const toggleTagToRemove = (tag: string) => {
        setSelectedTagsToRemove(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tag)) {
                newSet.delete(tag);
            } else {
                newSet.add(tag);
            }
            return newSet;
        });
    };

    const handleAssignVendedora = async () => {
        if (!selectedVendedora) return;

        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                await LeadService.updateLead(id, { responsibleId: selectedVendedora });
            }

            const updatedContacts = contacts.map(c => {
                if (selectedIds.has(c.id)) {
                    return { ...c, responsibleId: selectedVendedora };
                }
                return c;
            });
            setContacts(updatedContacts);

            const vendedora = vendedoras.find(v => v.id === selectedVendedora);
            toast.success(`${ids.length} contato(s) atribuído(s) a ${vendedora?.name || 'vendedora'}`);
            setShowAssignVendedoraModal(false);
            setSelectedVendedora(undefined);
        } catch (error) {
            console.error('Error assigning vendedora:', error);
            toast.error('Erro ao atribuir vendedora.');
        }
    };

    const handleAssignPosVenda = async () => {
        if (!selectedPosVenda) return;

        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                await LeadService.updateLead(id, { postSalesId: selectedPosVenda });
            }

            const updatedContacts = contacts.map(c => {
                if (selectedIds.has(c.id)) {
                    return { ...c, postSalesId: selectedPosVenda };
                }
                return c;
            });
            setContacts(updatedContacts);

            const posVenda = posVendaMembers.find(m => m.id === selectedPosVenda);
            toast.success(`${ids.length} contato(s) atribuído(s) a ${posVenda?.name || 'pós-venda'}`);
            setShowAssignPosVendaModal(false);
            setSelectedPosVenda(undefined);
        } catch (error) {
            console.error('Error assigning pós-venda:', error);
            toast.error('Erro ao atribuir pós-venda.');
        }
    };

    const handleMoveStage = async () => {
        if (!selectedPipeline || !selectedStage) return;

        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                await LeadService.updateLead(id, {
                    pipeline: selectedPipeline,
                    status: selectedStage,
                });
            }

            const updatedContacts = contacts.map(c => {
                if (selectedIds.has(c.id)) {
                    return { ...c, pipeline: selectedPipeline, status: selectedStage };
                }
                return c;
            });
            setContacts(updatedContacts);

            toast.success(`${ids.length} contato(s) movido(s) para nova etapa`);
            setShowMoveStageModal(false);
            setSelectedPipeline(undefined);
            setSelectedStage(undefined);
        } catch (error) {
            console.error('Error moving stage:', error);
            toast.error('Erro ao mover para etapa.');
        }
    };

    const handleMarkLost = async () => {
        if (!selectedLossReason) return;

        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                await LeadService.updateLead(id, {
                    dealStatus: 'lost',
                    lostReason: selectedLossReason,
                });
            }

            const updatedContacts = contacts.map(c => {
                if (selectedIds.has(c.id)) {
                    return { ...c, dealStatus: 'lost' as const, lostReason: selectedLossReason };
                }
                return c;
            });
            setContacts(updatedContacts);

            toast.success(`${ids.length} contato(s) marcado(s) como perdido(s)`);
            setShowLostModal(false);
            setSelectedLossReason('');
        } catch (error) {
            console.error('Error marking as lost:', error);
            toast.error('Erro ao marcar como perdido.');
        }
    };

    const handleDelete = async () => {
        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                await LeadService.deleteLead(id);
            }

            const updatedContacts = contacts.filter(c => !selectedIds.has(c.id));
            setContacts(updatedContacts);

            toast.success(`${ids.length} contato(s) excluído(s)`);
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Error deleting contacts:', error);
            toast.error('Erro ao excluir contatos.');
        }
    };

    return {
        // Modal states
        showAddTagModal, setShowAddTagModal,
        showRemoveTagModal, setShowRemoveTagModal,
        showAssignVendedoraModal, setShowAssignVendedoraModal,
        showAssignPosVendaModal, setShowAssignPosVendaModal,
        showMoveStageModal, setShowMoveStageModal,
        showLostModal, setShowLostModal,
        showDeleteConfirm, setShowDeleteConfirm,
        // Selected values
        selectedTag, setSelectedTag,
        selectedTagsToRemove, setSelectedTagsToRemove,
        newTagName, setNewTagName,
        isCreatingNewTag, setIsCreatingNewTag,
        selectedVendedora, setSelectedVendedora,
        selectedPosVenda, setSelectedPosVenda,
        selectedPipeline,
        selectedStage, setSelectedStage,
        selectedLossReason, setSelectedLossReason,
        // Computed
        availableTags,
        vendedoras,
        posVendaMembers,
        LOSS_REASONS,
        tagsInSelection,
        stagesForPipeline,
        // Handlers
        handlePipelineChange,
        handleExportCSV,
        handleAddTag,
        resetAddTagModal,
        handleRemoveTag,
        toggleTagToRemove,
        handleAssignVendedora,
        handleAssignPosVenda,
        handleMoveStage,
        handleMarkLost,
        handleDelete,
    };
}
