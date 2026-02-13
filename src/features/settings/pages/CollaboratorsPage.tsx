import { useEffect, useState, useMemo } from 'react';

import { Card, Button, Badge, Spinner, Input, ConfirmModal, Checkbox } from '@/design-system';
import { useCollaboratorStore } from '../stores/useCollaboratorStore';
import { useRoleStore } from '../stores/useRoleStore';
import { useSectorStore } from '../stores/useSectorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { CollaboratorModal } from '../components/CollaboratorModal';
import { BulkPasswordModal } from '../components/BulkPasswordModal';
import { Plus, Pencil, Trash2, Search, Mail, Phone, User, Eye, EyeOff, Lock, ArrowDownAZ, Clock, KeyRound } from 'lucide-react';
import { Collaborator } from '../types';
import { formatPhone } from '@/utils';
import { toast } from 'react-toastify';

type SortMode = 'sector-name' | 'recent';

export const CollaboratorsPage = () => {
    const { collaborators, fetchCollaborators, isLoading, deleteCollaborator } = useCollaboratorStore();
    const { roles, fetchRoles } = useRoleStore();
    const { sectors, fetchSectors } = useSectorStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('sector-name');

    // Delete Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [collaboratorToDelete, setCollaboratorToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkPasswordOpen, setIsBulkPasswordOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Password visibility (per card)
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

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

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        let successCount = 0;
        for (const id of selectedIds) {
            try {
                await deleteCollaborator(id);
                successCount++;
            } catch {
                // skip
            }
        }
        setIsBulkDeleting(false);
        setIsBulkDeleteOpen(false);
        setSelectedIds(new Set());
        toast.success(`${successCount} colaborador(es) excluído(s)`);
    };

    const getRoleName = (id?: string) => roles.find(r => r.id === id)?.name || 'Sem cargo';
    const getSectorName = (id?: string) => sectors.find(s => s.id === id)?.name || 'Sem setor';

    const { user } = useAuthStore();

    const filteredCollaborators = useMemo(() => {
        let list = collaborators.filter(c => {
            if (c.email === 'debug@debug.com' && user?.email !== 'debug@debug.com') {
                return false;
            }
            return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase());
        });

        if (sortMode === 'sector-name') {
            list = [...list].sort((a, b) => {
                const sectorA = getSectorName(a.sectorId);
                const sectorB = getSectorName(b.sectorId);
                const sectorCompare = sectorA.localeCompare(sectorB, 'pt-BR');
                if (sectorCompare !== 0) return sectorCompare;
                return a.name.localeCompare(b.name, 'pt-BR');
            });
        } else {
            list = [...list].sort((a, b) => b.createdAt - a.createdAt);
        }

        return list;
    }, [collaborators, searchTerm, sortMode, user?.email, sectors]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCollaborators.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCollaborators.map(c => c.id)));
        }
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const hasSelection = selectedIds.size > 0;
    const allSelected = selectedIds.size === filteredCollaborators.length && filteredCollaborators.length > 0;

    return (
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

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="w-full md:w-96">
                    <Input
                        placeholder="Buscar colaboradores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={18} />}
                        fullWidth
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={sortMode === 'sector-name' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSortMode('sector-name')}
                        leftIcon={<ArrowDownAZ size={16} />}
                    >
                        Setor
                    </Button>
                    <Button
                        variant={sortMode === 'recent' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSortMode('recent')}
                        leftIcon={<Clock size={16} />}
                    >
                        Recentes
                    </Button>
                </div>
            </div>

            {/* Bulk action bar */}
            {hasSelection && (
                <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                    <Checkbox
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        label={`${selectedIds.size} selecionado(s)`}
                    />
                    <div className="flex-1" />
                    <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<KeyRound size={16} />}
                        onClick={() => setIsBulkPasswordOpen(true)}
                    >
                        Alterar Senha
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger-500 hover:text-danger-600"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => setIsBulkDeleteOpen(true)}
                    >
                        Excluir
                    </Button>
                </div>
            )}

            {isLoading && collaborators.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCollaborators.map(collaborator => (
                        <Card key={collaborator.id} variant="elevated" className="relative flex flex-col items-center pt-8 pb-4 px-4 overflow-visible">
                            {/* Selection checkbox */}
                            <div className="absolute top-3 left-3">
                                <Checkbox
                                    checked={selectedIds.has(collaborator.id)}
                                    onChange={() => toggleSelect(collaborator.id)}
                                    noSound
                                />
                            </div>

                            <div className="absolute top-3 right-3">
                                <Badge variant={collaborator.active ? 'success' : 'default'} dot />
                            </div>

                            <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-tertiary mb-3 shrink-0 border-2 border-surface-card shadow-sm">
                                {collaborator.profilePhotoUrl ? (
                                    <img
                                        src={collaborator.profilePhotoUrl}
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
                                        <span className="text-xs text-text-primary">{formatPhone(collaborator.phone)}</span>
                                    </div>
                                )}
                                {/* Password row */}
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <Lock size={14} className="shrink-0" />
                                    <span className="text-xs text-text-primary font-mono flex-1 truncate">
                                        {collaborator.plainPassword
                                            ? (visiblePasswords.has(collaborator.id)
                                                ? collaborator.plainPassword
                                                : '••••••')
                                            : '—'
                                        }
                                    </span>
                                    {collaborator.plainPassword && (
                                        <button
                                            onClick={() => togglePasswordVisibility(collaborator.id)}
                                            className="text-text-muted hover:text-text-primary transition-colors p-0.5"
                                            title={visiblePasswords.has(collaborator.id) ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {visiblePasswords.has(collaborator.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    )}
                                </div>
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

            <ConfirmModal
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                title="Excluir Selecionados"
                description={`Tem certeza que deseja excluir ${selectedIds.size} colaborador(es)? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir Todos"
                variant="danger"
                isLoading={isBulkDeleting}
            />

            <BulkPasswordModal
                isOpen={isBulkPasswordOpen}
                onClose={() => {
                    setIsBulkPasswordOpen(false);
                    setSelectedIds(new Set());
                }}
                selectedIds={Array.from(selectedIds)}
            />
        </div>
    );
};
