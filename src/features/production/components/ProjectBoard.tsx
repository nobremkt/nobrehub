import { useState, useEffect } from 'react';
import { useProductionStore } from '../stores/useProductionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { PERMISSIONS } from '@/config/permissions';
import { Button, Card, Spinner, Badge } from '@/design-system';
import { Plus, Calendar, ExternalLink, Clock, AlertCircle, Check, FilePenLine } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectDetailsModal } from './ProjectDetailsModal';

// Helper de status
const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        'aguardando': 'Aguardando',
        'em-producao': 'Em Produção',
        'a-revisar': 'A Revisar',
        'revisado': 'Revisado',
        'alteracao': 'Em Alteração'
    };
    return labels[status] || status;
};

const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
        'aguardando': 'default',
        'em-producao': 'primary',
        'a-revisar': 'warning',
        'revisado': 'success',
        'alteracao': 'warning'
    };
    return colors[status] || 'default';
};

// Tabs Configuration
type TabType = 'production' | 'changes' | 'finished';

const TABS: { id: TabType; label: string; statuses: string[] }[] = [
    { id: 'production', label: 'Produção', statuses: ['aguardando', 'em-producao'] },
    { id: 'changes', label: 'Alterações', statuses: ['alteracao'] },
    { id: 'finished', label: 'Finalizados', statuses: ['revisado', 'a-revisar'] },
];

