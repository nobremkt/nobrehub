/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - CREATE PROJECT MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Button, Switch, Checkbox } from '@/design-system';
import { useStrategicProjectsStore } from '../../stores/useStrategicProjectsStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useAuthStore } from '@/stores';
import { STRATEGIC_SECTOR_ID } from '@/config/constants';
import styles from './CreateProjectModal.module.css';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
    const { createProject } = useStrategicProjectsStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const user = useAuthStore((state) => state.user);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch collaborators when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCollaborators();
        }
    }, [isOpen, fetchCollaborators]);

    // Filter collaborators by strategic sector (excluding current user)
    const strategicMembers = useMemo(() => {
        return collaborators.filter(c =>
            c.sectorId === STRATEGIC_SECTOR_ID &&
            c.active &&
            c.id !== user?.id
        );
    }, [collaborators, user?.id]);

    const handleMemberToggle = (memberId: string) => {
        setSelectedMemberIds(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await createProject({
                title: title.trim(),
                description: description.trim() || undefined,
                isShared,
                memberIds: isShared ? selectedMemberIds : [],
            });
            handleClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setIsShared(false);
        setSelectedMemberIds([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Novo Projeto">
            <div className={styles.form}>
                {/* Title */}
                <div className={styles.field}>
                    <label className={styles.label}>Título *</label>
                    <Input
                        placeholder="Nome do projeto..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Description */}
                <div className={styles.field}>
                    <label className={styles.label}>Descrição</label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Descrição opcional..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Shared Toggle */}
                <div className={styles.switchField}>
                    <div className={styles.switchInfo}>
                        <span className={styles.switchLabel}>Projeto Compartilhado</span>
                        <span className={styles.switchHint}>
                            Projetos compartilhados podem ser vistos por outros membros do setor estratégico
                        </span>
                    </div>
                    <Switch
                        checked={isShared}
                        onChange={setIsShared}
                    />
                </div>

                {/* Members Selection (only when shared) */}
                {isShared && (
                    <div className={styles.field}>
                        <label className={styles.label}>Membros</label>
                        <div className={styles.membersList}>
                            {strategicMembers.length === 0 ? (
                                <p className={styles.noMembers}>
                                    Nenhum outro membro do setor estratégico encontrado
                                </p>
                            ) : (
                                strategicMembers.map((member) => (
                                    <div key={member.id} className={styles.memberItem}>
                                        <Checkbox
                                            checked={selectedMemberIds.includes(member.id)}
                                            onChange={() => handleMemberToggle(member.id)}
                                            label={member.name}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className={styles.actions}>
                    <Button variant="ghost" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!title.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Criando...' : 'Criar Projeto'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
