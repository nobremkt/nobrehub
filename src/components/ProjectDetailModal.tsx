/**
 * ProjectDetailModal
 * 
 * Modal for viewing and editing production project details.
 * Shows status, deadline, drive link, checklist, and notes.
 */

import React, { useState, useEffect } from 'react';
import {
    X, Calendar, Link2, Users, FileText, Save, Loader2,
    Clock, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';
import { Project, UpdateProjectData, ProjectStatus, ChecklistItem } from '../types/project';
import { updateProject } from '../services/api/projects';
import ProjectChecklist from './ProjectChecklist';
import { toast } from 'sonner';

interface ProjectDetailModalProps {
    isOpen: boolean;
    project: Project | null;
    onClose: () => void;
    onUpdate?: (project: Project) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: React.ReactNode }> = {
    backlog: { label: 'Backlog', color: 'bg-slate-100 text-slate-600', icon: <Clock size={14} /> },
    doing: { label: 'Em Progresso', color: 'bg-blue-100 text-blue-600', icon: <Loader2 size={14} className="animate-spin" /> },
    review: { label: 'Revisão', color: 'bg-amber-100 text-amber-600', icon: <AlertCircle size={14} /> },
    done: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle2 size={14} /> },
    revision: { label: 'Alteração', color: 'bg-red-100 text-red-600', icon: <AlertCircle size={14} /> }
};

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
    isOpen,
    project,
    onClose,
    onUpdate
}) => {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        driveLink: '',
        deadline: '',
        status: 'backlog' as ProjectStatus,
        notes: '',
        checklist: [] as ChecklistItem[]
    });

    // Initialize form when project changes
    useEffect(() => {
        if (project) {
            setForm({
                name: project.name,
                driveLink: project.driveLink || '',
                deadline: project.deadline ? project.deadline.split('T')[0] : '',
                status: project.status,
                notes: project.notes || '',
                checklist: project.checklist || []
            });
        }
    }, [project]);

    // Check if deadline is overdue
    const isOverdue = form.deadline && new Date(form.deadline) < new Date() && form.status !== 'done';

    // Handle save
    const handleSave = async () => {
        if (!project) return;

        setSaving(true);
        try {
            const data: UpdateProjectData = {
                name: form.name,
                driveLink: form.driveLink || undefined,
                deadline: form.deadline || undefined,
                status: form.status,
                notes: form.notes || undefined,
                checklist: form.checklist
            };

            const updated = await updateProject(project.id, data);
            toast.success('Projeto atualizado!');
            onUpdate?.(updated);
            onClose();
        } catch (error) {
            console.error('Failed to update project:', error);
            toast.error('Erro ao atualizar projeto');
        } finally {
            setSaving(false);
        }
    };

    // Handle checklist change
    const handleChecklistChange = (items: ChecklistItem[]) => {
        setForm(prev => ({ ...prev, checklist: items }));
    };

    if (!isOpen || !project) return null;

    const statusConfig = STATUS_CONFIG[form.status];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-white font-bold text-xl">{project.name}</h2>
                            {project.lead && (
                                <p className="text-white/70 text-sm mt-1">
                                    Lead: {project.lead.name} {project.lead.company && `• ${project.lead.company}`}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status & Deadline Row */}
                    <div className="flex flex-wrap gap-4">
                        {/* Status Select */}
                        <div className="flex-1 min-w-[180px]">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                Status
                            </label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value as ProjectStatus })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                            >
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Deadline */}
                        <div className="flex-1 min-w-[180px]">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Calendar size={14} className="text-slate-400" />
                                Prazo de Entrega
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={form.deadline}
                                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${isOverdue ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                        }`}
                                />
                                {isOverdue && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500 font-medium">
                                        Atrasado!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Drive Link */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Link2 size={14} className="text-slate-400" />
                            Link do Drive
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={form.driveLink}
                                onChange={e => setForm({ ...form, driveLink: e.target.value })}
                                placeholder="https://drive.google.com/..."
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                            />
                            {form.driveLink && (
                                <a
                                    href={form.driveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    Abrir
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Assignee Info */}
                    {project.assignee && (
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                            <Users size={18} className="text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">Responsável</p>
                                <p className="text-sm text-slate-500">{project.assignee.name}</p>
                            </div>
                        </div>
                    )}

                    {/* Checklist */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                            <CheckCircle2 size={14} className="text-slate-400" />
                            Checklist
                        </label>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <ProjectChecklist
                                items={form.checklist}
                                onChange={handleChecklistChange}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <FileText size={14} className="text-slate-400" />
                            Observações
                        </label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            placeholder="Anotações sobre o projeto..."
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Salvar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailModal;
