import { useEffect, useState } from 'react';

import { Card, CardBody, Button, Badge, Spinner, Input, ConfirmModal } from '@/design-system';
import { useRoleStore } from '../stores/useRoleStore';
import { RoleModal } from '../components/RoleModal';
import { Plus, Pencil, Trash2, Search, Briefcase } from 'lucide-react';
import { Role } from '../types';

export const RolesPage = () => {
    const { roles, fetchRoles, isLoading, deleteRole } = useRoleStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleCreate = () => {
        setEditingRole(null);
        setIsModalOpen(true);
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setRoleToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (roleToDelete) {
            setIsDeleting(true);
            try {
                await deleteRole(roleToDelete);
                setIsConfirmOpen(false);
                setRoleToDelete(null);
            } catch (error) {
                console.error("Error deleting role:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full px-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Cargos</h1>
                    <p className="text-text-muted">Gerencie os cargos e funções disponíveis na organização.</p>
                </div>
                <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
                    Novo Cargo
                </Button>
            </div>

            <div className="w-full md:w-96">
                <Input
                    placeholder="Buscar cargos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={18} />}
                    fullWidth
                />
            </div>

            {isLoading && roles.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredRoles.map(role => (
                        <Card key={role.id} variant="elevated">
                            <CardBody className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="p-2 rounded-lg bg-surface-tertiary text-text-secondary h-min">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary">{role.name}</h3>
                                        {role.description && (
                                            <p className="text-sm text-text-muted line-clamp-1">{role.description}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-secondary hidden md:inline">
                                            {role.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <Badge variant={role.active ? 'success' : 'default'} dot />
                                    </div>

                                    <div className="flex gap-2 pl-4 border-l border-border">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(role)} title="Editar">
                                            <Pencil size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(role.id)} title="Excluir" className="text-danger-500 hover:text-danger-600">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}

                    {filteredRoles.length === 0 && (
                        <div className="text-center py-12 text-text-muted">
                            Nenhum cargo encontrado.
                        </div>
                    )}
                </div>
            )}

            <RoleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roleToEdit={editingRole}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Cargo"
                description="Tem certeza que deseja excluir este cargo? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};
