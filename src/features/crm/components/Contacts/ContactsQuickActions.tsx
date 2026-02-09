/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS QUICK ACTIONS
 * Barra de ações em massa que aparece quando contatos estão selecionados
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { useKanbanStore, PipelineType } from '../../stores/useKanbanStore';
import { useLossReasonStore } from '@/features/settings/stores/useLossReasonStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { Button, Modal, ConfirmModal, Dropdown, Input, Checkbox } from '@/design-system';
import {
    Tag as TagIcon,
    Tags,
    UserPlus,
    ArrowRight,
    XCircle,
    Download,
    Trash2,
    X,
    Plus
} from 'lucide-react';
import styles from './ContactsQuickActions.module.css';
import { LeadService } from '../../services/LeadService';
import { toast } from 'react-toastify';

const PIPELINE_OPTIONS = [
    { value: 'high-ticket', label: 'High Ticket' },
    { value: 'low-ticket', label: 'Low Ticket' },
];

interface ContactsQuickActionsProps {
    selectedCount: number;
    onClearSelection: () => void;
}

export const ContactsQuickActions: React.FC<ContactsQuickActionsProps> = ({
    selectedCount,
    onClearSelection,
}) => {
    const { selectedIds, contacts, availableTags, setAvailableTags, setContacts } = useContactsStore();
    const { getStagesByPipeline } = useKanbanStore();

    // Team members from stores
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

    // Loss reasons from store
    const { lossReasons, fetchLossReasons } = useLossReasonStore();

    // Fetch collaborators and sectors on mount
    useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (sectors.length === 0) fetchSectors();
    }, [collaborators.length, sectors.length, fetchCollaborators, fetchSectors]);

    useEffect(() => {
        if (lossReasons.length === 0) fetchLossReasons();
    }, [lossReasons.length, fetchLossReasons]);

    // Build sector name map for filtering
    const sectorNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        sectors.forEach(s => { map[s.id] = s.name; });
        return map;
    }, [sectors]);

    // Filter collaborators by sector
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

    // Get selected contacts
    const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

    // Get tags from selected contacts for removal
    const tagsInSelection = useMemo(() =>
        Array.from(new Set(selectedContacts.flatMap(c => c.tags || []))),
        [selectedContacts]
    );

    // Get stages for selected pipeline
    const stagesForPipeline = useMemo(() => {
        if (!selectedPipeline) return [];
        return getStagesByPipeline(selectedPipeline);
    }, [selectedPipeline, getStagesByPipeline]);

    // Reset stage when pipeline changes
    const handlePipelineChange = (val: string | number | undefined) => {
        setSelectedPipeline(val as PipelineType);
        setSelectedStage(undefined);
    };

    const handleExportCSV = () => {
        const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Tags'];
        const rows = selectedContacts.map(c => [
            c.name,
            c.email || '',
            c.phone,
            c.company || '',
            c.tags?.join('; ') || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contatos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleAddTag = async () => {
        const tagToAdd = isCreatingNewTag ? newTagName.trim() : selectedTag;
        if (!tagToAdd) return;

        // Add new tag to available tags if creating
        if (isCreatingNewTag && !availableTags.includes(tagToAdd)) {
            setAvailableTags([...availableTags, tagToAdd]);
        }

        try {
            await LeadService.bulkAddTag(Array.from(selectedIds), tagToAdd, contacts);

            // Update store state immutably for real-time UI update
            const updatedContacts = contacts.map(contact => {
                if (selectedIds.has(contact.id) && !contact.tags?.includes(tagToAdd)) {
                    return { ...contact, tags: [...(contact.tags || []), tagToAdd] };
                }
                return contact;
            });
            setContacts(updatedContacts);

            toast.success(`Tag "${tagToAdd}" adicionada a ${selectedCount} contato(s)`);
        } catch (error) {
            console.error('Error adding tag:', error);
            toast.error('Erro ao adicionar tag');
        }

        // Reset form but keep modal open for adding more tags
        setSelectedTag(undefined);
        setNewTagName('');
        setIsCreatingNewTag(false);
    };

    const resetAddTagModal = () => {
        setShowAddTagModal(false);
        setSelectedTag(undefined);
        setNewTagName('');
        setIsCreatingNewTag(false);
    };

    const handleRemoveTag = async () => {
        if (selectedTagsToRemove.size === 0) return;

        const tagsArray = Array.from(selectedTagsToRemove);
        const tagsSet = new Set(tagsArray);

        try {
            await LeadService.bulkRemoveTags(Array.from(selectedIds), tagsArray, contacts);

            // Update store state immutably for real-time UI update
            const updatedContacts = contacts.map(contact => {
                if (selectedIds.has(contact.id) && contact.tags) {
                    return { ...contact, tags: contact.tags.filter(t => !tagsSet.has(t)) };
                }
                return contact;
            });
            setContacts(updatedContacts);

            toast.success(`${tagsArray.length} tag(s) removida(s) de ${selectedCount} contato(s)`);
        } catch (error) {
            console.error('Error removing tags:', error);
            toast.error('Erro ao remover tags');
        }

        setShowRemoveTagModal(false);
        setSelectedTagsToRemove(new Set());
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
            await LeadService.bulkAssignResponsible(
                Array.from(selectedIds),
                selectedVendedora,
                'responsibleId'
            );

            // Update store state for real-time UI update
            const updatedContacts = contacts.map(contact => {
                if (selectedIds.has(contact.id)) {
                    return { ...contact, responsibleId: selectedVendedora };
                }
                return contact;
            });
            setContacts(updatedContacts);

            const vendedoraName = vendedoras.find(v => v.id === selectedVendedora)?.name || 'Vendedora';
            toast.success(`${vendedoraName} atribuída a ${selectedCount} contato(s)`);
        } catch (error) {
            console.error('Error assigning vendedora:', error);
            toast.error('Erro ao atribuir vendedora');
        }

        setShowAssignVendedoraModal(false);
        setSelectedVendedora(undefined);
    };

    const handleAssignPosVenda = async () => {
        if (!selectedPosVenda) return;

        try {
            await LeadService.bulkAssignResponsible(
                Array.from(selectedIds),
                selectedPosVenda,
                'postSalesId'
            );

            // Update store state for real-time UI update
            const updatedContacts = contacts.map(contact => {
                if (selectedIds.has(contact.id)) {
                    return { ...contact, postSalesId: selectedPosVenda };
                }
                return contact;
            });
            setContacts(updatedContacts);

            const posVendaName = posVendaMembers.find(m => m.id === selectedPosVenda)?.name || 'Responsável';
            toast.success(`${posVendaName} atribuído a ${selectedCount} contato(s)`);
        } catch (error) {
            console.error('Error assigning pós-venda:', error);
            toast.error('Erro ao atribuir pós-venda');
        }

        setShowAssignPosVendaModal(false);
        setSelectedPosVenda(undefined);
    };

    const handleMoveStage = async () => {
        if (!selectedPipeline || !selectedStage) return;

        try {
            await LeadService.bulkMoveStage(
                Array.from(selectedIds),
                selectedPipeline,
                selectedStage
            );

            // Update store state for real-time UI update
            const updatedContacts = contacts.map(contact => {
                if (selectedIds.has(contact.id)) {
                    return { ...contact, pipeline: selectedPipeline, status: selectedStage };
                }
                return contact;
            });
            setContacts(updatedContacts);

            const stageName = stagesForPipeline.find(s => s.id === selectedStage)?.name || 'Etapa';
            toast.success(`${selectedCount} contato(s) movido(s) para ${stageName}`);
        } catch (error) {
            console.error('Error moving stage:', error);
            toast.error('Erro ao mover contatos');
        }

        setShowMoveStageModal(false);
        setSelectedPipeline(undefined);
        setSelectedStage(undefined);
    };

    const handleMarkLost = async () => {
        if (!selectedLossReason) return;

        try {
            await LeadService.bulkMarkAsLost(
                Array.from(selectedIds),
                selectedLossReason
            );

            // Update store state for real-time UI update
            const now = new Date();
            const updatedContacts = contacts.map(contact => {
                if (selectedIds.has(contact.id)) {
                    return { ...contact, lostReason: selectedLossReason, lostAt: now };
                }
                return contact;
            });
            setContacts(updatedContacts);

            const reasonName = lossReasons.find(r => r.id === selectedLossReason)?.name || 'Perdido';
            toast.success(`${selectedCount} contato(s) marcado(s) como perdido: ${reasonName}`);
        } catch (error) {
            console.error('Error marking as lost:', error);
            toast.error('Erro ao marcar como perdido');
        }

        setShowLostModal(false);
        setSelectedLossReason('');
    };

    const handleDelete = async () => {
        try {
            await LeadService.bulkDelete(Array.from(selectedIds));

            // Remove from store state for real-time UI update
            const updatedContacts = contacts.filter(contact => !selectedIds.has(contact.id));
            setContacts(updatedContacts);

            toast.success(`${selectedCount} contato(s) excluído(s)`);
        } catch (error) {
            console.error('Error deleting contacts:', error);
            toast.error('Erro ao excluir contatos');
        }

        setShowDeleteConfirm(false);
        onClearSelection();
    };

    return (
        <div className={styles.container}>
            <div className={styles.selectionInfo}>
                <span className={styles.count}>{selectedCount} selecionado(s)</span>
                <button className={styles.clearButton} onClick={onClearSelection}>
                    <X size={14} />
                    Limpar seleção
                </button>
            </div>

            <div className={styles.actions}>
                {/* Adicionar Tag */}
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<TagIcon size={16} />}
                    onClick={() => setShowAddTagModal(true)}
                >
                    Adicionar Tag
                </Button>

                {/* Remover Tag */}
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Tags size={16} />}
                    onClick={() => setShowRemoveTagModal(true)}
                >
                    Remover Tag
                </Button>

                <div className={styles.separator} />

                {/* Atribuir Vendedora */}
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<UserPlus size={16} />}
                    onClick={() => setShowAssignVendedoraModal(true)}
                >
                    Atribuir Vendedora
                </Button>

                {/* Atribuir Pós-Venda */}
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<UserPlus size={16} />}
                    onClick={() => setShowAssignPosVendaModal(true)}
                >
                    Atribuir Pós-Venda
                </Button>

                <div className={styles.separator} />

                {/* Mover para Etapa */}
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ArrowRight size={16} />}
                    onClick={() => setShowMoveStageModal(true)}
                >
                    Mover para Etapa
                </Button>

                {/* Marcar como Perdido */}
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<XCircle size={16} />}
                    onClick={() => setShowLostModal(true)}
                >
                    Marcar como Perdido
                </Button>

                <div className={styles.separator} />

                {/* Exportar CSV */}
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Download size={16} />}
                    onClick={handleExportCSV}
                >
                    Exportar
                </Button>

                {/* Excluir */}
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={16} />}
                    onClick={() => setShowDeleteConfirm(true)}
                    className={styles.deleteButton}
                >
                    Excluir
                </Button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
             * MODAL: Adicionar Tag (com opção de criar nova)
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={showAddTagModal}
                onClose={resetAddTagModal}
                title="Adicionar Tag"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione uma tag existente ou crie uma nova para adicionar aos {selectedCount} contatos.
                    </p>

                    {!isCreatingNewTag ? (
                        <>
                            <Dropdown
                                placeholder="Selecione uma tag"
                                value={selectedTag}
                                onChange={(val) => setSelectedTag(val as string)}
                                options={availableTags.map(tag => ({ value: tag, label: tag }))}
                            />
                            <button
                                className={styles.createNewButton}
                                onClick={() => setIsCreatingNewTag(true)}
                            >
                                <Plus size={14} />
                                Criar nova tag
                            </button>
                        </>
                    ) : (
                        <>
                            <Input
                                key="new-tag-input"
                                placeholder="Nome da nova tag"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                fullWidth
                            />
                            <button
                                className={styles.createNewButton}
                                onClick={() => setIsCreatingNewTag(false)}
                            >
                                Voltar para tags existentes
                            </button>
                        </>
                    )}

                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={resetAddTagModal}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleAddTag}
                            disabled={isCreatingNewTag ? !newTagName.trim() : !selectedTag}
                        >
                            Adicionar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════════════════
             * MODAL: Remover Tag
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={showRemoveTagModal}
                onClose={() => { setShowRemoveTagModal(false); setSelectedTagsToRemove(new Set()); }}
                title="Remover Tags"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione as tags para remover dos {selectedCount} contatos.
                    </p>
                    {tagsInSelection.length > 0 ? (
                        <div className={styles.tagCheckboxList}>
                            {tagsInSelection.map(tag => (
                                <Checkbox
                                    key={tag}
                                    id={`tag-remove-${tag}`}
                                    label={tag}
                                    checked={selectedTagsToRemove.has(tag)}
                                    onChange={() => toggleTagToRemove(tag)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.noItems}>Nenhuma tag encontrada nos contatos selecionados.</p>
                    )}
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => setShowRemoveTagModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleRemoveTag} disabled={selectedTagsToRemove.size === 0}>
                            Remover {selectedTagsToRemove.size > 0 && `(${selectedTagsToRemove.size})`}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════════════════
             * MODAL: Atribuir Vendedora
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={showAssignVendedoraModal}
                onClose={() => { setShowAssignVendedoraModal(false); setSelectedVendedora(undefined); }}
                title="Atribuir Vendedora"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione a vendedora para associar aos {selectedCount} contatos.
                    </p>
                    <Dropdown
                        placeholder="Selecione uma vendedora"
                        value={selectedVendedora}
                        onChange={(val) => setSelectedVendedora(val as string)}
                        options={vendedoras.map(m => ({ value: m.id, label: m.name }))}
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => setShowAssignVendedoraModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleAssignVendedora} disabled={!selectedVendedora}>
                            Atribuir
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════════════════
             * MODAL: Atribuir Pós-Venda
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={showAssignPosVendaModal}
                onClose={() => { setShowAssignPosVendaModal(false); setSelectedPosVenda(undefined); }}
                title="Atribuir Pós-Venda"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione o responsável de pós-venda para associar aos {selectedCount} contatos.
                    </p>
                    <Dropdown
                        placeholder="Selecione um responsável"
                        value={selectedPosVenda}
                        onChange={(val) => setSelectedPosVenda(val as string)}
                        options={posVendaMembers.map(m => ({ value: m.id, label: m.name }))}
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => setShowAssignPosVendaModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleAssignPosVenda} disabled={!selectedPosVenda}>
                            Atribuir
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════════════════
             * MODAL: Mover para Etapa (com seleção de pipeline)
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={showMoveStageModal}
                onClose={() => { setShowMoveStageModal(false); setSelectedPipeline(undefined); setSelectedStage(undefined); }}
                title="Mover para Etapa"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione o pipeline e a etapa para mover os {selectedCount} contatos.
                    </p>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Pipeline</label>
                        <Dropdown
                            placeholder="Selecione o pipeline"
                            value={selectedPipeline}
                            onChange={handlePipelineChange}
                            options={PIPELINE_OPTIONS}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Etapa</label>
                        <Dropdown
                            placeholder={selectedPipeline ? "Selecione a etapa" : "Selecione o pipeline primeiro"}
                            value={selectedStage}
                            onChange={(val) => setSelectedStage(val as string)}
                            options={stagesForPipeline.map(s => ({ value: s.id, label: s.name }))}
                            disabled={!selectedPipeline}
                        />
                    </div>

                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => setShowMoveStageModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleMoveStage} disabled={!selectedPipeline || !selectedStage}>
                            Mover
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════════════════
             * MODAL: Marcar como Perdido
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={showLostModal}
                onClose={() => { setShowLostModal(false); setSelectedLossReason(''); }}
                title="Motivo da Perda"
                size="auto"
                footer={
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowLostModal(false);
                                setSelectedLossReason('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!selectedLossReason}
                            onClick={handleMarkLost}
                        >
                            Confirmar
                        </Button>
                    </div>
                }
            >
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Selecione o motivo pelo qual {selectedCount > 1 ? 'estes leads foram perdidos' : 'este lead foi perdido'}:
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                }}>
                    {LOSS_REASONS.map((reason) => (
                        <Button
                            key={reason.value}
                            variant={selectedLossReason === reason.value ? 'primary' : 'ghost'}
                            onClick={() => setSelectedLossReason(reason.value)}
                            fullWidth
                            style={{
                                height: '60px',
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                opacity: selectedLossReason && selectedLossReason !== reason.value ? 0.5 : 1,
                                border: selectedLossReason === reason.value
                                    ? 'none'
                                    : '1px solid var(--color-border)',
                                boxShadow: selectedLossReason === reason.value
                                    ? '0 4px 12px rgba(220, 38, 38, 0.4)'
                                    : 'none',
                            }}
                        >
                            {reason.label}
                        </Button>
                    ))}
                </div>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════════════════
             * MODAL: Confirmar Exclusão
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Excluir Contatos"
                description={`Tem certeza que deseja excluir ${selectedCount} contato(s)? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                variant="danger"
            />
        </div>
    );
};
