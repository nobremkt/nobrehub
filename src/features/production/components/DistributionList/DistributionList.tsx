/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DISTRIBUTION LIST COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Lista de distribuição de projetos - Visível apenas para líderes de produção
 * Permite distribuição automática ou manual de projetos para produtores
 */

import { useEffect, useState, useMemo } from 'react';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProductionDistributionService } from '../../services/ProductionDistributionService';
import { Project } from '@/types/project.types';
import { Button, Spinner, Dropdown } from '@/design-system';
import {
    Inbox,
    Star,
    Clock,
    MessageSquare,
    Zap,
    UserCheck,
    History
} from 'lucide-react';
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
    const [selectedProducers, setSelectedProducers] = useState<Record<string, string>>({});

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

    // Opções do dropdown
    const producerOptions = useMemo(() => {
        return producers.map(p => ({
            value: p.id,
            label: p.name
        }));
    }, [producers]);

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

    // Handler para atribuir manualmente
    const handleAssign = async (projectId: string) => {
        const producerId = selectedProducers[projectId];
        if (!producerId || !user?.id) return;

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
            // Remove da seleção local
            setSelectedProducers(prev => {
                const next = { ...prev };
                delete next[projectId];
                return next;
            });
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
            console.log(`${count} projetos distribuídos automaticamente`);
        } catch (error) {
            console.error('Error auto-assigning all projects:', error);
        } finally {
            setIsAssigning(null);
        }
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
                            className={`${styles.projectCard} ${project.isHighlighted ? styles.highlighted : ''}`}
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

                            {/* Card Actions */}
                            <div className={styles.cardActions}>
                                <div className={styles.producerSelect}>
                                    <Dropdown
                                        options={producerOptions}
                                        value={selectedProducers[project.id] || ''}
                                        onChange={(value) => setSelectedProducers(prev => ({
                                            ...prev,
                                            [project.id]: String(value)
                                        }))}
                                        placeholder="Selecionar produtor..."
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleAssign(project.id)}
                                    disabled={!selectedProducers[project.id] || isAssigning === project.id}
                                    leftIcon={<UserCheck size={14} />}
                                >
                                    {isAssigning === project.id ? '...' : 'Atribuir'}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DistributionList;
