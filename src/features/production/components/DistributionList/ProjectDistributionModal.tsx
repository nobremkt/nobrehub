/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PROJECT DISTRIBUTION MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * Modal de dois painéis: detalhes do projeto + atribuição a produtor
 */

import { useState, useMemo } from 'react';
import { Project } from '@/types/project.types';
import { Modal, Button, Dropdown } from '@/design-system';
import {
    Star, UserCheck,
    Clock, FileText, User, Tag, Award,
    MessageSquare, History, Calendar, Link2
} from 'lucide-react';
import styles from './ProjectDistributionModal.module.css';

interface Props {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
    producers: { id: string; name: string }[];
    collaborators: { id: string; name: string }[];
    onAssign: (projectId: string, producerId: string) => Promise<void>;
    isAssigning: boolean;
}

export const ProjectDistributionModal = ({
    project,
    isOpen,
    onClose,
    producers,
    collaborators,
    onAssign,
    isAssigning,
}: Props) => {
    const [selectedProducerId, setSelectedProducerId] = useState('');

    const producerOptions = useMemo(() =>
        producers.map(p => ({ value: p.id, label: p.name })),
        [producers]
    );

    const handleAssign = async () => {
        if (!project || !selectedProducerId) return;
        await onAssign(project.id, selectedProducerId);
        setSelectedProducerId('');
        onClose();
    };

    const getSuggestedName = () => {
        if (!project?.suggestedProducerId) return null;
        return producers.find(p => p.id === project.suggestedProducerId)?.name
            || project.suggestedProducerName
            || 'Produtor sugerido';
    };

    const getPreviousProducerName = () => {
        const prevIds = project?.metadata?.previousProducerIds;
        if (!prevIds?.length) return null;
        return collaborators.find(c => c.id === prevIds[0])?.name || 'Outro produtor';
    };

    const formatDate = (date?: Date) => {
        if (!date) return '—';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('pt-BR');
    };

    if (!project) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={project.name} size="lg">
            <div className={styles.panels}>
                {/* ── Left Panel: Project Details ──────────────────────── */}
                <div className={styles.detailsPanel}>
                    {/* Suggestion banner */}
                    {project.suggestedProducerId && (
                        <div className={styles.suggestionBanner}>
                            <Star size={16} />
                            Sugerido: {getSuggestedName()}
                        </div>
                    )}

                    {/* Basic Info */}
                    <h5 className={styles.sectionTitle}>Informações do Projeto</h5>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><User size={12} /> Cliente</span>
                            <span className={styles.infoValue}>{project.leadName}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><Calendar size={12} /> Prazo</span>
                            <span className={styles.infoValue}>{formatDate(project.dueDate)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><FileText size={12} /> Produto</span>
                            <span className={styles.infoValue}>{project.productType || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><Clock size={12} /> Duração</span>
                            <span className={styles.infoValue}>{project.durationCategory || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><Award size={12} /> Pontuação</span>
                            <span className={styles.infoValue}>
                                <span className={`${styles.pointsBadge} ${(project.extraPoints || 0) > 0 ? styles.hasExtra : ''}`}>
                                    {project.totalPoints || project.basePoints || 1} pts
                                    {(project.extraPoints || 0) > 0 && ` (+${project.extraPoints})`}
                                </span>
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><Calendar size={12} /> Criado em</span>
                            <span className={styles.infoValue}>{formatDate(project.createdAt)}</span>
                        </div>
                    </div>

                    {/* Drive Link */}
                    {project.driveLink && (
                        <>
                            <h5 className={styles.sectionTitle}>Link do Drive</h5>
                            <div className={styles.infoGrid}>
                                <div className={`${styles.infoItem} ${styles.full}`}>
                                    <span className={styles.infoLabel}><Link2 size={12} /> URL</span>
                                    <a
                                        href={project.driveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.infoValue}
                                        style={{ color: 'var(--color-primary-500)', textDecoration: 'underline' }}
                                    >
                                        Abrir pasta no Drive
                                    </a>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Previous Producer */}
                    {getPreviousProducerName() && (
                        <>
                            <h5 className={styles.sectionTitle}>Histórico</h5>
                            <div className={styles.infoGrid}>
                                <div className={`${styles.infoItem} ${styles.full}`}>
                                    <span className={styles.infoLabel}><History size={12} /> Já produziu</span>
                                    <span className={styles.infoValue}>{getPreviousProducerName()}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                        <>
                            <h5 className={styles.sectionTitle}>Tags</h5>
                            <div className={styles.tagList}>
                                {project.tags.map(tag => (
                                    <span key={tag} className={styles.tag}>
                                        <Tag size={10} style={{ display: 'inline', marginRight: 2 }} />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    {(project.notes || project.suggestionNotes) && (
                        <>
                            <h5 className={styles.sectionTitle}>Observações</h5>
                            {project.suggestionNotes && (
                                <div className={styles.notesBox}>
                                    <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                                    {project.suggestionNotes}
                                </div>
                            )}
                            {project.notes && (
                                <div className={styles.notesBox} style={{ marginTop: 'var(--spacing-2)' }}>
                                    {project.notes}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Right Panel: Assignment ─────────────────────────── */}
                <div className={styles.assignPanel}>
                    <h4 className={styles.assignTitle}>
                        <UserCheck size={18} />
                        Atribuir Produtor
                    </h4>

                    <p className={styles.assignDescription}>
                        Selecione um produtor para receber este projeto.
                    </p>

                    <div className={styles.dropdownWrapper}>
                        <Dropdown
                            options={producerOptions}
                            value={selectedProducerId}
                            onChange={(value) => setSelectedProducerId(String(value))}
                            placeholder="Selecionar produtor..."
                        />
                    </div>

                    <div className={styles.assignActions}>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAssign}
                            disabled={!selectedProducerId || isAssigning}
                            leftIcon={<UserCheck size={14} />}
                            fullWidth
                        >
                            {isAssigning ? 'Atribuindo...' : 'Atribuir Manualmente'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProjectDistributionModal;
