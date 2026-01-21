import React from 'react';
import {
    X, Filter, MessageCircle, Briefcase, User, Radio,
    ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdvancedFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: AdvancedFilterState;
    onFiltersChange: (filters: AdvancedFilterState) => void;
    availableTags?: string[];
    availableAgents?: { id: string; name: string }[];
}

export interface AdvancedFilterState {
    // Conversas
    conversations: {
        status: 'all' | 'active' | 'on_hold' | 'queued' | 'closed';
        assignment: 'all' | 'mine' | 'unassigned' | 'other';
        window24h: 'all' | 'inside' | 'outside';
        response: 'all' | 'awaiting' | 'responded';
    };
    // Negócios
    deals: {
        hasDeal: 'all' | 'with_deal' | 'without_deal';
        stage: string; // 'all' or specific stage
        dealOwner: string; // 'all' or user id
    };
    // Contatos
    contacts: {
        tags: string[];
        source: 'all' | 'whatsapp' | 'instagram' | 'facebook' | 'website' | 'indicacao';
    };
    // Canais
    channels: {
        channel: 'all' | 'whatsapp' | 'instagram' | 'email';
    };
}

export const defaultFilters: AdvancedFilterState = {
    conversations: {
        status: 'all',
        assignment: 'all',
        window24h: 'all',
        response: 'all',
    },
    deals: {
        hasDeal: 'all',
        stage: 'all',
        dealOwner: 'all',
    },
    contacts: {
        tags: [],
        source: 'all',
    },
    channels: {
        channel: 'all',
    },
};

