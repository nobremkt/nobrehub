import React from 'react';
import {
    DollarSign,
    Factory,
    HeartHandshake,
    Layers,
    Globe,
    Instagram,
    MessageCircle,
    Users,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PipelineOption {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    count?: number;
    totalValue?: number;
    children?: { id: string; name: string; count?: number }[];
}

interface SourceFilter {
    id: string;
    name: string;
    icon: React.ReactNode;
    count: number;
}

interface KanbanSidebarProps {
    currentPipeline: 'sales' | 'production' | 'post_sales';
    salesSubPipeline: 'high_ticket' | 'low_ticket';
    onPipelineChange: (pipeline: 'sales' | 'production' | 'post_sales') => void;
    onSubPipelineChange: (sub: 'high_ticket' | 'low_ticket') => void;
    pipelineCounts: {
        high_ticket: number;
        low_ticket: number;
        production: number;
        post_sales: number;
    };
    sourceFilters: { source: string; count: number }[];
    activeSourceFilter: string;
    onSourceFilterChange: (source: string) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value}`;
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
    instagram: <Instagram size={14} />,
    whatsapp: <MessageCircle size={14} />,
    website: <Globe size={14} />,
    indicacao: <Users size={14} />,
    outro: <Sparkles size={14} />,
};

export const KanbanSidebar: React.FC<KanbanSidebarProps> = ({
    currentPipeline,
    salesSubPipeline,
    onPipelineChange,
    onSubPipelineChange,
    pipelineCounts,
    sourceFilters,
    activeSourceFilter,
    onSourceFilterChange,
    isCollapsed = false,
}) => {
    const pipelines: PipelineOption[] = [
        {
            id: 'sales',
            name: 'Vendas',
            icon: <DollarSign size={18} />,
            color: 'rose',
            count: pipelineCounts.high_ticket + pipelineCounts.low_ticket,
            children: [
                { id: 'high_ticket', name: 'High Ticket', count: pipelineCounts.high_ticket },
                { id: 'low_ticket', name: 'Low Ticket', count: pipelineCounts.low_ticket },
            ],
        },
        {
            id: 'production',
            name: 'Produção',
            icon: <Factory size={18} />,
            color: 'blue',
            count: pipelineCounts.production,
        },
        {
            id: 'post_sales',
            name: 'Pós-Venda',
            icon: <HeartHandshake size={18} />,
            color: 'amber',
            count: pipelineCounts.post_sales,
        },
    ];

    const colorClasses: Record<string, { bg: string; text: string; activeBg: string; hoverBg: string }> = {
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', activeBg: 'bg-rose-100', hoverBg: 'hover:bg-rose-50' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', activeBg: 'bg-blue-100', hoverBg: 'hover:bg-blue-50' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-100', hoverBg: 'hover:bg-amber-50' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', activeBg: 'bg-purple-100', hoverBg: 'hover:bg-purple-50' },
    };

    if (isCollapsed) {
        return (
            <aside className="w-16 bg-white border-r border-slate-200 flex flex-col py-6 gap-2">
                {pipelines.map(pipeline => {
                    const isActive = currentPipeline === pipeline.id;
                    const colors = colorClasses[pipeline.color];
                    return (
                        <button
                            key={pipeline.id}
                            onClick={() => onPipelineChange(pipeline.id as any)}
                            className={cn(
                                'mx-2 p-3 rounded-xl transition-all flex items-center justify-center',
                                isActive ? `${colors.activeBg} ${colors.text}` : `text-slate-400 ${colors.hoverBg}`
                            )}
                            title={pipeline.name}
                        >
                            {pipeline.icon}
                        </button>
                    );
                })}
            </aside>
        );
    }

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
            {/* Header */}
            <div className="px-5 py-6 border-b border-slate-100">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pipelines</h2>
            </div>

            {/* Pipeline List */}
            <div className="flex-1 overflow-y-auto py-3">
                <nav className="space-y-1 px-3">
                    {pipelines.map(pipeline => {
                        const isActive = currentPipeline === pipeline.id;
                        const isExpanded = isActive && pipeline.children;
                        const colors = colorClasses[pipeline.color];

                        return (
                            <div key={pipeline.id}>
                                <button
                                    onClick={() => onPipelineChange(pipeline.id as any)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group',
                                        isActive
                                            ? `${colors.activeBg} ${colors.text}`
                                            : `text-slate-600 hover:bg-slate-50`
                                    )}
                                >
                                    <span className={cn(
                                        'p-2 rounded-lg transition-colors',
                                        isActive ? colors.bg : 'bg-slate-100 group-hover:bg-slate-200'
                                    )}>
                                        {pipeline.icon}
                                    </span>
                                    <span className="flex-1 text-left text-sm font-semibold">{pipeline.name}</span>
                                    <span className={cn(
                                        'text-xs font-bold px-2 py-0.5 rounded-full',
                                        isActive ? 'bg-white/50' : 'bg-slate-100 text-slate-500'
                                    )}>
                                        {pipeline.count || 0}
                                    </span>
                                    {pipeline.children && (
                                        <ChevronRight size={14} className={cn(
                                            'transition-transform',
                                            isExpanded && 'rotate-90'
                                        )} />
                                    )}
                                </button>

                                {/* Sub-pipelines (HT/LT) */}
                                {isExpanded && pipeline.children && (
                                    <div className="ml-6 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        {pipeline.children.map(child => {
                                            const isSubActive = salesSubPipeline === child.id;
                                            return (
                                                <button
                                                    key={child.id}
                                                    onClick={() => onSubPipelineChange(child.id as any)}
                                                    className={cn(
                                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                                                        isSubActive
                                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20'
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                    )}
                                                >
                                                    <Layers size={14} />
                                                    <span className="flex-1 text-left font-medium">{child.name}</span>
                                                    <span className={cn(
                                                        'text-xs font-bold px-2 py-0.5 rounded-full',
                                                        isSubActive ? 'bg-white/20' : 'bg-slate-100'
                                                    )}>
                                                        {child.count || 0}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="my-5 mx-5 border-t border-slate-100" />

                {/* Quick Filters: Sources */}
                <div className="px-5">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Filtro por Origem
                    </h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => onSourceFilterChange('')}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                                activeSourceFilter === ''
                                    ? 'bg-slate-100 text-slate-900 font-semibold'
                                    : 'text-slate-500 hover:bg-slate-50'
                            )}
                        >
                            <Globe size={14} />
                            <span className="flex-1 text-left">Todas as origens</span>
                        </button>
                        {sourceFilters.slice(0, 5).map(source => {
                            const isActive = activeSourceFilter === source.source;
                            return (
                                <button
                                    key={source.source}
                                    onClick={() => onSourceFilterChange(source.source)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                                        isActive
                                            ? 'bg-violet-100 text-violet-700 font-semibold'
                                            : 'text-slate-500 hover:bg-slate-50'
                                    )}
                                >
                                    {SOURCE_ICONS[source.source.toLowerCase()] || <Globe size={14} />}
                                    <span className="flex-1 text-left capitalize">{source.source}</span>
                                    <span className="text-xs font-medium text-slate-400">{source.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Total no funil</span>
                    <span className="text-slate-900 font-bold">
                        {pipelineCounts.high_ticket + pipelineCounts.low_ticket + pipelineCounts.production + pipelineCounts.post_sales} leads
                    </span>
                </div>
            </div>
        </aside>
    );
};

export default KanbanSidebar;
