/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS QUICK ACTIONS
 * Barra de ações em massa que aparece quando contatos estão selecionados
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useContactsStore } from '../../stores/useContactsStore';
import { Button, Modal, ConfirmModal } from '@/design-system';
import {
    Tag,
    Tags,
    UserPlus,
    ArrowRight,
    XCircle,
    Download,
    Trash2,
    X
} from 'lucide-react';
import styles from './ContactsQuickActions.module.css';

interface ContactsQuickActionsProps {
    selectedCount: number;
    onClearSelection: () => void;
}

export const ContactsQuickActions: React.FC<ContactsQuickActionsProps> = ({
    selectedCount,
    onClearSelection,
}) => {
    const { selectedIds, contacts } = useContactsStore();

    const [showAddTagModal, setShowAddTagModal] = useState(false);
    const [showRemoveTagModal, setShowRemoveTagModal] = useState(false);
    const [showAssignVendedoraModal, setShowAssignVendedoraModal] = useState(false);
    const [showAssignPosVendaModal, setShowAssignPosVendaModal] = useState(false);
    const [showMoveStageModal, setShowMoveStageModal] = useState(false);
    const [showLostModal, setShowLostModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleExportCSV = () => {
        const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

        // Build CSV content
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

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contatos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = () => {
        // TODO: Implement bulk delete
        console.log('Deleting contacts:', Array.from(selectedIds));
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
                    leftIcon={<Tag size={16} />}
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

            {/* Modals - TODO: Implement full functionality */}
            <Modal
                isOpen={showAddTagModal}
                onClose={() => setShowAddTagModal(false)}
                title="Adicionar Tag"
                size="sm"
            >
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Selecione a tag para adicionar aos {selectedCount} contatos.
                </p>
                {/* TODO: Tag selector */}
            </Modal>

            <Modal
                isOpen={showRemoveTagModal}
                onClose={() => setShowRemoveTagModal(false)}
                title="Remover Tag"
                size="sm"
            >
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Selecione a tag para remover dos {selectedCount} contatos.
                </p>
                {/* TODO: Tag selector */}
            </Modal>

            <Modal
                isOpen={showAssignVendedoraModal}
                onClose={() => setShowAssignVendedoraModal(false)}
                title="Atribuir Vendedora"
                size="sm"
            >
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Selecione a vendedora para associar aos {selectedCount} contatos.
                </p>
                {/* TODO: User selector */}
            </Modal>

            <Modal
                isOpen={showAssignPosVendaModal}
                onClose={() => setShowAssignPosVendaModal(false)}
                title="Atribuir Pós-Venda"
                size="sm"
            >
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Selecione o responsável de pós-venda para associar aos {selectedCount} contatos.
                </p>
                {/* TODO: User selector */}
            </Modal>

            <Modal
                isOpen={showMoveStageModal}
                onClose={() => setShowMoveStageModal(false)}
                title="Mover para Etapa"
                size="sm"
            >
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Selecione a etapa para mover os {selectedCount} contatos.
                </p>
                {/* TODO: Stage selector */}
            </Modal>

            <Modal
                isOpen={showLostModal}
                onClose={() => setShowLostModal(false)}
                title="Marcar como Perdido"
                size="sm"
            >
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Selecione o motivo de perda para os {selectedCount} contatos.
                </p>
                {/* TODO: Loss reason selector */}
            </Modal>

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
