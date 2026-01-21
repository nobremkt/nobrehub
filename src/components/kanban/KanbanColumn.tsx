import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KanbanColumnProps {
    id: string;
    name: string;
    color: string;
    count: number;
    totalValue?: number;
    children: React.ReactNode;
    onAddLead: () => void;
    actionButtons?: React.ReactNode;
    editorPanel?: React.ReactNode;
}

/**
 * Format currency in BRL, compact
 */
const formatCompactValue = (value: number): string => {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Get Tailwind color classes for the column
 */
const getColorClasses = (color: string) => {
    const colorMap: Record<string, { dot: string; headerBg: string }> = {
        slate: { dot: 'bg-slate-500', headerBg: 'bg-slate-50' },
        amber: { dot: 'bg-amber-500', headerBg: 'bg-amber-50' },
        blue: { dot: 'bg-blue-500', headerBg: 'bg-blue-50' },
        purple: { dot: 'bg-purple-500', headerBg: 'bg-purple-50' },
        orange: { dot: 'bg-orange-500', headerBg: 'bg-orange-50' },
        emerald: { dot: 'bg-emerald-500', headerBg: 'bg-emerald-50' },
        rose: { dot: 'bg-rose-500', headerBg: 'bg-rose-50' },
        indigo: { dot: 'bg-indigo-500', headerBg: 'bg-indigo-50' },
    };
    return colorMap[color] || colorMap.slate;
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
    id,
    name,
    color,
    count,
    totalValue,
    children,
    onAddLead,
    actionButtons,
    editorPanel,
}) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const colorClasses = getColorClasses(color);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'min-w-[300px] w-[300px] flex flex-col h-full relative',
                isOver && 'bg-blue-50/50 rounded-2xl'
            )}
        >
            {/* Column Header */}
            <div className={cn(
                'flex items-center justify-between px-3 py-3 rounded-xl mb-4 bg-white border border-slate-100'
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full shadow-sm', colorClasses.dot)} />
                    <h2 className="text-sm font-semibold text-slate-800 text-balance">{name}</h2>
                    <span className="text-xs font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-full">
                        {count}
                    </span>
                </div>

                {/* Value Total */}
                {totalValue !== undefined && totalValue > 0 && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        {formatCompactValue(totalValue)}
                    </span>
                )}

                {/* Action Buttons */}
                {actionButtons && (
                    <div className="flex items-center gap-1 ml-2">
                        {actionButtons}
                    </div>
                )}
            </div>

            {/* Editor Panel (when editing stage) */}
            {editorPanel}

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-20 px-1">
                {children}

                {/* Add Card Button */}
                <button
                    onClick={onAddLead}
                    className={cn(
                        'w-full py-4 border-2 border-dashed border-slate-200 rounded-xl',
                        'flex items-center justify-center gap-2 text-slate-400',
                        'hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50',
                        'transition-all duration-200'
                    )}
                >
                    <Plus size={18} />
                    <span className="text-xs font-medium">Adicionar Lead</span>
                </button>
            </div>
        </div>
    );
};

export default KanbanColumn;
