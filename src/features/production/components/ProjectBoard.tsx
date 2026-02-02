
import { useProductionStore } from '../stores/useProductionStore';
import { Button, Card, Spinner, Badge } from '@/design-system';
import { Plus, Calendar, ExternalLink, Clock } from 'lucide-react';

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
        'alteracao': 'danger'
    };
    return colors[status] || 'default';
};

export const ProjectBoard = () => {
    const { projects, isLoading, selectedProducerId } = useProductionStore();
    // const [isCreating, setIsCreating] = useState(false); // Placeholder para modal futuramente

    if (!selectedProducerId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <p>Selecione um produtor para visualizar seus projetos.</p>
            </div>
        );
    }

    if (isLoading && projects.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
                <h1 className="text-xl font-bold text-text-primary">Projetos em Produção</h1>
                <Button leftIcon={<Plus size={18} />} onClick={() => {/* TODO: Open Modal */ }}>
                    Novo Projeto
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map(project => (
                            <Card key={project.id} variant="elevated" className="flex flex-col gap-3 hover:border-primary-500/50 transition-colors cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-text-primary line-clamp-1" title={project.name}>
                                        {project.name}
                                    </h3>
                                    <Badge variant={getStatusColor(project.status)}>
                                        {getStatusLabel(project.status)}
                                    </Badge>
                                </div>

                                <div className="text-sm text-text-secondary">
                                    <span className="text-text-muted">Cliente: </span>
                                    {project.leadName}
                                </div>

                                {project.notes && (
                                    <p className="text-sm text-text-muted line-clamp-2 bg-surface-secondary p-2 rounded-md">
                                        {project.notes}
                                    </p>
                                )}

                                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        <span>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Sem prazo'}</span>
                                    </div>

                                    {project.driveLink && (
                                        <a
                                            href={project.driveLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-primary-500 hover:text-primary-400"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink size={14} />
                                            <span>Drive</span>
                                        </a>
                                    )}
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
        </div>
    );
};
