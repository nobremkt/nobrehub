import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Search, Phone, Building, User, ChevronRight, Inbox as InboxIcon } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { cn } from '../../lib/utils';
import Avatar from '../ui/Avatar';

interface Conversation {
    id: string;
    status: 'queued' | 'active' | 'closed';
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
    const { isConnected } = useSocket({ userId });

    // Filter by tab
    const tabFilteredConversations = conversations.filter(conv => {
        if (activeTab === 'mine') {
            return conv.assignedAgent?.id === userId || conv.status === 'active';
        } else {
            return !conv.assignedAgent || conv.status === 'queued';
        }
    });

    // Filter by search
    const filteredConversations = tabFilteredConversations.filter(conv =>
        conv.lead?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        conv.lead?.phone?.includes(searchTerm)
    );

    const queueCount = conversations.filter(c => !c.assignedAgent || c.status === 'queued').length;

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

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
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
