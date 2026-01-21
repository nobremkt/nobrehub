import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Search, Phone, Building, User, ChevronRight, Inbox as InboxIcon, Filter, ChevronDown, Clock, Check, UserCircle2 } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { cn } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import AdvancedFilters, { AdvancedFilterState, defaultFilters } from './AdvancedFilters';

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
 * Now shows all conversations in a single list with "Minhas" as default filter
 */
const ConversationList: React.FC<ConversationListProps> = ({
    userId,
    isAdmin = false,
    selectedId,
    onSelect,
    conversations,
    isLoading
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    // Default to "mine" filter - showing only user's assigned conversations
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
        ...defaultFilters,
        conversations: {
            ...defaultFilters.conversations,
            assignment: 'mine' // Default to "Minhas"
        }
    });
    const { isConnected } = useSocket({ userId });

    // Count active filters (excluding the default "mine" filter)
    const countActiveFilters = (): number => {
        let count = 0;
        if (advancedFilters.conversations.status !== 'all') count++;
        // Don't count "mine" as an active filter since it's the default
        if (advancedFilters.conversations.assignment !== 'all' && advancedFilters.conversations.assignment !== 'mine') count++;
        if (advancedFilters.conversations.window24h !== 'all') count++;
        if (advancedFilters.conversations.response !== 'all') count++;
        if (advancedFilters.deals.hasDeal !== 'all') count++;
        if (advancedFilters.deals.stage !== 'all') count++;
        if (advancedFilters.contacts.tags.length > 0) count++;
        if (advancedFilters.contacts.source !== 'all') count++;
        if (advancedFilters.channels.channel !== 'all') count++;
        return count;
    };
    const activeFilterCount = countActiveFilters();

    // Apply advanced filters - no more tab filtering
    const filteredByAdvanced = conversations.filter(conv => {
        const f = advancedFilters;

        // Conversations filters
        if (f.conversations.status !== 'all' && conv.status !== f.conversations.status) return false;

        // Assignment filter
        if (f.conversations.assignment === 'mine' && conv.assignedAgent?.id !== userId) return false;
        if (f.conversations.assignment === 'unassigned' && conv.assignedAgent) return false;

        if (f.conversations.window24h !== 'all') {
            const within = isWithin24hWindow(conv.lastMessageAt);
            if (f.conversations.window24h === 'inside' && !within) return false;
            if (f.conversations.window24h === 'outside' && within) return false;
        }

        if (f.conversations.response !== 'all') {
            const lastMsg = conv.messages?.[0];
            const hasAgentResponse = lastMsg?.direction === 'out';
            if (f.conversations.response === 'responded' && !hasAgentResponse) return false;
            if (f.conversations.response === 'awaiting' && hasAgentResponse) return false;
        }

        return true;
    });

    // Filter by search
    const filteredConversations = filteredByAdvanced.filter(conv =>
        conv.lead?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        conv.lead?.phone?.includes(searchTerm)
    );

    // Count unread conversations for badge
    const unreadCount = conversations.filter(c =>
        c.unreadCount && c.unreadCount > 0 && c.assignedAgent?.id === userId
    ).length;

    // Current filter label for display
    const getCurrentFilterLabel = () => {
        switch (advancedFilters.conversations.assignment) {
            case 'mine': return 'Minhas Conversas';
            case 'unassigned': return 'Não Atribuídas';
            default: return 'Todas as Conversas';
        }
    };

    return (
        <div className="w-[340px] border-r border-slate-200 bg-white flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Atendimento</h2>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {getCurrentFilterLabel()} ({filteredConversations.length})
                        </p>
                    </div>
                    <div className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold',
                        isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    )}>
                        <div className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-500' : 'bg-rose-500')} />
                        {isConnected ? 'Online' : 'Offline'}
                    </div>
                </div>

                {/* Search & Filter - No more tabs */}
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
                    <div className="relative">
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
                        <AdvancedFilters
                            isOpen={showFilters}
                            onClose={() => setShowFilters(false)}
                            filters={advancedFilters}
                            onFiltersChange={setAdvancedFilters}
                            availableTags={['quente', 'decisor', 'indicação', 'urgente', 'novo']}
                        />
                    </div>
                </div>
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
                        <p className="text-[10px] mt-1">
                            {advancedFilters.conversations.assignment === 'mine'
                                ? 'Use os filtros para ver todas as conversas'
                                : 'Nenhuma conversa encontrada'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredConversations.map((conv) => {
                            const isSelected = selectedId === conv.id;
                            const lastMessage = conv.messages?.[0];
                            const hasAssignedAgent = !!conv.assignedAgent;
                            const isAssignedToMe = conv.assignedAgent?.id === userId;

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

                                        {/* Right side: Agent avatar and/or unread badge */}
                                        <div className="flex flex-col items-end gap-1.5">
                                            {/* Assigned agent avatar - show when viewing "Todas" */}
                                            {hasAssignedAgent && !isAssignedToMe && (
                                                <div
                                                    className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600"
                                                    title={`Atribuído: ${conv.assignedAgent?.name}`}
                                                >
                                                    {conv.assignedAgent?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            {/* Unassigned indicator */}
                                            {!hasAssignedAgent && (
                                                <div
                                                    className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center"
                                                    title="Não atribuído - Na fila"
                                                >
                                                    <UserCircle2 size={14} className="text-amber-600" />
                                                </div>
                                            )}

                                            {/* Unread badge */}
                                            {conv.unreadCount && conv.unreadCount > 0 && (
                                                <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
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
