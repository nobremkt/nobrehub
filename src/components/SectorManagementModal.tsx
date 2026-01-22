import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Building2, Loader2, Users, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Sector {
    id: string;
    name: string;
    description?: string;
    color: string;
    _count?: {
        users: number;
    };
}

interface SectorManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const PRESET_COLORS = [
    '#f43f5e', // Rose
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#0ea5e9', // Sky
    '#14b8a6', // Teal
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
];

const SectorManagementModal: React.FC<SectorManagementModalProps> = ({ isOpen, onClose, onUpdate }) => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#6366f1'
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const fetchSectors = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/sectors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSectors(data);
            }
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
            toast.error('Erro ao carregar setores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchSectors();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setFormData({ name: '', description: '', color: '#6366f1' });
        setEditingId(null);
        setIsCreating(false);
    };

    const handleEdit = (sector: Sector) => {
        setFormData({
            name: sector.name,
            description: sector.description || '',
            color: sector.color
        });
        setEditingId(sector.id);
        setIsCreating(false);
    };

    const handleCreate = () => {
        resetForm();
        setIsCreating(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Nome do setor é obrigatório');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const url = editingId
                ? `${API_URL}/users/sectors/${editingId}`
                : `${API_URL}/users/sectors`;

            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar setor');
            }

            toast.success(editingId ? 'Setor atualizado!' : 'Setor criado!');
            resetForm();
            fetchSectors();
            onUpdate();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (sector: Sector) => {
        if (sector._count?.users && sector._count.users > 0) {
            toast.error(`Não é possível excluir setor com ${sector._count.users} membro(s) ativo(s)`);
            return;
        }

        if (!confirm(`Deseja excluir o setor "${sector.name}"?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/sectors/${sector.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao excluir setor');
            }

            toast.success('Setor excluído!');
            fetchSectors();
            onUpdate();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
                            <Building2 size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                Gerenciar Setores
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Criar, editar e organizar setores
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-slate-300" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Sectors List */}
                            {sectors.map((sector) => (
                                <div
                                    key={sector.id}
                                    className={`p-4 rounded-2xl border transition-all ${editingId === sector.id
                                        ? 'border-violet-300 bg-violet-50'
                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                        }`}
                                >
                                    {editingId === sector.id ? (
                                        // Edit Form
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="Nome do setor"
                                                    className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Descrição (opcional)"
                                                    className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                                                />
                                            </div>

                                            {/* Color Picker */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cor:</span>
                                                {PRESET_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setFormData({ ...formData, color })}
                                                        className={`w-6 h-6 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'
                                                            }`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={resetForm}
                                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                    Salvar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Display Mode
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: sector.color }}
                                                />
                                                <div>
                                                    <span className="font-bold text-slate-900">{sector.name}</span>
                                                    {sector.description && (
                                                        <p className="text-xs text-slate-400">{sector.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-slate-400 ml-4">
                                                    <Users size={12} />
                                                    <span>{sector._count?.users || 0} membros</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(sector)}
                                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sector)}
                                                    className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Excluir"
                                                    disabled={sector._count?.users && sector._count.users > 0}
                                                >
                                                    <Trash2 size={14} className={
                                                        sector._count?.users && sector._count.users > 0
                                                            ? 'text-slate-200'
                                                            : 'text-red-400'
                                                    } />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Create New Sector Form */}
                            {isCreating && (
                                <div className="p-4 rounded-2xl border border-green-200 bg-green-50 space-y-4">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Nome do novo setor"
                                            className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Descrição (opcional)"
                                            className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                        />
                                    </div>

                                    {/* Color Picker */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cor:</span>
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`w-6 h-6 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={resetForm}
                                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white rounded-xl transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            Criar Setor
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {sectors.length === 0 && !isCreating && (
                                <div className="text-center py-8 text-slate-400">
                                    <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Nenhum setor cadastrado</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                        {sectors.length} setor{sectors.length !== 1 ? 'es' : ''} cadastrado{sectors.length !== 1 ? 's' : ''}
                    </span>
                    {!isCreating && !editingId && (
                        <button
                            onClick={handleCreate}
                            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-violet-600/20"
                        >
                            <Plus size={14} />
                            Novo Setor
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SectorManagementModal;
