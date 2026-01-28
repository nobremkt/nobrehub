import React, { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
    MessageSquare, Calendar, MoreHorizontal, Flame, Snowflake, Clock,
    Phone, Mail, CheckCircle2, AlertTriangle, ShoppingCart, CreditCard,
    MessageCircle, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { Lead } from '../../services/supabaseApi';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { cn } from '../../lib/utils';

interface LeadCardProps {
    lead: Lead;
    onClick: () => void;
    onOpenChat?: (lead: Lead) => void;
    onSchedule?: (lead: Lead) => void;
    onMoreOptions?: (lead: Lead) => void;
    agentName?: string;
    agentAvatar?: string;
}

// Source/Origin badge colors
const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
    whatsapp: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    instagram: { bg: 'bg-pink-100', text: 'text-pink-700' },
    facebook: { bg: 'bg-blue-100', text: 'text-blue-700' },
    google_ads: { bg: 'bg-red-100', text: 'text-red-700' },
    website: { bg: 'bg-violet-100', text: 'text-violet-700' },
    indicacao: { bg: 'bg-amber-100', text: 'text-amber-700' },
    outro: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

// Special tag styles
const SPECIAL_TAGS: Record<string, { bg: string; text: string; icon?: React.ReactNode }> = {
    'compra aprovada': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={10} /> },
    'cartão recusado': { bg: 'bg-red-100', text: 'text-red-700', icon: <CreditCard size={10} /> },
    'abandono': { bg: 'bg-amber-100', text: 'text-amber-700', icon: <ShoppingCart size={10} /> },
    'urgente': { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertTriangle size={10} /> },
};

/**
 * Calculate time since a date with urgency levels
 */
const getTimeInStage = (date: Date | string): { text: string; urgency: 'ok' | 'warning' | 'danger' | 'critical' } => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 3) {
        return { text: `${diffDays}d`, urgency: 'critical' };
    } else if (diffDays >= 1) {
        return { text: `${diffDays}d`, urgency: 'danger' };
    } else if (diffHours >= 6) {
        return { text: `${diffHours}h`, urgency: 'warning' };
    } else if (diffHours >= 1) {
        return { text: `${diffHours}h`, urgency: 'ok' };
    } else {
        return { text: 'Agora', urgency: 'ok' };
    }
};

const URGENCY_STYLES: Record<string, string> = {
    ok: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
    critical: 'bg-red-200 text-red-700 animate-pulse',
};

/**
 * Format currency in BRL
 */
const formatCurrency = (value: number): string => {
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
 * Determine if lead is "hot" or "cold" based on activity
 */
const getLeadTemperature = (lead: Lead): 'hot' | 'cold' | 'neutral' => {
    const lastActivity = lead.lastMessageAt || lead.updatedAt || lead.createdAt;
    const hoursSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity < 24) return 'hot';
    if (hoursSinceActivity > 72) return 'cold';
    return 'neutral';
};

/**
 * Get source label for display
 */
const getSourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
        whatsapp: 'WhatsApp',
        instagram: 'Instagram',
        facebook: 'Facebook',
        google_ads: 'Google Ads',
        website: 'Website',
        indicacao: 'Indicação',
        outro: 'Outro',
    };
    return labels[source] || source;
};

const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick, onOpenChat, onSchedule, onMoreOptions, agentName, agentAvatar }) => {
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
    const sourceStyle = SOURCE_COLORS[lead.source || 'outro'] || SOURCE_COLORS.outro;

    // Parse tags for special styling
    const { specialTags, normalTags } = useMemo(() => {
        const tags = lead.tags || [];
        const special: { tag: string; style: typeof SPECIAL_TAGS[string] }[] = [];
        const normal: string[] = [];

        tags.forEach(tag => {
            const lowerTag = tag.toLowerCase();
            if (SPECIAL_TAGS[lowerTag]) {
                special.push({ tag, style: SPECIAL_TAGS[lowerTag] });
            } else {
                normal.push(tag);
            }
        });

        return { specialTags: special, normalTags: normal };
    }, [lead.tags]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                'group bg-white p-4 rounded-xl border cursor-grab',
                'hover:shadow-lg transition-all duration-200',
                'animate-in fade-in slide-in-from-bottom-2 duration-300',
                // Urgency border colors
                timeInStage.urgency === 'critical' ? 'border-red-300 border-l-4 border-l-red-500' :
                    timeInStage.urgency === 'danger' ? 'border-red-200 border-l-4 border-l-red-400' :
                        timeInStage.urgency === 'warning' ? 'border-amber-200 border-l-4 border-l-amber-400' :
                            'border-slate-200 hover:border-blue-300',
                isDragging && 'opacity-0'
            )}
        >
            {/* Top Row: Source Badges + Value */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1 flex-wrap">
                    {/* Source Badge */}
                    <span className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full',
                        sourceStyle.bg, sourceStyle.text
                    )}>
                        {getSourceLabel(lead.source || 'outro')}
                    </span>
                    {/* Temperature */}
                    {temperature === 'hot' && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 flex items-center gap-0.5">
                            <Flame size={10} />
                            Hot
                        </span>
                    )}
                    {temperature === 'cold' && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-600 flex items-center gap-0.5">
                            <Snowflake size={10} />
                            Frio
                        </span>
                    )}
                </div>
                {/* Value Badge */}
                {lead.estimatedValue && lead.estimatedValue > 0 && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        {formatCurrency(lead.estimatedValue)}
                    </span>
                )}
            </div>

            {/* Lead Name with Avatar */}
            <div className="flex items-center gap-2 mb-2">
                <Avatar name={lead.name} size="sm" />
                <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">
                    {lead.name}
                </h3>
            </div>

            {/* Last Message Preview */}
            {lead.lastMessage && (
                <div className="flex items-start gap-1.5 mb-2 p-2 bg-slate-50 rounded-lg">
                    {lead.lastMessageFrom === 'in' ? (
                        <ArrowDownRight size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    ) : (
                        <ArrowUpRight size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-xs text-slate-600 line-clamp-2">
                        {lead.lastMessage}
                    </p>
                </div>
            )}

            {/* Special Tags (styled) */}
            {specialTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {specialTags.map(({ tag, style }, i) => (
                        <span
                            key={i}
                            className={cn(
                                'text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5',
                                style.bg, style.text
                            )}
                        >
                            {style.icon}
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Normal Tags */}
            {normalTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {normalTags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                    {normalTags.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 text-slate-400">
                            +{normalTags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Bottom Row: Agent + Time + Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {/* Agent + Time */}
                <div className="flex items-center gap-2">
                    {(agentName || lead.assignedAgentId) && (
                        <Avatar
                            name={agentName || 'Agente'}
                            src={agentAvatar}
                            size="xs"
                        />
                    )}
                    {/* Time in Stage Badge with urgency */}
                    <div className={cn(
                        'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium',
                        URGENCY_STYLES[timeInStage.urgency]
                    )}>
                        <Clock size={10} />
                        <span>{timeInStage.text}</span>
                    </div>
                </div>

                {/* Hover Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat?.(lead);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        aria-label="Abrir chat"
                        title="Abrir conversa"
                    >
                        <MessageCircle size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSchedule?.(lead);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        aria-label="Agendar tarefa"
                        title="Agendar tarefa"
                    >
                        <Calendar size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoreOptions?.(lead);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Mais opções"
                        title="Mais opções"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadCard;
