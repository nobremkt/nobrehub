import { useEffect, useState } from 'react';

import { Card, CardBody, Button, Spinner, Input, ConfirmModal, Modal, Switch } from '@/design-system';
import { useLossReasonStore } from '../stores/useLossReasonStore';
import { LossReasonModal } from '../components/LossReasonModal';
import { Plus, Pencil, Trash2, Search, Archive, GripVertical, Eye } from 'lucide-react';
import { LossReason } from '../types';

export const LossReasonsPage = () => {
    const { lossReasons, fetchLossReasons, isLoading, deleteLossReason, reorderLossReasons, addLossReason, updateLossReason } = useLossReasonStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReason, setEditingReason] = useState<LossReason | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [reasonToDelete, setReasonToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Preview Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewSelectedReason, setPreviewSelectedReason] = useState<string>('');

    // Drag and Drop State
    const [draggedItem, setDraggedItem] = useState<LossReason | null>(null);

    useEffect(() => {
        fetchLossReasons();
    }, [fetchLossReasons]);

    // Sorted reasons by order
    const sortedReasons = [...lossReasons].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

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

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, reason: LossReason) => {
        setDraggedItem(reason);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetReason: LossReason) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetReason.id) return;

        const currentOrder = [...sortedReasons];
        const draggedIndex = currentOrder.findIndex(r => r.id === draggedItem.id);
        const targetIndex = currentOrder.findIndex(r => r.id === targetReason.id);

        // Remove dragged item and insert at target position
        currentOrder.splice(draggedIndex, 1);
        currentOrder.splice(targetIndex, 0, draggedItem);

        // Update order property
        const reordered = currentOrder.map((reason, index) => ({ ...reason, order: index }));
        reorderLossReasons(reordered);
        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    // Estado para seed dos motivos padrão
    const [isSeeding, setIsSeeding] = useState(false);

    const DEFAULT_LOSS_REASONS = [
        { name: 'Preço muito alto', order: 0 },
        { name: 'Momento errado / Não é prioridade', order: 1 },
        { name: 'Escolheu concorrente', order: 2 },
        { name: 'Sem orçamento', order: 3 },
        { name: 'Não respondeu / Sumiu', order: 4 },
        { name: 'Não era o perfil ideal', order: 5 },
        { name: 'Problema interno do lead', order: 6 },
        { name: 'Outro motivo', order: 7 },
    ];

    const handleSeedDefaults = async () => {
        setIsSeeding(true);
        try {
            for (const reason of DEFAULT_LOSS_REASONS) {
                await addLossReason({
                    name: reason.name,
                    active: true,
                    order: reason.order
                });
            }
            await fetchLossReasons();
        } catch (error) {
            console.error('Erro ao criar motivos padrão:', error);
        } finally {
            setIsSeeding(false);
        }
    };

    const filteredReasons = sortedReasons.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full px-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Motivos de Perda</h1>
                    <p className="text-text-muted">Gerencie os motivos pelos quais os negócios são perdidos. Arraste para reordenar.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setIsPreviewOpen(true)} leftIcon={<Eye size={18} />}>
                        Pré-visualizar
                    </Button>
                    <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
                        Novo Motivo
                    </Button>
                </div>
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
                        <Card
                            key={reason.id}
                            variant="elevated"
                            draggable
                            onDragStart={(e: React.DragEvent) => handleDragStart(e, reason)}
                            onDragOver={handleDragOver}
                            onDrop={(e: React.DragEvent) => handleDrop(e, reason)}
                            onDragEnd={handleDragEnd}
                            style={{
                                opacity: draggedItem?.id === reason.id ? 0.5 : 1,
                                cursor: 'grab'
                            }}
                        >
                            <CardBody className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="p-2 rounded-lg text-text-muted cursor-grab hover:text-text-secondary transition-colors"
                                        title="Arraste para reordenar"
                                    >
                                        <GripVertical size={20} />
                                    </div>
                                    <div className="p-2 rounded-lg bg-surface-tertiary text-text-secondary">
                                        <Archive size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary">{reason.name}</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Switch
                                        checked={reason.active}
                                        onChange={(checked) => updateLossReason(reason.id, { active: checked })}
                                    />

                                    <div className="flex gap-2 pl-4 border-l border-border">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(reason)} title="Editar nome">
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
                        <div className="text-center py-12">
                            <p className="text-text-muted mb-4">Nenhum motivo encontrado.</p>
                            {lossReasons.length === 0 && (
                                <Button
                                    onClick={handleSeedDefaults}
                                    isLoading={isSeeding}
                                    variant="secondary"
                                >
                                    Carregar Motivos Padrão
                                </Button>
                            )}
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

            {/* Modal de Preview */}
            <Modal
                isOpen={isPreviewOpen}
                onClose={() => {
                    setIsPreviewOpen(false);
                    setPreviewSelectedReason('');
                }}
                title="Motivo da Perda"
                size="auto"
                footer={
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsPreviewOpen(false);
                                setPreviewSelectedReason('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!previewSelectedReason}
                            onClick={() => {
                                setIsPreviewOpen(false);
                                setPreviewSelectedReason('');
                            }}
                        >
                            Confirmar
                        </Button>
                    </div>
                }
            >
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Selecione o motivo pelo qual este lead foi perdido:
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                }}>
                    {sortedReasons.filter(r => r.active).map((reason) => (
                        <Button
                            key={reason.id}
                            variant={previewSelectedReason === reason.id ? 'primary' : 'ghost'}
                            onClick={() => setPreviewSelectedReason(reason.id)}
                            fullWidth
                            style={{
                                height: '60px',
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                opacity: previewSelectedReason && previewSelectedReason !== reason.id ? 0.5 : 1,
                                border: previewSelectedReason === reason.id
                                    ? 'none'
                                    : '1px solid var(--color-border)',
                                boxShadow: previewSelectedReason === reason.id
                                    ? '0 4px 12px rgba(220, 38, 38, 0.4)'
                                    : 'none',
                            }}
                        >
                            {reason.name}
                        </Button>
                    ))}
                </div>
                <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    ⬆️ Esta é uma pré-visualização do modal que aparece ao marcar um lead como perdido.
                </p>
            </Modal>
        </div>
    );
};
