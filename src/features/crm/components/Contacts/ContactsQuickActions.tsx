/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS QUICK ACTIONS
 * Barra de ações em massa que aparece quando contatos estão selecionados.
 * State & handlers delegated to useContactsQuickActions hook.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React from 'react';
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
import { useContactsQuickActions, PIPELINE_OPTIONS } from './useContactsQuickActions';
import styles from './ContactsQuickActions.module.css';

interface ContactsQuickActionsProps {
    selectedCount: number;
    onClearSelection: () => void;
}

export const ContactsQuickActions: React.FC<ContactsQuickActionsProps> = ({
    selectedCount,
    onClearSelection,
}) => {
    const cx = useContactsQuickActions();

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
                <Button variant="ghost" size="sm" leftIcon={<TagIcon size={16} />}
                    onClick={() => cx.setShowAddTagModal(true)}>
                    Adicionar Tag
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Tags size={16} />}
                    onClick={() => cx.setShowRemoveTagModal(true)}>
                    Remover Tag
                </Button>

                <div className={styles.separator} />

                <Button variant="ghost" size="sm" leftIcon={<UserPlus size={16} />}
                    onClick={() => cx.setShowAssignVendedoraModal(true)}>
                    Atribuir Vendedora
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<UserPlus size={16} />}
                    onClick={() => cx.setShowAssignPosVendaModal(true)}>
                    Atribuir Pós-Venda
                </Button>

                <div className={styles.separator} />

                <Button variant="ghost" size="sm" leftIcon={<ArrowRight size={16} />}
                    onClick={() => cx.setShowMoveStageModal(true)}>
                    Mover para Etapa
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<XCircle size={16} />}
                    onClick={() => cx.setShowLostModal(true)}>
                    Marcar como Perdido
                </Button>

                <div className={styles.separator} />

                <Button variant="ghost" size="sm" leftIcon={<Download size={16} />}
                    onClick={cx.handleExportCSV}>
                    Exportar
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Trash2 size={16} />}
                    onClick={() => cx.setShowDeleteConfirm(true)}
                    className={styles.deleteButton}>
                    Excluir
                </Button>
            </div>

            {/* ═══ MODAL: Adicionar Tag ═══ */}
            <Modal isOpen={cx.showAddTagModal} onClose={cx.resetAddTagModal}
                title="Adicionar Tag" size="sm">
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione uma tag existente ou crie uma nova para adicionar aos {selectedCount} contatos.
                    </p>
                    {!cx.isCreatingNewTag ? (
                        <>
                            <Dropdown placeholder="Selecione uma tag"
                                value={cx.selectedTag}
                                onChange={(val) => cx.setSelectedTag(val as string)}
                                options={cx.availableTags.map(tag => ({ value: tag, label: tag }))}
                            />
                            <button className={styles.createNewButton}
                                onClick={() => cx.setIsCreatingNewTag(true)}>
                                <Plus size={14} /> Criar nova tag
                            </button>
                        </>
                    ) : (
                        <>
                            <Input key="new-tag-input" placeholder="Nome da nova tag"
                                value={cx.newTagName}
                                onChange={(e) => cx.setNewTagName(e.target.value)} fullWidth />
                            <button className={styles.createNewButton}
                                onClick={() => cx.setIsCreatingNewTag(false)}>
                                Voltar para tags existentes
                            </button>
                        </>
                    )}
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={cx.resetAddTagModal}>Cancelar</Button>
                        <Button variant="primary" onClick={cx.handleAddTag}
                            disabled={cx.isCreatingNewTag ? !cx.newTagName.trim() : !cx.selectedTag}>
                            Adicionar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══ MODAL: Remover Tag ═══ */}
            <Modal isOpen={cx.showRemoveTagModal}
                onClose={() => { cx.setShowRemoveTagModal(false); cx.setSelectedTagsToRemove(new Set()); }}
                title="Remover Tags" size="sm">
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione as tags para remover dos {selectedCount} contatos.
                    </p>
                    {cx.tagsInSelection.length > 0 ? (
                        <div className={styles.tagCheckboxList}>
                            {cx.tagsInSelection.map(tag => (
                                <Checkbox key={tag} id={`tag-remove-${tag}`} label={tag}
                                    checked={cx.selectedTagsToRemove.has(tag)}
                                    onChange={() => cx.toggleTagToRemove(tag)} />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.noItems}>Nenhuma tag encontrada nos contatos selecionados.</p>
                    )}
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => cx.setShowRemoveTagModal(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={cx.handleRemoveTag}
                            disabled={cx.selectedTagsToRemove.size === 0}>
                            Remover {cx.selectedTagsToRemove.size > 0 && `(${cx.selectedTagsToRemove.size})`}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══ MODAL: Atribuir Vendedora ═══ */}
            <Modal isOpen={cx.showAssignVendedoraModal}
                onClose={() => { cx.setShowAssignVendedoraModal(false); cx.setSelectedVendedora(undefined); }}
                title="Atribuir Vendedora" size="sm">
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione a vendedora para associar aos {selectedCount} contatos.
                    </p>
                    <Dropdown placeholder="Selecione uma vendedora"
                        value={cx.selectedVendedora}
                        onChange={(val) => cx.setSelectedVendedora(val as string)}
                        options={cx.vendedoras.map(m => ({ value: m.id, label: m.name }))} />
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => cx.setShowAssignVendedoraModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={cx.handleAssignVendedora}
                            disabled={!cx.selectedVendedora}>Atribuir</Button>
                    </div>
                </div>
            </Modal>

            {/* ═══ MODAL: Atribuir Pós-Venda ═══ */}
            <Modal isOpen={cx.showAssignPosVendaModal}
                onClose={() => { cx.setShowAssignPosVendaModal(false); cx.setSelectedPosVenda(undefined); }}
                title="Atribuir Pós-Venda" size="sm">
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione o responsável de pós-venda para associar aos {selectedCount} contatos.
                    </p>
                    <Dropdown placeholder="Selecione um responsável"
                        value={cx.selectedPosVenda}
                        onChange={(val) => cx.setSelectedPosVenda(val as string)}
                        options={cx.posVendaMembers.map(m => ({ value: m.id, label: m.name }))} />
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => cx.setShowAssignPosVendaModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={cx.handleAssignPosVenda}
                            disabled={!cx.selectedPosVenda}>Atribuir</Button>
                    </div>
                </div>
            </Modal>

            {/* ═══ MODAL: Mover para Etapa ═══ */}
            <Modal isOpen={cx.showMoveStageModal}
                onClose={() => { cx.setShowMoveStageModal(false); }}
                title="Mover para Etapa" size="sm">
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione o pipeline e a etapa para mover os {selectedCount} contatos.
                    </p>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Pipeline</label>
                        <Dropdown placeholder="Selecione o pipeline"
                            value={cx.selectedPipeline}
                            onChange={cx.handlePipelineChange}
                            options={PIPELINE_OPTIONS} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Etapa</label>
                        <Dropdown
                            placeholder={cx.selectedPipeline ? "Selecione a etapa" : "Selecione o pipeline primeiro"}
                            value={cx.selectedStage}
                            onChange={(val) => cx.setSelectedStage(val as string)}
                            options={cx.stagesForPipeline.map(s => ({ value: s.id, label: s.name }))}
                            disabled={!cx.selectedPipeline} />
                    </div>
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => cx.setShowMoveStageModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={cx.handleMoveStage}
                            disabled={!cx.selectedPipeline || !cx.selectedStage}>Mover</Button>
                    </div>
                </div>
            </Modal>

            {/* ═══ MODAL: Marcar como Perdido ═══ */}
            <Modal isOpen={cx.showLostModal}
                onClose={() => { cx.setShowLostModal(false); cx.setSelectedLossReason(''); }}
                title="Motivo da Perda" size="auto"
                footer={
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button variant="ghost"
                            onClick={() => { cx.setShowLostModal(false); cx.setSelectedLossReason(''); }}>
                            Cancelar
                        </Button>
                        <Button variant="primary" disabled={!cx.selectedLossReason}
                            onClick={cx.handleMarkLost}>
                            Confirmar
                        </Button>
                    </div>
                }>
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Selecione o motivo pelo qual {selectedCount > 1 ? 'estes leads foram perdidos' : 'este lead foi perdido'}:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {cx.LOSS_REASONS.map((reason) => (
                        <Button key={reason.value}
                            variant={cx.selectedLossReason === reason.value ? 'primary' : 'ghost'}
                            onClick={() => cx.setSelectedLossReason(reason.value)}
                            fullWidth
                            style={{
                                height: '60px', justifyContent: 'flex-start', textAlign: 'left',
                                opacity: cx.selectedLossReason && cx.selectedLossReason !== reason.value ? 0.5 : 1,
                                border: cx.selectedLossReason === reason.value ? 'none' : '1px solid var(--color-border)',
                                boxShadow: cx.selectedLossReason === reason.value ? '0 4px 12px rgba(220, 38, 38, 0.4)' : 'none',
                            }}>
                            {reason.label}
                        </Button>
                    ))}
                </div>
            </Modal>

            {/* ═══ MODAL: Confirmar Exclusão ═══ */}
            <ConfirmModal
                isOpen={cx.showDeleteConfirm}
                onClose={() => cx.setShowDeleteConfirm(false)}
                onConfirm={cx.handleDelete}
                title="Excluir Contatos"
                description={`Tem certeza que deseja excluir ${selectedCount} contato(s)? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                variant="danger"
            />
        </div>
    );
};