const STAGES = [
    { value: 'all', label: 'Todas' },
    { value: 'novo', label: 'Novo' },
    { value: 'qualificado', label: 'Qualificado' },
    { value: 'call_agendada', label: 'Call Agendada' },
    { value: 'proposta', label: 'Proposta' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'fechado', label: 'Fechado' },
];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    isOpen,
    onClose,
    filters,
    onFiltersChange,
    availableTags = [],
    availableAgents = [],
}) => {
    const [expandedSections, setExpandedSections] = React.useState({
        conversations: true,
        deals: false,
        contacts: false,
        channels: false,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const updateConversations = (key: keyof typeof filters.conversations, value: any) => {
        onFiltersChange({
            ...filters,
            conversations: { ...filters.conversations, [key]: value },
        });
    };

    const updateDeals = (key: keyof typeof filters.deals, value: any) => {
        onFiltersChange({
            ...filters,
            deals: { ...filters.deals, [key]: value },
        });
    };

    const updateContacts = (key: keyof typeof filters.contacts, value: any) => {
        onFiltersChange({
            ...filters,
            contacts: { ...filters.contacts, [key]: value },
        });
    };

    const updateChannels = (key: keyof typeof filters.channels, value: any) => {
        onFiltersChange({
            ...filters,
            channels: { ...filters.channels, [key]: value },
        });
    };

    const toggleTag = (tag: string) => {
        const current = filters.contacts.tags;
        const newTags = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];
        updateContacts('tags', newTags);
    };

    const countActiveFilters = (): number => {
        let count = 0;
        // Conversations
        if (filters.conversations.status !== 'all') count++;
        if (filters.conversations.assignment !== 'all') count++;
        if (filters.conversations.window24h !== 'all') count++;
        if (filters.conversations.response !== 'all') count++;
        // Deals
        if (filters.deals.hasDeal !== 'all') count++;
        if (filters.deals.stage !== 'all') count++;
        if (filters.deals.dealOwner !== 'all') count++;
        // Contacts
        if (filters.contacts.tags.length > 0) count++;
        if (filters.contacts.source !== 'all') count++;
        // Channels
        if (filters.channels.channel !== 'all') count++;
        return count;
    };

    const clearAllFilters = () => {
        onFiltersChange(defaultFilters);
    };

    const activeCount = countActiveFilters();

    if (!isOpen) return null;

    return (
        <div className="absolute left-full top-0 ml-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-violet-600" />
                    <h3 className="font-semibold text-slate-800">Filtros Avançados</h3>
                    {activeCount > 0 && (
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                            {activeCount}
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
                    <X size={18} className="text-slate-400" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Conversas Section */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('conversations')}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100"
                    >
                        <div className="flex items-center gap-2">
                            <MessageCircle size={16} className="text-blue-500" />
                            <span className="font-medium text-sm text-slate-700">Conversas</span>
                        </div>
                        {expandedSections.conversations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.conversations && (
                        <div className="p-3 space-y-3 bg-white">
                            {/* Status */}
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Status</label>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { value: 'all', label: 'Todos' },
                                        { value: 'active', label: 'Ativos' },
                                        { value: 'on_hold', label: 'Em espera' },
                                        { value: 'queued', label: 'Na fila' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateConversations('status', opt.value)}
                                            className={cn(
                                                'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                                filters.conversations.status === opt.value
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Assignment */}
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Atribuição</label>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { value: 'all', label: 'Todas' },
                                        { value: 'mine', label: 'Minhas' },
                                        { value: 'unassigned', label: 'Não atribuídas' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateConversations('assignment', opt.value)}
                                            className={cn(
                                                'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                                filters.conversations.assignment === opt.value
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Response */}
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Resposta</label>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { value: 'all', label: 'Todas' },
                                        { value: 'awaiting', label: 'Aguardando' },
                                        { value: 'responded', label: 'Respondido' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateConversations('response', opt.value)}
                                            className={cn(
                                                'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                                filters.conversations.response === opt.value
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* 24h Window */}
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Janela 24h</label>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { value: 'all', label: 'Todas' },
                                        { value: 'inside', label: 'Dentro' },
                                        { value: 'outside', label: 'Fora' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateConversations('window24h', opt.value)}
                                            className={cn(
                                                'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                                filters.conversations.window24h === opt.value
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Negócios Section */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('deals')}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100"
                    >
                        <div className="flex items-center gap-2">
                            <Briefcase size={16} className="text-emerald-500" />
                            <span className="font-medium text-sm text-slate-700">Negócios</span>
                        </div>
                        {expandedSections.deals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.deals && (
                        <div className="p-3 space-y-3 bg-white">
                            {/* Has Deal */}
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Negócio</label>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { value: 'all', label: 'Todos' },
                                        { value: 'with_deal', label: 'Com negócio' },
                                        { value: 'without_deal', label: 'Sem negócio' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateDeals('hasDeal', opt.value)}
                                            className={cn(
                                                'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                                filters.deals.hasDeal === opt.value
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Stage */}
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Etapa</label>
                                <select
                                    value={filters.deals.stage}
                                    onChange={(e) => updateDeals('stage', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
                                >
                                    {STAGES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contatos Section */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('contacts')}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100"
                    >
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-violet-500" />
                            <span className="font-medium text-sm text-slate-700">Contatos</span>
                        </div>
                        {expandedSections.contacts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.contacts && (
                        <div className="p-3 space-y-3 bg-white">
                            {/* Source */}
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Origem</label>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { value: 'all', label: 'Todas' },
                                        { value: 'whatsapp', label: 'WhatsApp' },
                                        { value: 'instagram', label: 'Instagram' },
                                        { value: 'website', label: 'Website' },
                                        { value: 'indicacao', label: 'Indicação' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateContacts('source', opt.value)}
                                            className={cn(
                                                'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                                filters.contacts.source === opt.value
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Tags */}
                            {availableTags.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Tags</label>
                                    <div className="flex flex-wrap gap-1">
                                        {availableTags.slice(0, 10).map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={cn(
                                                    'px-2 py-1 text-[11px] rounded-full font-medium transition-colors flex items-center gap-1',
                                                    filters.contacts.tags.includes(tag)
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                )}
                                            >
                                                <Tag size={10} />
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Canais Section */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('channels')}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100"
                    >
                        <div className="flex items-center gap-2">
                            <Radio size={16} className="text-amber-500" />
                            <span className="font-medium text-sm text-slate-700">Canais</span>
                        </div>
                        {expandedSections.channels ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.channels && (
                        <div className="p-3 bg-white">
                            <div className="flex flex-wrap gap-1">
                                {[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'whatsapp', label: 'WhatsApp' },
                                    { value: 'instagram', label: 'Instagram' },
                                    { value: 'email', label: 'E-mail' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => updateChannels('channel', opt.value)}
                                        className={cn(
                                            'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                            filters.channels.channel === opt.value
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            {activeCount > 0 && (
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={clearAllFilters}
                        className="w-full py-2 text-sm text-violet-600 hover:text-violet-700 font-medium hover:bg-violet-50 rounded-lg transition-colors"
                    >
                        Limpar todos os filtros
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdvancedFilters;
