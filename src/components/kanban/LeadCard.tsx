import React, { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MessageSquare, Calendar, MoreHorizontal, Flame, Snowflake, Clock } from 'lucide-react';
import { Lead } from '../../services/api';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { cn } from '../../lib/utils';

interface LeadCardProps {
    lead: Lead;
    onClick: () => void;
    agentName?: string;
    agentAvatar?: string;
}

/**
 * Calculate time since a date in human-readable format
 */
const getTimeInStage = (date: Date | string): { text: string; isUrgent: boolean } => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
        return { text: `${diffDays}d`, isUrgent: true };
    } else if (diffDays >= 2) {
        return { text: `${diffDays}d`, isUrgent: true };
    } else if (diffDays === 1) {
        return { text: '1d', isUrgent: false };
    } else if (diffHours >= 1) {
        return { text: `${diffHours}h`, isUrgent: false };
    } else {
        return { text: 'Agora', isUrgent: false };
    }
};

/**
 * Format currency in BRL
 */
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Determine if lead is "hot" or "cold" based on activity
 */
const getLeadTemperature = (lead: Lead): 'hot' | 'cold' | 'neutral' => {
    const lastActivity = lead.lastMessageAt || lead.updatedAt || lead.createdAt;
    const hoursSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity < 24) return 'hot';
    if (hoursSinceActivity > 72) return 'cold';
    return 'neutral';
};

const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick, agentName, agentAvatar }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: { lead },
    });

    const style: React.CSSProperties = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: 9999,
            position: 'relative',
        }
        : {};

    const timeInStage = useMemo(() => getTimeInStage(lead.statusChangedAt || lead.createdAt), [lead]);
    const temperature = useMemo(() => getLeadTemperature(lead), [lead]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                'group bg-white p-4 rounded-xl border border-slate-200 cursor-grab',
                'hover:border-blue-300 hover:shadow-lg transition-all duration-200',
                'animate-in fade-in slide-in-from-bottom-2 duration-300',
                isDragging && 'opacity-0'
            )}
        >
            {/* Top Row: Company + Value + Temperature */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate max-w-[120px]">
                        {lead.company || 'Sem empresa'}
                    </span>
                    {temperature === 'hot' && (
                        <Flame size={12} className="text-orange-500" />
                    )}
                    {temperature === 'cold' && (
                        <Snowflake size={12} className="text-cyan-500" />
                    )}
                </div>
                {lead.estimatedValue && lead.estimatedValue > 0 && (
                    <Badge variant="success" size="sm">
                        {formatCurrency(lead.estimatedValue)}
                    </Badge>
                )}
            </div>

            {/* Lead Name */}
            <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-3 text-balance">
                {lead.name}
            </h3>

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {lead.tags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                    {lead.tags.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 text-slate-400">
                            +{lead.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Bottom Row: Agent + Time + Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {/* Agent Avatar */}
                <div className="flex items-center gap-2">
                    {(agentName || lead.assignedAgentId) && (
                        <Avatar
                            name={agentName || 'Agente'}
                            src={agentAvatar}
                            size="xs"
                        />
                    )}
                    {/* Time in Stage Badge */}
                    <div className={cn(
                        'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full',
                        timeInStage.isUrgent
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-100 text-slate-500'
                    )}>
                        <Clock size={10} />
                        <span className="font-medium">{timeInStage.text}</span>
                    </div>
                </div>

                {/* Hover Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Open chat
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Abrir chat"
                    >
                        <MessageSquare size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Schedule task
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        aria-label="Agendar tarefa"
                    >
                        <Calendar size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: More options
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Mais opções"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadCard;