export const ProjectBoard = () => {
    const {
        projects,
        isLoading,
        selectedProducerId,
        updateProject,
        highlightedProjectId,
        setHighlightedProjectId
    } = useProductionStore();
    const { user } = useAuthStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>('production');



    const canManageProjects = user?.permissions?.includes(PERMISSIONS.MANAGE_PROJECTS) || user?.role === 'admin';

    // Handle Scroll to Highlighted Project & Tab Switching
    useEffect(() => {
        if (highlightedProjectId && projects.length > 0) {
            // Check if we need to switch tabs
            const project = projects.find(p => p.id === highlightedProjectId);
            if (project) {
                const targetTab = TABS.find(t => t.statuses.includes(project.status))?.id;
                if (targetTab && targetTab !== activeTab) {
                    setActiveTab(targetTab);
                    return; // Wait for re-render after tab switch
                }
            }

            // Give time for render
            setTimeout(() => {
                const element = document.getElementById(`project-card-${highlightedProjectId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('animate-pulse-red');

                    // Clear highlight after animation
                    setTimeout(() => {
                        element.classList.remove('animate-pulse-red');
                        setHighlightedProjectId(null);
                    }, 2000);
                }
            }, 500);
        }
    }, [highlightedProjectId, projects, setHighlightedProjectId, activeTab]);



    if (!selectedProducerId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <p>Selecione um produtor para visualizar seus projetos.</p>
            </div>
        );
    }

    // ... rest of the component ... 
    // Wait, I need to replace the whole beginning including the header to inject the search bar.
    // I will replace up to line 152 in the original file (header section).

    /* 
       Actually, replacing the whole component logic is safer to ensure all hooks are in place.
       But standard replace tool works on blocks. 
       I will modify the imports and the logic part first properly.
    */

    // Status weights for sorting
    const getStatusWeight = (status: string) => {
        const weights: Record<string, number> = {
            'a-revisar': 4,
            'em-producao': 3,
            'aguardando': 2,
            'revisado': 1,
            'alteracao': 0
        };
        return weights[status] || 0;
    };

    // Filter projects based on active tab
    const filteredProjects = projects
        .filter(p => {
            const currentTab = TABS.find(t => t.id === activeTab);
            return currentTab?.statuses.includes(p.status);
        })
        .sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;

            const weightA = getStatusWeight(a.status);
            const weightB = getStatusWeight(b.status);
            if (weightA !== weightB) return weightB - weightA;

            return 0;
        });

    const getTabCount = (tabId: TabType) => {
        const tab = TABS.find(t => t.id === tabId);
        if (!tab) return 0;
        return projects.filter(p => tab.statuses.includes(p.status)).length;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col gap-4 p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <h1 className="text-xl font-bold text-text-primary">Projetos</h1>



                        {/* Tabs */}
                        <div className="flex p-1 bg-surface-tertiary rounded-lg">
                            {TABS.map(tab => {
                                const count = getTabCount(tab.id);
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2
                                            ${activeTab === tab.id
                                                ? 'bg-surface-primary text-text-primary shadow-sm'
                                                : 'text-text-muted hover:text-text-secondary'
                                            }
                                        `}
                                    >
                                        {tab.label}
                                        {count > 0 && (
                                            <span className={`
                                                text-xs px-1.5 py-0.5 rounded-full
                                                ${activeTab === tab.id
                                                    ? 'bg-surface-secondary text-text-primary'
                                                    : 'bg-surface-primary/50 text-text-muted'
                                                }
                                            `}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Button leftIcon={<Plus size={18} />} onClick={() => setIsCreateModalOpen(true)}>
                        Novo Projeto
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {isLoading && projects.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <Spinner size="lg" />
                    </div>
                ) : filteredProjects.length > 0 ? (
                    <div key={selectedProducerId} className="flex flex-col gap-3 animate-fade-in">
                        {filteredProjects.map(project => (
                            <Card
                                key={project.id}
                                id={`project-card-${project.id}`}
                                variant="elevated"
                                className="group hover:border-primary-500/50 transition-all cursor-pointer border-l-4 border-l-transparent"
                                onClick={() => setSelectedProject(project)}
                            >
                                <div className="flex items-center justify-between gap-4">

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-text-primary truncate" title={project.name}>
                                                {project.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                                            <span className="truncate flex items-center gap-1">
                                                <span className="text-text-muted">Cliente:</span>
                                                {project.leadName}
                                            </span>
                                            {project.dueDate && (
                                                <span className="flex items-center gap-1 text-text-muted">
                                                    <Calendar size={13} />
                                                    {new Date(project.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Middle */}
                                    {project.notes && (
                                        <div className="hidden md:block flex-1 max-w-xs">
                                            <p className="text-xs text-text-muted line-clamp-2 bg-surface-secondary/50 p-2 rounded">
                                                {project.notes}
                                            </p>
                                        </div>
                                    )}
                                    {/* Actions */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="flex items-center gap-2">
                                            {canManageProjects && project.status !== 'revisado' && (
                                                <>
                                                    {project.status === 'a-revisar' ? (
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateProject(project.id, { status: 'alteracao' });
                                                                }}
                                                                leftIcon={<FilePenLine size={14} />}
                                                                title="Solicitar Alteração"
                                                            >
                                                                Alteração
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateProject(project.id, {
                                                                        status: 'revisado',
                                                                        priority: 'normal'
                                                                    });
                                                                }}
                                                                leftIcon={<Check size={14} />}
                                                            >
                                                                Aprovar
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant={project.priority === 'high' ? 'danger' : 'secondary'}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateProject(project.id, {
                                                                    priority: project.priority === 'high' ? 'normal' : 'high'
                                                                });
                                                            }}
                                                            leftIcon={<AlertCircle size={14} />}
                                                        >
                                                            {project.priority === 'high' ? 'Prioridade' : 'Priorizar'}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            {!canManageProjects && project.status === 'aguardando' && (
                                                <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); updateProject(project.id, { status: 'em-producao' }); }}>Iniciar</Button>
                                            )}
                                            {!canManageProjects && project.status === 'em-producao' && (
                                                <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); updateProject(project.id, { status: 'a-revisar' }); }}>Finalizar</Button>
                                            )}
                                        </div>
                                        {project.priority === 'high' && <Badge variant="danger" content="Prioridade Alta" />}
                                        <Badge variant={getStatusColor(project.status)} content={getStatusLabel(project.status)} />
                                        {project.driveLink && (
                                            <a href={project.driveLink} target="_blank" rel="noreferrer" className="p-2 text-text-muted hover:text-primary-500 hover:bg-surface-secondary rounded-full transition-colors" onClick={(e) => e.stopPropagation()}><ExternalLink size={18} /></a>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-text-muted border-2 border-dashed border-border rounded-lg">
                        <Clock size={40} className="mb-2 opacity-20" />
                        <p>Nenhum projeto encontrado para este produtor.</p>
                    </div>
                )}
            </div>

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            {
                selectedProject && (
                    <ProjectDetailsModal
                        isOpen={!!selectedProject}
                        onClose={() => setSelectedProject(null)}
                        project={selectedProject}
                    />
                )
            }
        </div >
    );
};
