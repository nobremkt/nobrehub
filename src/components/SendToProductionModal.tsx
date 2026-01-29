/**
 * SendToProductionModal
 * 
 * Modal for sending a closed lead to production.
 * Creates a new Project linked to the original Lead.
 */

import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, Link, Users, FileText, Loader2 } from 'lucide-react';
import { Lead } from '../services/api';
import { CreateProjectData } from '../types/project';
import { createProject } from '../services/api/projects';
import { supabaseGetUsers } from '../services/api/users';
import { toast } from 'sonner';

interface SendToProductionModalProps {
    isOpen: boolean;
    lead: Lead;
    onClose: () => void;
    onSuccess?: () => void;
}

interface ProductionUser {
    id: string;
    name: string;
    role: string;
}

const SendToProductionModal: React.FC<SendToProductionModalProps> = ({
    isOpen,
    lead,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<ProductionUser[]>([]);
    const [form, setForm] = useState({
        name: '',
        driveLink: '',
        deadline: '',
        assignedTo: '',
        notes: ''
    });

    // Initialize form with lead name when modal opens
    useEffect(() => {
        if (isOpen && lead) {
            setForm(prev => ({
                ...prev,
                name: lead.company ? `${lead.company} - ${lead.name}` : lead.name
            }));
        }
    }, [isOpen, lead]);

    // Fetch production users
    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        try {
            const allUsers = await supabaseGetUsers();
            // Filter only production roles
            const productionUsers = allUsers.filter(u =>
                ['production', 'manager_production'].includes(u.role || '')
            );
            setUsers(productionUsers as ProductionUser[]);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error('Nome do projeto é obrigatório');
            return;
        }

        setLoading(true);
        try {
            const projectData: CreateProjectData = {
                name: form.name.trim(),
                leadId: lead.id,
                driveLink: form.driveLink || undefined,
                deadline: form.deadline || undefined,
                assignedTo: form.assignedTo || undefined,
                notes: form.notes || undefined
            };

            await createProject(projectData);

            toast.success('Projeto enviado para produção!');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to create project:', error);
            toast.error('Erro ao enviar para produção');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Send size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">Enviar para Produção</h2>
                                <p className="text-white/70 text-sm">Lead: {lead.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Project Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <FileText size={14} className="text-slate-400" />
                            Nome do Projeto
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Vídeo Institucional - Empresa X"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    {/* Drive Link */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Link size={14} className="text-slate-400" />
                            Link do Drive (opcional)
                        </label>
                        <input
                            type="url"
                            value={form.driveLink}
                            onChange={e => setForm({ ...form, driveLink: e.target.value })}
                            placeholder="https://drive.google.com/..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Calendar size={14} className="text-slate-400" />
                            Data de Entrega (opcional)
                        </label>
                        <input
                            type="date"
                            value={form.deadline}
                            onChange={e => setForm({ ...form, deadline: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Users size={14} className="text-slate-400" />
                            Responsável na Produção (opcional)
                        </label>
                        <select
                            value={form.assignedTo}
                            onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="">Selecionar depois</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            Observações (opcional)
                        </label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            placeholder="Detalhes importantes para a produção..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Enviar para Produção
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendToProductionModal;
