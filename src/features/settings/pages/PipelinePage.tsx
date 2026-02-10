import { useEffect, useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Card, CardBody, Button, Spinner, ConfirmModal } from '@/design-system';
import { usePipelineSettingsStore } from '../stores/usePipelineSettingsStore';
import { PipelineStageModal } from '../components/PipelineStageModal';
import { Plus, Pencil, Trash2, GripVertical, Lock, Layers } from 'lucide-react';
import { PipelineStage } from '../types';

type PipelineTab = 'high-ticket' | 'low-ticket';

/* ─── Sortable Stage Row ──────────────────────────────── */

interface SortableStageRowProps {
    stage: PipelineStage;
    onEdit: (stage: PipelineStage) => void;
    onDelete: (stage: PipelineStage) => void;
}

function SortableStageRow({ stage, onEdit, onDelete }: SortableStageRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: stage.id,
        disabled: !!stage.isSystemStage,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto' as any,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card variant="elevated">
                <CardBody className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Grip Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-2 rounded-lg text-text-muted hover:text-text-secondary transition-colors"
                            style={{
                                opacity: stage.isSystemStage ? 0.3 : 1,
                                cursor: stage.isSystemStage ? 'not-allowed' : 'grab',
                                touchAction: 'none',
                            }}
                            title={stage.isSystemStage ? 'Etapa do sistema' : 'Arraste para reordenar'}
                        >
                            <GripVertical size={20} />
                        </div>

                        {/* Name + Color Dot inline */}
                        <div>
                            <div className="flex items-center gap-2">
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: stage.color,
                                    flexShrink: 0,
                                }} />
                                <h3 className="font-semibold text-text-primary">{stage.name}</h3>
                                {stage.isSystemStage && (
                                    <span title="Etapa do sistema — não pode ser excluída">
                                        <Lock size={14} style={{ color: 'var(--color-text-muted)' }} />
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginLeft: '18px' }}>
                                {stage.id}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Order badge */}
                        <span style={{
                            fontSize: '12px',
                            color: 'var(--color-text-muted)',
                            fontWeight: 600,
                        }}>
                            #{stage.order}
                        </span>

                        <div className="flex gap-2 pl-4 border-l border-border">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(stage)} title="Editar">
                                <Pencil size={16} />
                            </Button>
                            {!stage.isSystemStage && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(stage)}
                                    title="Excluir"
                                    className="text-danger-500 hover:text-danger-600"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

/* ─── Pipeline Page ───────────────────────────────────── */

export const PipelinePage = () => {
    const { stages, fetchStages, isLoading, deleteStage, reorderStages, seedDefaults } = usePipelineSettingsStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
    const [activeTab, setActiveTab] = useState<PipelineTab>('high-ticket');

    // Delete Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [stageToDelete, setStageToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    // DnD Kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        fetchStages();
    }, [fetchStages]);

    // Stages filtrados pelo pipeline ativo e ordenados
    const pipelineStages = stages
        .filter(s => s.pipeline === activeTab)
        .sort((a, b) => a.order - b.order);

    const handleCreate = () => {
        setEditingStage(null);
        setIsModalOpen(true);
    };

    const handleEdit = (stage: PipelineStage) => {
        setEditingStage(stage);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (stage: PipelineStage) => {
        if (stage.isSystemStage) return;
        setStageToDelete(stage.id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (stageToDelete) {
            setIsDeleting(true);
            try {
                await deleteStage(stageToDelete);
                setIsConfirmOpen(false);
                setStageToDelete(null);
            } catch (error) {
                console.error("Error deleting stage:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = pipelineStages.findIndex(s => s.id === active.id);
        const newIndex = pipelineStages.findIndex(s => s.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(pipelineStages, oldIndex, newIndex)
            .map((stage, index) => ({ ...stage, order: index }));

        // Mantém os stages do outro pipeline intactos
        const otherPipelineStages = stages.filter(s => s.pipeline !== activeTab);
        reorderStages([...otherPipelineStages, ...reordered]);
    };

    const handleSeedDefaults = async () => {
        setIsSeeding(true);
        try {
            await seedDefaults();
        } catch (error) {
            console.error('Erro ao criar etapas padrão:', error);
        } finally {
            setIsSeeding(false);
        }
    };

    // Novos stages devem vir antes dos system stages (Ganho/Perdido)
    const getInsertOrder = () => {
        const systemStages = pipelineStages.filter(s => s.isSystemStage);
        const normalStages = pipelineStages.filter(s => !s.isSystemStage);
        if (systemStages.length > 0) {
            return normalStages.length;
        }
        return pipelineStages.length;
    };

    const tabs: { key: PipelineTab; label: string }[] = [
        { key: 'high-ticket', label: 'High Ticket' },
        { key: 'low-ticket', label: 'Low Ticket' },
    ];

    return (
        <div className="w-full px-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Pipelines</h1>
                    <p className="text-text-muted">Gerencie as etapas do seu funil de vendas. Arraste para reordenar.</p>
                </div>
                <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
                    Nova Etapa
                </Button>
            </div>

            {/* Tabs de Pipeline */}
            <div style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface)',
                width: 'fit-content',
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            background: activeTab === tab.key ? 'var(--color-primary-500)' : 'transparent',
                            color: activeTab === tab.key ? '#fff' : 'var(--color-text-secondary)',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading && stages.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={pipelineStages.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-3">
                            {pipelineStages.map(stage => (
                                <SortableStageRow
                                    key={stage.id}
                                    stage={stage}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                />
                            ))}

                            {/* Empty State */}
                            {pipelineStages.length === 0 && (
                                <div className="text-center py-12">
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: 'var(--radius-xl)',
                                        background: 'var(--color-surface)',
                                        marginBottom: '16px',
                                    }}>
                                        <Layers size={28} style={{ color: 'var(--color-text-muted)' }} />
                                    </div>
                                    <p className="text-text-muted mb-4">Nenhuma etapa configurada para este pipeline.</p>
                                    {stages.length === 0 && (
                                        <Button
                                            onClick={handleSeedDefaults}
                                            isLoading={isSeeding}
                                            variant="secondary"
                                        >
                                            Carregar Etapas Padrão
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <PipelineStageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                stageToEdit={editingStage}
                pipeline={activeTab}
                nextOrder={getInsertOrder()}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Etapa"
                description="Tem certeza que deseja excluir esta etapa? Leads nesta etapa serão mantidos mas sem coluna associada."
                confirmLabel="Excluir"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};
