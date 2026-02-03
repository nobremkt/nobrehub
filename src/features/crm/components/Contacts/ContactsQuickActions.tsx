/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS QUICK ACTIONS
 * Barra de ações em massa que aparece quando contatos estão selecionados
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Button, Modal, ConfirmModal, Dropdown } from '@/design-system';
import {
    Tag as TagIcon,
    Tags,
    UserPlus,
    ArrowRight,
    XCircle,
    Download,
    Trash2,
    X
} from 'lucide-react';
import styles from './ContactsQuickActions.module.css';

// Pipeline stages from existing data
const PIPELINE_STAGES = [
    { id: 'base', label: 'Base' },
    { id: 'prospeccao', label: 'Prospecção' },
    { id: 'conexao', label: 'Conexão' },
    { id: 'noshow', label: 'No-show' },
    { id: 'reuniao', label: 'Reunião' },
    { id: 'proposta', label: 'Proposta' },
    { id: 'negociacao', label: 'Negociação' },
    { id: 'finalizada', label: 'Finalizada' },
];

// Mock team members (TODO: fetch from API)
const TEAM_MEMBERS = [
    { id: '1', name: 'Ana Silva', sector: 'Vendas' },
    { id: '2', name: 'Maria Santos', sector: 'Vendas' },
    { id: '3', name: 'Carlos Oliveira', sector: 'Pós-Venda' },
    { id: '4', name: 'Julia Costa', sector: 'Pós-Venda' },
];

interface ContactsQuickActionsProps {
    selectedCount: number;
    onClearSelection: () => void;
}

export const ContactsQuickActions: React.FC<ContactsQuickActionsProps> = ({
    selectedCount,
    onClearSelection,
}) => {
    const { selectedIds, contacts, availableTags, availableLossReasons } = useContactsStore();

    const [showAddTagModal, setShowAddTagModal] = useState(false);
    const [showRemoveTagModal, setShowRemoveTagModal] = useState(false);
    const [showAssignVendedoraModal, setShowAssignVendedoraModal] = useState(false);
    const [showAssignPosVendaModal, setShowAssignPosVendaModal] = useState(false);
    const [showMoveStageModal, setShowMoveStageModal] = useState(false);
    const [showLostModal, setShowLostModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Selected values for each modal
    const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
    const [selectedVendedora, setSelectedVendedora] = useState<string | undefined>(undefined);
    const [selectedPosVenda, setSelectedPosVenda] = useState<string | undefined>(undefined);
    const [selectedStage, setSelectedStage] = useState<string | undefined>(undefined);
    const [selectedLossReason, setSelectedLossReason] = useState<string | undefined>(undefined);

    // Get selected contacts
    const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

    // Get tags from selected contacts for removal
    const tagsInSelection = Array.from(
        new Set(selectedContacts.flatMap(c => c.tags || []))
    );

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

    const handleAddTag = () => {
        if (!selectedTag) return;
        // TODO: Implement bulk add tag
        console.log('Adding tag:', selectedTag, 'to contacts:', Array.from(selectedIds));
        setShowAddTagModal(false);
        setSelectedTag(undefined);
    };

    const handleRemoveTag = () => {
        if (!selectedTag) return;
        // TODO: Implement bulk remove tag
        console.log('Removing tag:', selectedTag, 'from contacts:', Array.from(selectedIds));
        setShowRemoveTagModal(false);
        setSelectedTag(undefined);
    };

    const handleAssignVendedora = () => {
        if (!selectedVendedora) return;
        // TODO: Implement bulk assign vendedora
        console.log('Assigning vendedora:', selectedVendedora, 'to contacts:', Array.from(selectedIds));
        setShowAssignVendedoraModal(false);
        setSelectedVendedora(undefined);
    };

    const handleAssignPosVenda = () => {
        if (!selectedPosVenda) return;
        // TODO: Implement bulk assign pós-venda
        console.log('Assigning pós-venda:', selectedPosVenda, 'to contacts:', Array.from(selectedIds));
        setShowAssignPosVendaModal(false);
        setSelectedPosVenda(undefined);
    };

    const handleMoveStage = () => {
        if (!selectedStage) return;
        // TODO: Implement bulk move stage
        console.log('Moving to stage:', selectedStage, 'contacts:', Array.from(selectedIds));
        setShowMoveStageModal(false);
        setSelectedStage(undefined);
    };

    const handleMarkLost = () => {
        if (!selectedLossReason) return;
        // TODO: Implement bulk mark as lost
        console.log('Marking as lost with reason:', selectedLossReason, 'contacts:', Array.from(selectedIds));
        setShowLostModal(false);
        setSelectedLossReason(undefined);
    };

    const handleDelete = () => {
        // TODO: Implement bulk delete
        console.log('Deleting contacts:', Array.from(selectedIds));
        setShowDeleteConfirm(false);
        onClearSelection();
    };

    const vendedoras = TEAM_MEMBERS.filter(m => m.sector === 'Vendas');
    const posVendaMembers = TEAM_MEMBERS.filter(m => m.sector === 'Pós-Venda');

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
             * MODAL: Adicionar Tag
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={showAddTagModal}
                onClose={() => { setShowAddTagModal(false); setSelectedTag(undefined); }}
                title="Adicionar Tag"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione a tag para adicionar aos {selectedCount} contatos.
                    </p>
                    <Dropdown
                        placeholder="Selecione uma tag"
                        value={selectedTag}
                        onChange={(val) => setSelectedTag(val as string)}
                        options={availableTags.map(tag => ({ value: tag, label: tag }))}
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => setShowAddTagModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleAddTag} disabled={!selectedTag}>
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
                onClose={() => { setShowRemoveTagModal(false); setSelectedTag(undefined); }}
                title="Remover Tag"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione a tag para remover dos {selectedCount} contatos.
                    </p>
                    {tagsInSelection.length > 0 ? (
                        <Dropdown
                            placeholder="Selecione uma tag"
                            value={selectedTag}
                            onChange={(val) => setSelectedTag(val as string)}
                            options={tagsInSelection.map(tag => ({ value: tag, label: tag }))}
                        />
                    ) : (
                        <p className={styles.noItems}>Nenhuma tag encontrada nos contatos selecionados.</p>
                    )}
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => setShowRemoveTagModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleRemoveTag} disabled={!selectedTag}>
                            Remover
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
             * MODAL: Mover para Etapa
             * ═══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={showMoveStageModal}
                onClose={() => { setShowMoveStageModal(false); setSelectedStage(undefined); }}
                title="Mover para Etapa"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione a etapa para mover os {selectedCount} contatos.
                    </p>
                    <Dropdown
                        placeholder="Selecione uma etapa"
                        value={selectedStage}
                        onChange={(val) => setSelectedStage(val as string)}
                        options={PIPELINE_STAGES.map(s => ({ value: s.id, label: s.label }))}
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => setShowMoveStageModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleMoveStage} disabled={!selectedStage}>
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
                onClose={() => { setShowLostModal(false); setSelectedLossReason(undefined); }}
                title="Marcar como Perdido"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Selecione o motivo de perda para os {selectedCount} contatos.
                    </p>
                    <Dropdown
                        placeholder="Selecione o motivo"
                        value={selectedLossReason}
                        onChange={(val) => setSelectedLossReason(val as string)}
                        options={availableLossReasons.filter(r => r.isActive).map(r => ({ value: r.id, label: r.name }))}
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="ghost" onClick={() => setShowLostModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleMarkLost} disabled={!selectedLossReason}>
                            Marcar como Perdido
                        </Button>
                    </div>
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
