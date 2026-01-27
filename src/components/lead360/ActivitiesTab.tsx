import React, { useState, useEffect } from 'react';
import {
    Phone, MessageCircle, Mail, Calendar, CheckCircle2, Clock, PlayCircle,
    Plus, MoreVertical, Zap, ChevronDown, Circle, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabaseGetLeadActivities, supabaseCreateActivity, supabaseCompleteActivity, supabaseSkipActivity, Activity } from '../../services/supabaseApi';

interface ActivitiesTabProps {
    leadId: string;
    onActivityComplete?: () => void;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    call: <Phone size={14} className="text-blue-500" />,
    whatsapp: <MessageCircle size={14} className="text-emerald-500" />,
    email: <Mail size={14} className="text-orange-500" />,
    meeting: <Calendar size={14} className="text-violet-500" />,
    task: <CheckCircle2 size={14} className="text-slate-500" />,
    follow_up: <Clock size={14} className="text-amber-500" />,
};

const ACTIVITY_LABELS: Record<string, string> = {
    call: 'Ligação',
    whatsapp: 'WhatsApp',
    email: 'E-mail',
    meeting: 'Reunião',
    task: 'Tarefa',
    follow_up: 'Follow-up',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-50 border-amber-200 text-amber-700',
    completed: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    skipped: 'bg-slate-50 border-slate-200 text-slate-500',
    overdue: 'bg-red-50 border-red-200 text-red-700',
};

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ leadId, onActivityComplete }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [playbooks, setPlaybooks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [showPlaybooks, setShowPlaybooks] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    // New activity form
    const [newActivity, setNewActivity] = useState({
        type: 'call' as Activity['type'],
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        loadData();
    }, [leadId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const activitiesData = await supabaseGetLeadActivities(leadId);
            setActivities(activitiesData);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateActivity = async () => {
        if (!newActivity.title.trim()) {
            toast.error('Título é obrigatório');
            return;
        }

        try {
            const created = await supabaseCreateActivity({
                leadId,
                type: newActivity.type,
                title: newActivity.title,
                description: newActivity.description,
                dueDate: new Date(newActivity.dueDate).toISOString(),
            });
            setActivities(prev => [...prev, created]);
            setShowAddActivity(false);
            setNewActivity({ type: 'call', title: '', description: '', dueDate: new Date().toISOString().split('T')[0] });
            toast.success('Atividade criada!');
        } catch (error) {
            toast.error('Erro ao criar atividade');
        }
    };

    const handleCompleteActivity = async (id: string) => {
        try {
            const updated = await supabaseCompleteActivity(id);
            setActivities(prev => prev.map(a => a.id === id ? updated : a));
            toast.success('Atividade concluída!');
            onActivityComplete?.();
        } catch (error) {
            toast.error('Erro ao concluir atividade');
        }
    };

    const handleSkipActivity = async (id: string) => {
        try {
            const updated = await supabaseSkipActivity(id);
            setActivities(prev => prev.map(a => a.id === id ? updated : a));
            toast.info('Atividade pulada');
        } catch (error) {
            toast.error('Erro ao pular atividade');
        }
    };

    const handleApplyPlaybook = async (playbookId: string) => {
        // TODO: Implement supabaseApplyPlaybook when playbooks are migrated
        toast.info('Playbooks ainda não disponíveis');
        setShowPlaybooks(false);
    };

    const formatDueDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';
        if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`;
        return `Em ${diffDays}d`;
    };

    const getDaysFromNow = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const filteredActivities = activities.filter(a => {
        if (filter === 'pending') return a.status === 'pending' || a.status === 'overdue';
        if (filter === 'completed') return a.status === 'completed' || a.status === 'skipped';
        return true;
    });

    const pendingCount = activities.filter(a => a.status === 'pending').length;
    const overdueCount = activities.filter(a => a.status === 'overdue' || (a.status === 'pending' && getDaysFromNow(a.dueDate) < 0)).length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-slate-800">Próximas Atividades</h3>
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                        </span>
                    )}
                    {overdueCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowPlaybooks(!showPlaybooks)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                            <PlayCircle size={14} />
                            Playbook
                            <ChevronDown size={14} />
                        </button>
                        {showPlaybooks && playbooks.length > 0 && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-10">
                                {playbooks.map(pb => (
                                    <button
                                        key={pb.id}
                                        onClick={() => handleApplyPlaybook(pb.id)}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm"
                                    >
                                        <div className="font-medium text-slate-700">{pb.name}</div>
                                        <div className="text-xs text-slate-500">{pb.templates.length} atividades</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowAddActivity(!showAddActivity)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        <Plus size={14} />
                        Nova Atividade
                    </button>
                </div>
            </div>

            {/* Add Activity Form */}
            {showAddActivity && (
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-600 font-medium block mb-1">Tipo</label>
                            <select
                                value={newActivity.type}
                                onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value as any }))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            >
                                {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key} className="text-slate-800">{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Data</label>
                            <input
                                type="date"
                                value={newActivity.dueDate}
                                onChange={(e) => setNewActivity(prev => ({ ...prev, dueDate: e.target.value }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Título</label>
                        <input
                            type="text"
                            value={newActivity.title}
                            onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Ex: Tentativa de contato 1"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Descrição (opcional)</label>
                        <textarea
                            value={newActivity.description}
                            onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Detalhes da atividade..."
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowAddActivity(false)}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateActivity}
                            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                        >
                            Criar Atividade
                        </button>
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                {(['all', 'pending', 'completed'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Concluídas'}
                    </button>
                ))}
            </div>

            {/* Activities List */}
            <div className="space-y-2">
                {filteredActivities.map(activity => {
                    const daysFromNow = getDaysFromNow(activity.dueDate);
                    const isOverdue = activity.status === 'pending' && daysFromNow < 0;
                    const status = isOverdue ? 'overdue' : activity.status;

                    return (
                        <div
                            key={activity.id}
                            className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${STATUS_COLORS[status] || 'bg-white border-slate-200'
                                }`}
                        >
                            {/* Status indicator */}
                            <div className="flex-shrink-0">
                                {status === 'completed' ? (
                                    <CheckCircle size={20} className="text-emerald-500" />
                                ) : status === 'skipped' ? (
                                    <XCircle size={20} className="text-slate-400" />
                                ) : (
                                    <Circle size={20} className={isOverdue ? 'text-red-400' : 'text-amber-400'} />
                                )}
                            </div>

                            {/* Activity icon and content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {ACTIVITY_ICONS[activity.type]}
                                    <span className="font-medium text-sm text-slate-800">{activity.title}</span>
                                </div>
                                {activity.description && (
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{activity.description}</p>
                                )}
                            </div>

                            {/* Due date */}
                            <div className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                {formatDueDate(activity.dueDate)}
                            </div>

                            {/* Actions */}
                            {activity.status === 'pending' && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleCompleteActivity(activity.id)}
                                        className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
                                        title="Concluir"
                                    >
                                        <CheckCircle2 size={16} className="text-emerald-600" />
                                    </button>
                                    <button
                                        onClick={() => handleSkipActivity(activity.id)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Pular"
                                    >
                                        <XCircle size={16} className="text-slate-400" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredActivities.length === 0 && (
                    <div className="text-center py-8">
                        <Zap size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">
                            {filter === 'pending' ? 'Nenhuma atividade pendente' :
                                filter === 'completed' ? 'Nenhuma atividade concluída' :
                                    'Nenhuma atividade ainda'}
                        </p>
                        <button
                            onClick={() => setShowAddActivity(true)}
                            className="mt-2 text-sm text-violet-600 hover:underline"
                        >
                            Criar primeira atividade
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivitiesTab;
