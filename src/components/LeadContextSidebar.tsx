import React, { useState } from 'react';
import { User, Phone, DollarSign, Building2, Tag, ChevronRight, ExternalLink, TrendingUp, Calendar, MessageSquare } from 'lucide-react';

interface Lead {
    id: string;
    name: string;
    phone: string;
    company?: string;
    estimatedValue: number;
    tags?: string[];
    statusHT?: string;
    statusLT?: string;
    pipeline?: string;
    createdAt?: string;
    notes?: string;
}

interface LeadContextSidebarProps {
    lead: Lead;
    pipeline: string;
    onOpenDetails: () => void;
    onMoveStage?: (newStage: string) => void;
}

const formatCurrency = (value: number | undefined) => {
    if (!value) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
    }).format(value);
};

const getStatusLabel = (status: string | undefined) => {
    const labels: Record<string, string> = {
        novo: 'Novo',
        qualificado: 'Qualificado',
        call_agendada: 'Call Agendada',
        proposta: 'Proposta',
        negociacao: 'Negociação',
        fechado: 'Fechado',
        perdido: 'Perdido',
        atribuido: 'Atribuído',
        em_negociacao: 'Em Negociação'
    };
    return labels[status || ''] || status || '-';
};

const LeadContextSidebar: React.FC<LeadContextSidebarProps> = ({
    lead,
    pipeline,
    onOpenDetails,
    onMoveStage
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const currentStatus = pipeline === 'high_ticket' ? lead.statusHT : lead.statusLT;

    if (isCollapsed) {
        return (
            <div className="w-12 bg-slate-50 border-l border-slate-200 flex flex-col items-center py-4">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Expandir painel"
                >
                    <ChevronRight size={20} className="text-slate-500 rotate-180" />
                </button>
                <div className="mt-4 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <User size={14} className="text-rose-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-sm">Contexto do Lead</h3>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Recolher painel"
                    >
                        <ChevronRight size={16} className="text-slate-400" />
                    </button>
                </div>

                {/* Lead Avatar & Name */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                        <User size={20} className="text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{lead.name}</p>
                        {lead.company && (
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                <Building2 size={10} />
                                {lead.company}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Info Cards */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {/* Value Card */}
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <DollarSign size={12} />
                        <span>Valor Estimado</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(lead.estimatedValue)}
                    </p>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <TrendingUp size={12} />
                        <span>Etapa Atual</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg">
                            {getStatusLabel(currentStatus)}
                        </span>
                    </div>
                </div>

                {/* Phone Card */}
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <Phone size={12} />
                        <span>Telefone</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{lead.phone}</p>
                </div>

                {/* Tags */}
                {lead.tags && lead.tags.length > 0 && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <Tag size={12} />
                            <span>Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {lead.tags.map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes Preview */}
                {lead.notes && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <MessageSquare size={12} />
                            <span>Notas</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3">{lead.notes}</p>
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <button
                    onClick={onOpenDetails}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
                >
                    <ExternalLink size={16} />
                    Ver Detalhes Completos
                </button>
            </div>
        </div>
    );
};

export default LeadContextSidebar;
