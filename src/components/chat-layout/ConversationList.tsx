import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Search, Phone, Building, User, ChevronRight, Inbox as InboxIcon, Filter, ChevronDown, Clock, Check } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { cn } from '../../lib/utils';
import Avatar from '../ui/Avatar';

interface Conversation {
    id: string;
    status: 'queued' | 'active' | 'on_hold' | 'closed';
    pipeline: string;
    lastMessageAt: string | null;
    unreadCount?: number;
    lead: {
        id: string;
        name: string;
        phone: string;
        company?: string;
        estimatedValue: number;
    };
    assignedAgent?: { id: string; name: string };
    messages: Array<{ text?: string; createdAt: string; direction?: 'in' | 'out' }>;
}

interface ConversationListProps {
    userId: string;
    isAdmin?: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
    conversations: Conversation[];
    isLoading: boolean;
    activeTab: 'mine' | 'queue';
    onTabChange: (tab: 'mine' | 'queue') => void;
}

interface FilterOptions {
    status: 'all' | 'active' | 'on_hold' | 'queued';
    pipeline: 'all' | 'high_ticket' | 'low_ticket';
    window24h: 'all' | 'inside' | 'outside';
    hasResponse: 'all' | 'responded' | 'awaiting';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Format time relative to now
 */
const formatTime = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('pt-BR');
};

/**
 * Check if conversation is within 24h WhatsApp window
 */
