import React from 'react';
import { X, Phone, Mail, Briefcase, DollarSign, Calendar, MessageCircle, Edit2, Trash2, Target, Globe, User } from 'lucide-react';
import { Lead } from '../services/supabaseApi';

interface LeadDetailModalProps {
    isOpen: boolean;
    lead: Lead | null;
    onClose: () => void;
    onEdit: (lead: Lead) => void;
    onDelete: (id: string) => void;
    onOpenChat: (lead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
    isOpen,
    lead,
    onClose,
    onEdit,
    onDelete,
    onOpenChat,
}) => {
    if (!isOpen || !lead) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatPhone = (phone: string | undefined) => {
        if (!phone) return '-';
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
        } else if (digits.length === 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        } else if (digits.length === 13) {
            return `(${digits.slice(2, 4)}) ${digits.slice(4, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`;
        }
        return phone;
    };

    const getPipelineLabel = (pipeline?: string) => {
        if (pipeline === 'high_ticket') return 'High Ticket';
        if (pipeline === 'low_ticket') return 'Low Ticket';
        return 'Não Definido';
    };

    const getPipelineColor = (pipeline?: string) => {
        if (pipeline === 'high_ticket') return 'bg-purple-100 text-purple-700 border-purple-200';
        if (pipeline === 'low_ticket') return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-slate-100 text-slate-500 border-slate-200';
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center">
                            <User size={24} className="text-rose-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{lead.name}</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{lead.company || 'Sem Empresa'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-600 transition-all">
                        <X size={20} />
                    </button>
                </header>

                {/* Quick Actions */}
                <div className="px-8 py-4 bg-slate-50/30 border-b border-slate-100 flex items-center gap-3">
                    <button
                        onClick={() => onOpenChat(lead)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                    >
                        <MessageCircle size={16} /> Abrir Conversa
                    </button>
                    <button
                        onClick={() => onEdit(lead)}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                    >
                        <Edit2 size={16} /> Editar
                    </button>
                    <button
                        onClick={() => { onDelete(lead.id); onClose(); }}
                        className="flex items-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-700 px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                    >
                        <Trash2 size={16} /> Excluir
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Status & Pipeline Row */}
                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPipelineColor(lead.pipeline)}`}>
                            {getPipelineLabel(lead.pipeline)}
                        </span>
                        <span className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {lead.statusHT || lead.statusLT || 'Novo'}
                        </span>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Phone size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Telefone</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{formatPhone(lead.phone)}</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Mail size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{lead.email || '-'}</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <DollarSign size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Valor Estimado</span>
                            </div>
                            <p className="text-lg font-black text-emerald-600">{formatCurrency(lead.estimatedValue || 0)}</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Globe size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Origem</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{lead.source || 'Desconhecida'}</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Data de Criação</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{formatDate(lead.createdAt)}</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Target size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Última Atualização</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{formatDate(lead.updatedAt || lead.createdAt)}</p>
                        </div>
                    </div>

                    {/* Notes Section (Placeholder) */}
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Briefcase size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Observações</span>
                        </div>
                        <p className="text-sm text-slate-500 italic">Nenhuma observação registrada.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetailModal;
