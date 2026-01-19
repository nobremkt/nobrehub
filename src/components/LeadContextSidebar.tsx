import React, { useState } from 'react';
import { User, Phone, DollarSign, Building2, Tag, ChevronRight, ExternalLink, TrendingUp, Calendar, MessageSquare, ChevronDown, Check } from 'lucide-react';

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

// Stage options by pipeline
const HIGH_TICKET_STAGES = [
    { value: 'novo', label: 'Novo', color: 'bg-slate-100 text-slate-700' },
    { value: 'qualificado', label: 'Qualificado', color: 'bg-blue-100 text-blue-700' },
    { value: 'call_agendada', label: 'Call Agendada', color: 'bg-purple-100 text-purple-700' },
    { value: 'proposta', label: 'Proposta', color: 'bg-amber-100 text-amber-700' },
    { value: 'negociacao', label: 'Negociação', color: 'bg-orange-100 text-orange-700' },
    { value: 'fechado', label: 'Fechado', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-700' },
];

const LOW_TICKET_STAGES = [
    { value: 'novo', label: 'Novo', color: 'bg-slate-100 text-slate-700' },
    { value: 'atribuido', label: 'Atribuído', color: 'bg-blue-100 text-blue-700' },
    { value: 'em_negociacao', label: 'Em Negociação', color: 'bg-orange-100 text-orange-700' },
    { value: 'fechado', label: 'Fechado', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-700' },
];

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
    const [showStageDropdown, setShowStageDropdown] = useState(false);
    const [isChangingStage, setIsChangingStage] = useState(false);

    const currentStatus = pipeline === 'high_ticket' ? lead.statusHT : lead.statusLT;
    const stages = pipeline === 'high_ticket' ? HIGH_TICKET_STAGES : LOW_TICKET_STAGES;
    const currentStageInfo = stages.find(s => s.value === currentStatus) || stages[0];

    const handleStageChange = async (newStage: string) => {
        if (newStage === currentStatus || !onMoveStage) return;

        setIsChangingStage(true);
        try {
            await onMoveStage(newStage);
            setShowStageDropdown(false);
        } finally {
            setIsChangingStage(false);
        }
    };

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

                {/* Status Card - Clickable to change stage */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 relative">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <TrendingUp size={12} />
                        <span>Etapa Atual</span>
                    </div>
                    <button
                        onClick={() => setShowStageDropdown(!showStageDropdown)}
                        disabled={isChangingStage || !onMoveStage}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${currentStageInfo.color} ${onMoveStage ? 'hover:ring-2 hover:ring-offset-1 hover:ring-rose-300 cursor-pointer' : ''}`}
                    >
                        <span className="text-xs font-bold">
                            {isChangingStage ? 'Movendo...' : currentStageInfo.label}
                        </span>
                        {onMoveStage && <ChevronDown size={14} className={`transition-transform ${showStageDropdown ? 'rotate-180' : ''}`} />}
                    </button>

                    {/* Dropdown */}
                    {showStageDropdown && onMoveStage && (
                        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                            {stages.map((stage) => (
                                <button
                                    key={stage.value}
                                    onClick={() => handleStageChange(stage.value)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${currentStatus === stage.value ? 'bg-slate-50' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${stage.color.split(' ')[0]}`} />
                                        <span className="text-sm text-slate-700">{stage.label}</span>
                                    </div>
                                    {currentStatus === stage.value && <Check size={14} className="text-emerald-500" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Phone Card - Clickable to open WhatsApp */}
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <Phone size={12} />
                        <span>Telefone</span>
                    </div>
                    <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors group"
                    >
                        <span>{lead.phone}</span>
                        <ExternalLink size={12} className="text-slate-400 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
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