const isWithin24hWindow = (lastMessageAt: string | null): boolean => {
    if (!lastMessageAt) return false;
    const diff = Date.now() - new Date(lastMessageAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
};

/**
 * Get pipeline indicator color
 */
const getPipelineColor = (pipeline: string): string => {
    if (pipeline === 'high_ticket') return 'bg-purple-500';
    if (pipeline === 'low_ticket') return 'bg-blue-500';
    return 'bg-slate-500';
};

/**
 * Conversation List - Left sidebar of the chat layout
 */
const ConversationList: React.FC<ConversationListProps> = ({
    userId,
    isAdmin = false,
    selectedId,
    onSelect,
    conversations,
    isLoading,
    activeTab,
    onTabChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        status: 'all',
        pipeline: 'all',
        window24h: 'all',
        hasResponse: 'all'
    });
    const { isConnected } = useSocket({ userId });

    // Count active filters
    const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

    // Filter by tab
    const tabFilteredConversations = conversations.filter(conv => {
        if (activeTab === 'mine') {
            return conv.assignedAgent?.id === userId || conv.status === 'active';
        } else {
            return !conv.assignedAgent || conv.status === 'queued';
        }
    });

    // Apply advanced filters
    const advancedFilteredConversations = tabFilteredConversations.filter(conv => {
        // Status filter
        if (filters.status !== 'all' && conv.status !== filters.status) return false;

        // Pipeline filter
        if (filters.pipeline !== 'all' && conv.pipeline !== filters.pipeline) return false;

        // 24h window filter
        if (filters.window24h !== 'all') {
            const within = isWithin24hWindow(conv.lastMessageAt);
            if (filters.window24h === 'inside' && !within) return false;
            if (filters.window24h === 'outside' && within) return false;
        }

        // Has response filter (check if last message is from agent)
        if (filters.hasResponse !== 'all') {
            const lastMsg = conv.messages?.[0];
            const hasAgentResponse = lastMsg?.direction === 'out';
            if (filters.hasResponse === 'responded' && !hasAgentResponse) return false;
            if (filters.hasResponse === 'awaiting' && hasAgentResponse) return false;
        }

        return true;
    });

    // Filter by search
    const filteredConversations = advancedFilteredConversations.filter(conv =>
        conv.lead?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        conv.lead?.phone?.includes(searchTerm)
    );

    const queueCount = conversations.filter(c => !c.assignedAgent || c.status === 'queued').length;
    const onHoldCount = conversations.filter(c => c.status === 'on_hold').length;

    return (
        <div className="w-[340px] border-r border-slate-200 bg-white flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Atendimento</h2>
                    <div className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold',
                        isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    )}>
                        <div className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-500' : 'bg-rose-500')} />
                        {isConnected ? 'Online' : 'Offline'}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 rounded-lg p-1 mb-3">
                    <button
                        onClick={() => onTabChange('mine')}
                        className={cn(
                            'flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all',
                            activeTab === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        Meus
                    </button>
                    <button
                        onClick={() => onTabChange('queue')}
                        className={cn(
                            'flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                            activeTab === 'queue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        Fila
                        {queueCount > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px]">
                                {queueCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            'p-2.5 rounded-lg border transition-all relative',
                            showFilters || activeFilterCount > 0
                                ? 'bg-violet-50 border-violet-200 text-violet-600'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                        )}
                        title="Filtros avançados"
                    >
                        <Filter size={16} />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                        {/* Status Filter */}
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Status</label>
                            <div className="flex gap-1 flex-wrap">
                                {[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'active', label: 'Ativos' },
                                    { value: 'on_hold', label: 'Em espera' },
                                    { value: 'queued', label: 'Na fila' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilters(prev => ({ ...prev, status: opt.value as any }))}
                                        className={cn(
                                            'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                            filters.status === opt.value
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pipeline Filter */}
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Pipeline</label>
                            <div className="flex gap-1 flex-wrap">
                                {[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'high_ticket', label: 'High Ticket' },
                                    { value: 'low_ticket', label: 'Low Ticket' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilters(prev => ({ ...prev, pipeline: opt.value as any }))}
                                        className={cn(
                                            'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                            filters.pipeline === opt.value
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 24h Window Filter */}
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Janela 24h</label>
                            <div className="flex gap-1 flex-wrap">
                                {[
                                    { value: 'all', label: 'Todas' },
                                    { value: 'inside', label: 'Dentro' },
                                    { value: 'outside', label: 'Fora' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilters(prev => ({ ...prev, window24h: opt.value as any }))}
                                        className={cn(
                                            'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                            filters.window24h === opt.value
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Has Response Filter */}
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Resposta</label>
                            <div className="flex gap-1 flex-wrap">
                                {[
                                    { value: 'all', label: 'Todas' },
                                    { value: 'responded', label: 'Respondido' },
                                    { value: 'awaiting', label: 'Aguardando' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilters(prev => ({ ...prev, hasResponse: opt.value as any }))}
                                        className={cn(
                                            'px-2 py-1 text-[11px] rounded-md font-medium transition-colors',
                                            filters.hasResponse === opt.value
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => setFilters({ status: 'all', pipeline: 'all', window24h: 'all', hasResponse: 'all' })}
                                className="w-full text-xs text-violet-600 hover:text-violet-700 font-medium py-1"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                        <InboxIcon size={32} className="mb-2 opacity-30" />
                        <p className="text-xs font-medium">Nenhuma conversa</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredConversations.map((conv) => {
                            const isSelected = selectedId === conv.id;
                            const lastMessage = conv.messages?.[0];

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelect(conv.id)}
                                    className={cn(
                                        'w-full p-4 text-left transition-all hover:bg-slate-50',
                                        isSelected && 'bg-blue-50 border-l-2 border-l-blue-500'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <Avatar name={conv.lead.name} size="md" />
                                            <div className={cn(
                                                'absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                                                getPipelineColor(conv.pipeline)
                                            )} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={cn(
                                                    'font-semibold text-sm truncate',
                                                    isSelected ? 'text-blue-700' : 'text-slate-900'
                                                )}>
                                                    {conv.lead.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium ml-2 flex-shrink-0">
                                                    {formatTime(conv.lastMessageAt)}
                                                </span>
                                            </div>

                                            {/* Company/Phone */}
                                            <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                                                {conv.lead.company ? (
                                                    <span className="truncate">{conv.lead.company}</span>
                                                ) : (
                                                    <span>{conv.lead.phone}</span>
                                                )}
                                            </div>

                                            {/* Last message */}
                                            {lastMessage?.text && (
                                                <p className={cn(
                                                    'text-xs truncate',
                                                    lastMessage.direction === 'out' ? 'text-slate-400' : 'text-slate-600 font-medium'
                                                )}>
                                                    {lastMessage.direction === 'out' && '↩ '}
                                                    {lastMessage.text}
                                                </p>
                                            )}
                                        </div>

                                        {/* Unread badge */}
                                        {conv.unreadCount && conv.unreadCount > 0 && (
                                            <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationList;
