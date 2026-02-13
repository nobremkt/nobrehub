/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DISTRIBUTION LIST COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Lista de distribuição de projetos - Visível apenas para líderes de produção
 * Permite distribuição automática ou manual de projetos para produtores
 */

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProductionDistributionService } from '../../services/ProductionDistributionService';
import { Project } from '@/types/project.types';
import { Button, Spinner } from '@/design-system';
import {
    Inbox,
    Star,
    Clock,
    MessageSquare,
    Zap,
    History,
    Calendar,
    AlertTriangle
} from 'lucide-react';
import { ProjectDistributionModal } from './ProjectDistributionModal';
import styles from './DistributionList.module.css';

interface DistributionProject extends Project {
    isHighlighted?: boolean;
}

export const DistributionList = () => {
    const { user } = useAuthStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const { sectors, fetchSectors } = useSectorStore();

    const [projects, setProjects] = useState<DistributionProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState<string | null>(null);

    // Modal state
    const [selectedProject, setSelectedProject] = useState<DistributionProject | null>(null);

    // Encontra o setor de produção
    const productionSectorId = useMemo(() => {
        const sector = sectors.find(s =>
            s.name.toLowerCase() === 'produção' || s.name.toLowerCase() === 'production'
        );
        return sector?.id;
    }, [sectors]);

    // Lista de produtores disponíveis
    const producers = useMemo(() => {
        if (!productionSectorId) return [];
        return collaborators.filter(c => c.sectorId === productionSectorId && c.active);
    }, [collaborators, productionSectorId]);

    // Carrega dados iniciais
    useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (sectors.length === 0) fetchSectors();
    }, [fetchCollaborators, fetchSectors, collaborators.length, sectors.length]);

    // Inscreve na lista de distribuição em tempo real
    useEffect(() => {
        const unsubscribe = ProductionDistributionService.subscribeToDistributionQueue((queue) => {
            setProjects(queue);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Handler para atribuir manualmente (via modal)
    const handleAssign = async (projectId: string, producerId: string) => {
        if (!user?.id) return;
        const producer = producers.find(p => p.id === producerId);
        if (!producer) return;

        setIsAssigning(projectId);
        try {
            await ProductionDistributionService.assignToProducer(
                projectId,
                producerId,
                producer.name,
                user.id
            );
        } catch (error) {
            console.error('Error assigning project:', error);
        } finally {
            setIsAssigning(null);
        }
    };

    // Handler para distribuir automaticamente todos
    const handleAutoAssignAll = async () => {
        if (!user?.id || producers.length === 0) return;

        setIsAssigning('all');
        try {
            const producerIds = producers.map(p => p.id);
            const count = await ProductionDistributionService.autoAssignAllPending(
                producerIds,
                user.id
            );
            toast.success(`${count} projetos distribuídos automaticamente`);
        } catch (error) {
            console.error('Error auto-assigning all projects:', error);
        } finally {
            setIsAssigning(null);
        }
    };

    // Verifica se projeto está atrasado
    const isOverdue = (project: DistributionProject) => {
        if (!project.dueDate) return false;
        const due = project.dueDate instanceof Date ? project.dueDate : new Date(project.dueDate);
        return due < new Date();
    };

    // Formata prazo
    const formatDueDate = (date?: Date) => {
        if (!date) return null;
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('pt-BR');
    };

    // Encontra nome do produtor sugerido
    const getSuggestedProducerName = (project: DistributionProject) => {
        if (!project.suggestedProducerId) return null;
        const producer = producers.find(p => p.id === project.suggestedProducerId);
        return producer?.name || project.suggestedProducerName || 'Produtor sugerido';
    };

    if (isLoading) {
        return (
            <div className={styles.distributionList}>
                <div className={styles.emptyState}>
                    <Spinner size="md" />
                    <p>Carregando lista de distribuição...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.distributionList}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.title}>
                    <Inbox size={20} />
                    Lista de Distribuição
                    {projects.length > 0 && (
                        <span className={styles.badge}>{projects.length}</span>
                    )}
                </div>

                {projects.length > 0 && (
                    <div className={styles.actions}>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAutoAssignAll}
                            disabled={isAssigning === 'all'}
                            leftIcon={<Zap size={14} />}
                        >
                            {isAssigning === 'all' ? 'Distribuindo...' : 'Distribuir Todos'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={styles.content}>
                {projects.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Inbox size={48} />
                        <p>Não há projetos aguardando distribuição</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div
                            key={project.id}
                            className={`${styles.projectCard} ${project.isHighlighted ? styles.highlighted : ''} ${isOverdue(project) ? styles.overdue : ''}`}
                            onClick={() => setSelectedProject(project)}
                        >
                            {/* Suggestion Badge */}
                            {project.suggestedProducerId && (
                                <div className={styles.suggestionBadge}>
                                    <Star size={12} />
                                    Sugerido: {getSuggestedProducerName(project)}
                                </div>
                            )}

                            {/* Card Header */}
                            <div className={styles.cardHeader}>
                                <div>
                                    <h4 className={styles.projectName}>{project.name}</h4>
                                    <p className={styles.clientName}>{project.leadName}</p>
                                </div>
                                <div className={`${styles.pointsBadge} ${(project.extraPoints || 0) > 0 ? styles.hasExtra : ''}`}>
                                    {project.totalPoints || project.basePoints || 1} pts
                                </div>
                            </div>

                            {/* Due Date */}
                            {project.dueDate && (
                                <div className={`${styles.infoRow} ${isOverdue(project) ? styles.overdueLine : ''}`}>
                                    {isOverdue(project) ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                                    Prazo: {formatDueDate(project.dueDate)}
                                    {isOverdue(project) && ' — Atrasado!'}
                                </div>
                            )}

                            {/* Info Rows */}
                            {project.productType && (
                                <div className={styles.infoRow}>
                                    <Clock size={12} />
                                    Produto: {project.productType}
                                    {project.durationCategory && ` (${project.durationCategory})`}
                                </div>
                            )}

                            {/* Previous Producer */}
                            {project.metadata?.previousProducerIds?.length > 0 && (
                                <div className={styles.infoRow}>
                                    <History size={12} />
                                    Já produziu: {collaborators.find(c => c.id === project.metadata?.previousProducerIds?.[0])?.name || 'Outro produtor'}
                                </div>
                            )}

                            {/* Notes */}
                            {project.suggestionNotes && (
                                <div className={styles.notes}>
                                    <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                                    {project.suggestionNotes}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Assignment Modal */}
            <ProjectDistributionModal
                project={selectedProject}
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                producers={producers}
                collaborators={collaborators}
                onAssign={handleAssign}
                isAssigning={isAssigning === selectedProject?.id}
            />
        </div>
    );
};

export default DistributionList;
