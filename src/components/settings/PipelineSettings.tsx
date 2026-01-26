
import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GitMerge,
    Plus,
    GripVertical,
    Trash2,
    Edit2,
    Save,
    X,
    Check
} from 'lucide-react';
import { toast } from 'sonner';

interface PipelineStage {
    id: string;
    name: string;
    color: string;
    order: number;
    isSystem: boolean;
    isActive: boolean;
}

const PIPELINE_TYPES = [
    { id: 'high_ticket', label: 'High Ticket' },
    { id: 'low_ticket', label: 'Low Ticket' },
    { id: 'production', label: 'Produção' },
    { id: 'post_sales', label: 'Pós-Vendas' }
];

const PIPELINE_TEMPLATES = {
    high_ticket: [
        { name: 'Novo Lead', color: 'slate', id: 'novo', isSystem: true },
        { name: 'Qualificado', color: 'amber', id: 'qualificado', isSystem: true },
        { name: 'Call Agendada', color: 'blue', id: 'call_agendada', isSystem: true },
        { name: 'Proposta', color: 'purple', id: 'proposta', isSystem: true },
        { name: 'Negociação', color: 'orange', id: 'negociacao', isSystem: true },
        { name: 'Fechado', color: 'emerald', id: 'fechado', isSystem: true },
        { name: 'Perdido', color: 'rose', id: 'perdido', isSystem: true }
    ],
    low_ticket: [
        { name: 'Novo', color: 'slate', id: 'novo', isSystem: true },
        { name: 'Atribuído', color: 'blue', id: 'atribuido', isSystem: true },
        { name: 'Em Negociação', color: 'amber', id: 'em_negociacao', isSystem: true },
        { name: 'Fechado', color: 'emerald', id: 'fechado', isSystem: true },
        { name: 'Perdido', color: 'rose', id: 'perdido', isSystem: true }
    ],
    production: [
        { name: 'A Fazer', color: 'slate', id: 'backlog', isSystem: true },
        { name: 'Em Produção', color: 'blue', id: 'fazendo', isSystem: true },
        { name: 'Revisão', color: 'orange', id: 'revisao', isSystem: true },
        { name: 'Entregue', color: 'emerald', id: 'concluido', isSystem: true }
    ],
    post_sales: [
        { name: 'Novo', color: 'slate', id: 'novo', isSystem: true },
        { name: 'Onboarding', color: 'indigo', id: 'onboarding', isSystem: true },
        { name: 'Acompanhamento', color: 'blue', id: 'acompanhamento', isSystem: true },
        { name: 'Renovação', color: 'amber', id: 'renovacao', isSystem: true },
        { name: 'Encerrado', color: 'emerald', id: 'encerrado', isSystem: true }
    ]
};

const COLORS = [
    { name: 'slate', bg: 'bg-slate-500' },
    { name: 'blue', bg: 'bg-blue-500' },
    { name: 'emerald', bg: 'bg-emerald-500' },
    { name: 'rose', bg: 'bg-rose-500' },
    { name: 'amber', bg: 'bg-amber-500' },
    { name: 'indigo', bg: 'bg-indigo-500' },
    { name: 'purple', bg: 'bg-purple-500' },
    { name: 'orange', bg: 'bg-orange-500' },
];

