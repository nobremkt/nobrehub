import { useEffect, useState } from 'react';

import { Card, CardBody, Button, Badge, Spinner, Input, ConfirmModal } from '@/design-system';
import { useLossReasonStore } from '../stores/useLossReasonStore';
import { LossReasonModal } from '../components/LossReasonModal';
import { Plus, Pencil, Trash2, Search, Archive } from 'lucide-react';
import { LossReason } from '../types';

export const LossReasonsPage = () => {
    const { lossReasons, fetchLossReasons, isLoading, deleteLossReason } = useLossReasonStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReason, setEditingReason] = useState<LossReason | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [reasonToDelete, setReasonToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchLossReasons();
    }, [fetchLossReasons]);

    const handleCreate = () => {
        setEditingReason(null);
        setIsModalOpen(true);
    };

    const handleEdit = (reason: LossReason) => {
        setEditingReason(reason);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setReasonToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (reasonToDelete) {
            setIsDeleting(true);
            try {
                await deleteLossReason(reasonToDelete);
                setIsConfirmOpen(false);
                setReasonToDelete(null);
            } catch (error) {
                console.error("Error deleting loss reason:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const filteredReasons = lossReasons.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full px-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Motivos de Perda</h1>
                    <p className="text-text-muted">Gerencie os motivos pelos quais os negócios são perdidos.</p>
                </div>
                <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
                    Novo Motivo
                </Button>
            </div>

            <div className="w-full md:w-96">
                <Input
                    placeholder="Buscar motivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={18} />}
                    fullWidth
                />
            </div>

            {isLoading && lossReasons.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredReasons.map(reason => (
                        <Card key={reason.id} variant="elevated">
                            <CardBody className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-surface-tertiary text-text-secondary">
                                        <Archive size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary">{reason.name}</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-secondary hidden md:inline">
                                            {reason.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <Badge variant={reason.active ? 'success' : 'default'} dot />
                                    </div>

                                    <div className="flex gap-2 pl-4 border-l border-border">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(reason)} title="Editar">
                                            <Pencil size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(reason.id)} title="Excluir" className="text-danger-500 hover:text-danger-600">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}

                    {filteredReasons.length === 0 && (
                        <div className="text-center py-12 text-text-muted">
                            Nenhum motivo encontrado.
                        </div>
                    )}
                </div>
            )}

            <LossReasonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                reasonToEdit={editingReason}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Motivo"
                description="Tem certeza que deseja excluir este motivo? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};
