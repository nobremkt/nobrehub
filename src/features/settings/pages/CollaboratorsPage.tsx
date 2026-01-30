import { useEffect, useState } from 'react';
import { AppLayout } from '@/design-system/layouts';
import { Card, Button, Badge, Spinner, Input, ConfirmModal } from '@/design-system';
import { useCollaboratorStore } from '../stores/useCollaboratorStore';
import { useRoleStore } from '../stores/useRoleStore';
import { useSectorStore } from '../stores/useSectorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { CollaboratorModal } from '../components/CollaboratorModal';
import { Plus, Pencil, Trash2, Search, Mail, Phone, User } from 'lucide-react';
import { Collaborator } from '../types';

export const CollaboratorsPage = () => {
    const { collaborators, fetchCollaborators, isLoading, deleteCollaborator } = useCollaboratorStore();
    const { roles, fetchRoles } = useRoleStore();
    const { sectors, fetchSectors } = useSectorStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [collaboratorToDelete, setCollaboratorToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchCollaborators();
        fetchRoles();
        fetchSectors();
    }, [fetchCollaborators, fetchRoles, fetchSectors]);

    const handleCreate = () => {
        setEditingCollaborator(null);
        setIsModalOpen(true);
    };

    const handleEdit = (collaborator: Collaborator) => {
        setEditingCollaborator(collaborator);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setCollaboratorToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (collaboratorToDelete) {
            setIsDeleting(true);
            try {
                await deleteCollaborator(collaboratorToDelete);
                setIsConfirmOpen(false);
                setCollaboratorToDelete(null);
            } catch (error) {
                console.error("Error deleting collaborator:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const getRoleName = (id?: string) => roles.find(r => r.id === id)?.name || 'Sem cargo';
    const getSectorName = (id?: string) => sectors.find(s => s.id === id)?.name || 'Sem setor';

    const { user } = useAuthStore();

    const filteredCollaborators = collaborators.filter(c => {
        // Hide debug user unless logged in as debug
        if (c.email === 'debug@debug.com' && user?.email !== 'debug@debug.com') {
            return false;
        }

        return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <AppLayout>
            <div className="w-full px-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary mb-1">Colaboradores</h1>
                        <p className="text-text-muted">Gerencie a equipe e perfis de acesso.</p>
                    </div>
                    <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
                        Novo Colaborador
                    </Button>
                </div>

                <div className="w-full md:w-96">
                    <Input
                        placeholder="Buscar colaboradores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={18} />}
                        fullWidth
                    />
                </div>

                {isLoading && collaborators.length === 0 ? (
                    <div className="flex justify-center p-12">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    /* 
                       GRID LAYOUT 
                    */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCollaborators.map(collaborator => (
                            <Card key={collaborator.id} variant="elevated" className="relative flex flex-col items-center pt-8 pb-4 px-4 overflow-visible">
                                <div className="absolute top-3 right-3">
                                    <Badge variant={collaborator.active ? 'success' : 'default'} dot />
                                </div>

                                <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-tertiary mb-3 shrink-0 border-2 border-surface-card shadow-sm">
                                    {collaborator.photoUrl ? (
                                        <img
                                            src={collaborator.photoUrl}
                                            alt={collaborator.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                                            <User size={40} opacity={0.5} />
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-bold text-lg text-text-primary text-center line-clamp-1 w-full" title={collaborator.name}>
                                    {collaborator.name}
                                </h3>

                                <div className="flex flex-col items-center gap-1 mb-4 text-sm text-text-secondary w-full">
                                    <span className="font-medium text-primary-600 text-center truncate w-full">
                                        {getRoleName(collaborator.roleId)}
                                    </span>
                                    <span className="text-xs text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full max-w-full truncate">
                                        {getSectorName(collaborator.sectorId)}
                                    </span>
                                </div>

                                <div className="w-full space-y-2 pt-3 border-t border-border mb-4">
                                    <div className="flex items-center gap-2 text-sm text-text-muted">
                                        <Mail size={14} className="shrink-0" />
                                        <span className="truncate text-xs text-text-primary" title={collaborator.email}>{collaborator.email}</span>
                                    </div>
                                    {collaborator.phone && (
                                        <div className="flex items-center gap-2 text-sm text-text-muted">
                                            <Phone size={14} className="shrink-0" />
                                            <span className="text-xs text-text-primary">{collaborator.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 justify-center w-full mt-auto">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(collaborator)} title="Editar">
                                        <Pencil size={16} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(collaborator.id)} title="Excluir" className="text-danger-500 hover:text-danger-600">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {filteredCollaborators.length === 0 && (
                            <div className="col-span-full text-center py-12 text-text-muted">
                                Nenhum colaborador encontrado.
                            </div>
                        )}
                    </div>
                )}

                <CollaboratorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    collaboratorToEdit={editingCollaborator}
                />

                <ConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Excluir Colaborador"
                    description="Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    variant="danger"
                    isLoading={isDeleting}
                />
            </div>
        </AppLayout>
    );
};