function SortableItem({ stage, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as 'relative',
    };

    const [editName, setEditName] = useState(stage.name);
    const [editColor, setEditColor] = useState(stage.color);

    useEffect(() => {
        if (isEditing) {
            setEditName(stage.name);
            setEditColor(stage.color);
        }
    }, [isEditing, stage]);

    if (isEditing) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="flex items-center gap-4 p-4 bg-white border-2 border-slate-200 rounded-xl shadow-lg scale-[1.02] transition-all"
            >
                <div className="p-2 text-slate-300 cursor-move" {...attributes} {...listeners}>
                    <GripVertical size={20} />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        placeholder="Nome da etapa"
                        autoFocus
                    />
                    <div className="flex items-center gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c.name}
                                type="button"
                                onClick={() => setEditColor(c.name)}
                                className={`w-6 h-6 rounded-full ${c.bg} ${editColor === c.name ? 'ring-2 ring-offset-2 ring-slate-400' : ''} transition-all`}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onSaveEdit(stage.id, editName, editColor)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                        <Check size={18} />
                    </button>
                    <button
                        onClick={onCancelEdit}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all ${isDragging ? 'shadow-xl rotate-1 opacity-90' : 'shadow-sm'}`}
        >
            <div className="p-2 text-slate-300 cursor-move hover:text-slate-500 transition-colors" {...attributes} {...listeners}>
                <GripVertical size={20} />
            </div>

            <div className={`w-3 h-3 rounded-full bg-${stage.color}-500 flex-shrink-0`} />

            <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-700">{stage.name}</h3>
                {stage.isSystem && <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Sistema</span>}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onEdit(stage.id)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                    <Edit2 size={16} />
                </button>
                {!stage.isSystem && (
                    <button
                        onClick={() => onDelete(stage.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}

const PipelineSettings: React.FC = () => {
    const [selectedPipeline, setSelectedPipeline] = useState('high_ticket');
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('slate');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchStages();
    }, [selectedPipeline]);

    const fetchStages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Assume API returns stages sorted by order
            const response = await fetch(`${import.meta.env.VITE_API_URL}/pipelines/stages?pipeline=${selectedPipeline}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStages(data);
            } else {
                // Fallback to static
                console.warn("API Unavailable: Using static templates");
                setStages(PIPELINE_TEMPLATES[selectedPipeline as keyof typeof PIPELINE_TEMPLATES] as PipelineStage[]);
            }
        } catch (error) {
            console.error('Failed to fetch stages (using static fallback):', error);
            // Fallback to static
            setStages(PIPELINE_TEMPLATES[selectedPipeline as keyof typeof PIPELINE_TEMPLATES] as PipelineStage[]);
            toast.warning('Modo Offline: Usando dados locais temporários');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setStages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Save new order
                saveOrder(newItems);

                return newItems;
            });
        }
    };

    const saveOrder = async (items: PipelineStage[]) => {
        try {
            const token = localStorage.getItem('token');
            const orderUpdates = items.map((stage, index) => ({ id: stage.id, order: index }));

            await fetch(`${import.meta.env.VITE_API_URL}/pipelines/stages/reorder`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ stages: orderUpdates })
            });
        } catch (error) {
            console.error('Failed to save order', error);
            toast.error('Erro ao salvar ordem');
        }
    };

    const handleAddStage = async () => {
        if (!newName.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/pipelines/stages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newName,
                    pipeline: selectedPipeline,
                    color: newColor
                })
            });

            if (response.ok) {
                toast.success('Etapa adicionada');
                setNewName('');
                setIsAdding(false);
                fetchStages();
            }
        } catch (error) {
            toast.error('Erro ao adicionar etapa');
        }
    };

    const handleUpdateStage = async (id: string, name: string, color: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/pipelines/stages/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, color })
            });

            if (response.ok) {
                setEditingId(null);
                fetchStages(); // Refresh to ensure sync
                toast.success('Etapa atualizada');
            }
        } catch (error) {
            toast.error('Erro ao atualizar etapa');
        }
    };

    const handleDeleteStage = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover esta etapa?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/pipelines/stages/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Etapa removida');
                fetchStages();
            } else {
                const err = await response.json();
                toast.error(err.error || 'Erro ao remover etapa');
            }
        } catch (error) {
            toast.error('Erro ao remover etapa');
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Personalização do Pipeline</h2>
                    <p className="text-slate-500 text-sm mt-1">Gerencie as etapas de cada processo comercial</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <GitMerge className="text-slate-400" size={24} />
                </div>
            </header>

            {/* Pipeline Selector */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8 overflow-x-auto no-scrollbar">
                {PIPELINE_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => setSelectedPipeline(type.id)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${selectedPipeline === type.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={stages.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {loading ? (
                            <div className="text-center py-8 text-slate-400">Carregando etapas...</div>
                        ) : (
                            stages.map((stage) => (
                                <SortableItem
                                    key={stage.id}
                                    stage={stage}
                                    isEditing={editingId === stage.id}
                                    onEdit={(id: string) => setEditingId(id)}
                                    onCancelEdit={() => setEditingId(null)}
                                    onSaveEdit={handleUpdateStage}
                                    onDelete={handleDeleteStage}
                                />
                            ))
                        )}
                    </SortableContext>
                </DndContext>

                {/* Add New Stage */}
                {isAdding ? (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl animate-in slide-in-from-left duration-300">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                placeholder="Nome da nova etapa"
                                autoFocus
                            />
                            <div className="flex items-center gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setNewColor(c.name)}
                                        className={`w-6 h-6 rounded-full ${c.bg} ${newColor === c.name ? 'ring-2 ring-offset-2 ring-slate-400' : ''} transition-all`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAddStage}
                                disabled={!newName.trim()}
                                className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
                            >
                                <Check size={18} />
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="p-2 bg-slate-200 text-slate-500 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm uppercase tracking-wider hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Adicionar Etapa
                    </button>
                )}
            </div>
        </div>
    );
};

export default PipelineSettings;
