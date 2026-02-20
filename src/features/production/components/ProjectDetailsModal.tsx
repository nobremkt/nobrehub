import { useState, useEffect } from 'react';
import { useProductionStore } from '../stores/useProductionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { PERMISSIONS } from '@/config/permissions';
import {
    Modal,
    Input,
    Button,
    Dropdown,
    Badge
} from '@/design-system';
import { Project, ProjectStatus } from '@/types/project.types';
import { ConfirmModal } from '@/design-system/components/ConfirmModal/ConfirmModal';
import { Calendar, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface ProjectDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
}

const PROJECT_STATUS_OPTIONS = [
    { value: 'aguardando', label: 'Aguardando' },
    { value: 'em-producao', label: 'Em Producao' },
    { value: 'a-revisar', label: 'A Revisar' },
    { value: 'revisado', label: 'Revisado' },
    { value: 'alteracao', label: 'Em Alteracao (legacy)' },
    { value: 'alteracao_interna', label: 'Alteracao Interna' },
    { value: 'alteracao_cliente', label: 'Alteracao Cliente' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'concluido', label: 'Concluido' },
];

export const ProjectDetailsModal = ({ isOpen, onClose, project }: ProjectDetailsModalProps) => {
    const { updateProject, deleteProject, isLoading } = useProductionStore();
    const { user } = useAuthStore();

    // Permissions
    const canManageProjects = user?.permissions?.includes(PERMISSIONS.MANAGE_PROJECTS) || user?.email === 'debug@debug.com';
    const isReadOnly = !canManageProjects;

    // Form State
    const [name, setName] = useState('');
    const [leadName, setLeadName] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('aguardando');
    const [dueDate, setDueDate] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [notes, setNotes] = useState('');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDelete = async () => {
        if (!project) return;
        try {
            await deleteProject(project.id);
            setIsDeleteModalOpen(false);
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (project) {
            setName(project.name);
            setLeadName(project.leadName);
            setStatus(project.status);
            setDueDate(project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '');
            setDriveLink(project.driveLink || '');
            setNotes(project.notes || '');
        }
    }, [project]);

    if (!project) return null;

    const handleCopyStatusPageLink = async () => {
        if (!project.statusPageUrl) return;
        try {
            await navigator.clipboard.writeText(project.statusPageUrl);
            toast.success('Link da pagina de status copiado!');
        } catch (error) {
            console.error(error);
            toast.error('Nao foi possivel copiar o link.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        try {
            await updateProject(project.id, {
                name,
                leadName,
                status,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                driveLink,
                notes,
            });
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isReadOnly ? 'Detalhes do Projeto' : 'Editar Projeto'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Header Info */}
                <div className="flex flex-col gap-4">
                    {isReadOnly ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Projeto</label>
                                <p className="text-lg font-medium text-text-primary">{name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Cliente</label>
                                <p className="text-text-primary">{leadName}</p>
                            </div>
                            {(project.source !== 'manual' || project.externalId) && (
                                <div className="flex gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Origem</label>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Badge variant="default" className="bg-surface-tertiary text-text-secondary" content={project.source} />
                                            {project.externalId && <Badge variant="default" className="font-mono text-xs" content={`#${project.externalId}`} />}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Input
                                label="Nome do Projeto"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                fullWidth
                            />
                            <Input
                                label="Nome do Cliente (Lead)"
                                value={leadName}
                                onChange={(e) => setLeadName(e.target.value)}
                                required
                                fullWidth
                            />
                        </>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {isReadOnly ? (
                        <div>
                            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Status</label>
                            <Badge variant="default" content={PROJECT_STATUS_OPTIONS.find(o => o.value === status)?.label || status} />
                        </div>
                    ) : (
                        <Dropdown
                            label="Status"
                            options={PROJECT_STATUS_OPTIONS}
                            value={status}
                            onChange={(val) => setStatus(val as ProjectStatus)}
                        />
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-secondary">
                            Prazo de Entrega
                        </label>
                        {isReadOnly ? (
                            <div className="flex items-center gap-2 text-text-primary py-2">
                                <Calendar size={16} className="text-text-muted" />
                                <span>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Sem prazo'}</span>
                            </div>
                        ) : (
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                                fullWidth
                            />
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                        Link do Drive
                    </label>
                    {isReadOnly ? (
                        driveLink ? (
                            <a
                                href={driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-primary-500 hover:text-primary-400 transition-colors bg-surface-secondary p-3 rounded-md"
                            >
                                <ExternalLink size={16} />
                                <span className="truncate">{driveLink}</span>
                            </a>
                        ) : (
                            <p className="text-text-muted italic">Nenhum link adicionado.</p>
                        )
                    ) : (
                        <Input
                            placeholder="https://drive.google.com/..."
                            value={driveLink}
                            onChange={(e) => setDriveLink(e.target.value)}
                            fullWidth
                        />
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                        Pagina de Status do Cliente
                    </label>
                    {project.statusPageUrl ? (
                        <div className="flex items-center gap-2 bg-surface-secondary p-2 rounded-md border border-border">
                            <a
                                href={project.statusPageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex items-center gap-2 text-primary-500 hover:text-primary-400 transition-colors min-w-0"
                            >
                                <ExternalLink size={16} />
                                <span className="truncate">{project.statusPageUrl}</span>
                            </a>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyStatusPageLink}
                                leftIcon={<Copy size={14} />}
                            >
                                Copiar
                            </Button>
                        </div>
                    ) : (
                        <p className="text-text-muted italic">Link ainda nao disponivel.</p>
                    )}
                </div>

                <Input
                    label="Observacoes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isReadOnly ? undefined : "Detalhes adicionais do projeto..."}
                    disabled={isReadOnly}
                    fullWidth
                />


                <div className="flex justify-between pt-4 border-t border-border mt-6">
                    <div>
                        {!isReadOnly && (
                            <Button
                                variant="danger"
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                leftIcon={<Trash2 size={16} />}
                            >
                                Excluir
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} type="button">
                            {isReadOnly ? 'Fechar' : 'Cancelar'}
                        </Button>
                        {!isReadOnly && (
                            <Button variant="primary" type="submit" isLoading={isLoading}>
                                Salvar Alteracoes
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Excluir Projeto"
                description={`Tem certeza que deseja excluir o projeto "${project.name}"? Esta acao nao pode ser desfeita.`}
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                variant="danger"
                isLoading={isLoading}
            />
        </Modal >
    );
};
