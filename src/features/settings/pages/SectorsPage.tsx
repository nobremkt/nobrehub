import { useEffect, useState } from 'react';
import { AppLayout } from '@/design-system/layouts';
import { Card, CardBody, Button, Badge, Spinner, Input, ConfirmModal } from '@/design-system';
import { useSectorStore } from '../stores/useSectorStore';
import { SectorModal } from '../components/SectorModal';
import { Plus, Pencil, Trash2, Search, Users, User } from 'lucide-react';
import { Sector } from '../types';

export const SectorsPage = () => {
    const { sectors, fetchSectors, isLoading, deleteSector } = useSectorStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSector, setEditingSector] = useState<Sector | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [sectorToDelete, setSectorToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchSectors();
    }, [fetchSectors]);

    const handleCreate = () => {
        setEditingSector(null);
        setIsModalOpen(true);
    };

    const handleEdit = (sector: Sector) => {
        setEditingSector(sector);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setSectorToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (sectorToDelete) {
            setIsDeleting(true);
            try {
                await deleteSector(sectorToDelete);
                setIsConfirmOpen(false);
                setSectorToDelete(null);
            } catch (error) {
                console.error("Error deleting sector:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const filteredSectors = sectors.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.manager && s.manager.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <AppLayout>
            <div className="w-full px-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary mb-1">Setores</h1>
                        <p className="text-text-muted">Gerencie os departamentos e setores da organização.</p>
                    </div>
                    <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
                        Novo Setor
                    </Button>
                </div>

                <div className="w-full md:w-96">
                    <Input
                        placeholder="Buscar setores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={18} />}
                        fullWidth
                    />
                </div>

                {isLoading && sectors.length === 0 ? (
                    <div className="flex justify-center p-12">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredSectors.map(sector => (
                            <Card key={sector.id} variant="elevated">
                                <CardBody className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2 rounded-lg bg-surface-tertiary text-text-secondary h-min">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-primary">{sector.name}</h3>
                                            {sector.description && (
                                                <p className="text-sm text-text-muted line-clamp-1">{sector.description}</p>
                                            )}
                                            {sector.manager && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary">
                                                    <User size={12} />
                                                    <span>{sector.manager}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-text-secondary hidden md:inline">
                                                {sector.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                            <Badge variant={sector.active ? 'success' : 'default'} dot />
                                        </div>

                                        <div className="flex gap-2 pl-4 border-l border-border">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(sector)} title="Editar">
                                                <Pencil size={16} />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(sector.id)} title="Excluir" className="text-danger-500 hover:text-danger-600">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}

                        {filteredSectors.length === 0 && (
                            <div className="text-center py-12 text-text-muted">
                                Nenhum setor encontrado.
                            </div>
                        )}
                    </div>
                )}

                <SectorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    sectorToEdit={editingSector}
                />

                <ConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Excluir Setor"
                    description="Tem certeza que deseja excluir este setor? Esta ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    variant="danger"
                    isLoading={isDeleting}
                />
            </div>
        </AppLayout>
    );
};
