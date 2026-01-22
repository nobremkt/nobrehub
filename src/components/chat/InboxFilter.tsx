import React, { useState, useEffect } from 'react';
import { X, Filter, Check, ChevronDown, Tag, Trophy, ListFilter } from 'lucide-react';
import * as api from '../../services/api';

export interface InboxFilters {
    pipeline: 'all' | 'high_ticket' | 'low_ticket';
    stage: string | null;
    tags: string[];
    channel: 'all' | 'whatsapp' | 'instagram';
}

interface InboxFilterProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: InboxFilters;
    onApply: (filters: InboxFilters) => void;
}

// Copied from CRMSidebar for consistency
const STAGES = {
    high_ticket: [
        { value: 'novo', label: 'Novo' },
        { value: 'qualificado', label: 'Qualificado' },
        { value: 'call_agendada', label: 'Call Agendada' },
        { value: 'proposta', label: 'Proposta' },
        { value: 'negociacao', label: 'Negociação' },
        { value: 'fechado', label: 'Fechado' },
        { value: 'perdido', label: 'Perdido' },
    ],
    low_ticket: [
        { value: 'novo', label: 'Novo' },
        { value: 'atribuido', label: 'Atribuído' },
        { value: 'em_negociacao', label: 'Em Negociação' },
        { value: 'fechado', label: 'Fechado' },
        { value: 'perdido', label: 'Perdido' },
    ]
};

const CHANNELS = [
    { value: 'all', label: 'Todos os Canais' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' }
];

const InboxFilter: React.FC<InboxFilterProps> = ({
    isOpen,
    onClose,
    currentFilters,
    onApply
}) => {
    const [localFilters, setLocalFilters] = useState<InboxFilters>(currentFilters);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(currentFilters);
            loadTags();
        }
    }, [isOpen, currentFilters]);

    const loadTags = async () => {
        setIsLoadingTags(true);
        try {
            const tags = await api.getAllTags();
            setAvailableTags(tags);
        } catch (error) {
            console.error('Failed to load tags', error);
        } finally {
            setIsLoadingTags(false);
        }
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleClear = () => {
        const cleared: InboxFilters = {
            pipeline: 'all',
            stage: null,
            tags: [],
            channel: 'all'
        };
        setLocalFilters(cleared);
        onApply(cleared);
        onClose();
    };

    const toggleTag = (tag: string) => {
        setLocalFilters(prev => {
            const newTags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];
            return { ...prev, tags: newTags };
        });
    };

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-20 border-l border-slate-200 animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-800">
                    <ListFilter size={20} className="text-violet-600" />
                    <h3 className="font-bold">Filtros Avançados</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Pipeline Section */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Trophy size={14} /> Pipeline
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { value: 'all', label: 'Todos os Pipelines' },
                            { value: 'high_ticket', label: 'High Ticket' },
                            { value: 'low_ticket', label: 'Low Ticket' }
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setLocalFilters(prev => ({
                                    ...prev,
                                    pipeline: option.value as any,
                                    stage: null // Reset stage when pipeline changes
                                }))}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border transition-all ${localFilters.pipeline === option.value
                                        ? 'bg-violet-50 border-violet-200 text-violet-700 font-medium'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-slate-50'
                                    }`}
                            >
                                {option.label}
                                {localFilters.pipeline === option.value && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stage Section (only if specific pipeline selected) */}
                {localFilters.pipeline !== 'all' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ListFilter size={14} /> Etapa ({localFilters.pipeline === 'high_ticket' ? 'HT' : 'LT'})
                        </label>
                        <select
                            value={localFilters.stage || ''}
                            onChange={(e) => setLocalFilters(prev => ({ ...prev, stage: e.target.value || null }))}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                            <option value="">Todas as etapas</option>
                            {localFilters.pipeline === 'high_ticket'
                                ? STAGES.high_ticket.map(s => <option key={s.value} value={s.value}>{s.label}</option>)
                                : STAGES.low_ticket.map(s => <option key={s.value} value={s.value}>{s.label}</option>)
                            }
                        </select>
                    </div>
                )}

                {/* Tags Section */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Tag size={14} /> Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {isLoadingTags ? (
                            <span className="text-xs text-slate-400">Carregando tags...</span>
                        ) : availableTags.length === 0 ? (
                            <span className="text-xs text-slate-400">Nenhuma tag disponível</span>
                        ) : (
                            availableTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${localFilters.tags.includes(tag)
                                            ? 'bg-violet-100 border-violet-200 text-violet-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Channels Section */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ChevronDown size={14} /> Canal
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {CHANNELS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setLocalFilters(prev => ({
                                    ...prev,
                                    channel: option.value as any
                                }))}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border transition-all ${localFilters.channel === option.value
                                        ? 'bg-violet-50 border-violet-200 text-violet-700 font-medium'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-slate-50'
                                    }`}
                            >
                                {option.label}
                                {localFilters.channel === option.value && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
                <button
                    onClick={handleApply}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-[0.98]"
                >
                    Aplicar Filtros
                </button>
                <button
                    onClick={handleClear}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                    Limpar Filtros
                </button>
            </div>
        </div>
    );
};

export default InboxFilter;
