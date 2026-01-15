import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Clock, User, Search, Phone, Building, DollarSign, ChevronRight, Inbox as InboxIcon } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import ChatView from './ChatView';

interface Conversation {
    id: string;
    status: 'queued' | 'active' | 'closed';
    pipeline: string;
    lastMessageAt: string | null;
    lead: {
        id: string;
        name: string;
        phone: string;
        company?: string;
        estimatedValue: number;
    };
    assignedAgent?: { id: string; name: string };
    messages: Array<{ text?: string; createdAt: string }>;
}

interface InboxProps {
    userId: string;
    isAdmin?: boolean;
    initialLeadId?: string | null;
    onConversationOpened?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Inbox: React.FC<InboxProps> = ({ userId, isAdmin = false, initialLeadId, onConversationOpened }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'mine' | 'queue'>('mine');

    const {
        isConnected,
        subscribeToAssignments,
        subscribeToConversationsData,
        subscribeToNewConversations,
        subscribeToConversationUpdates,
        requestConversations
    } = useSocket({ userId });

    // Fetch conversations from API
    const fetchConversations = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/conversations/active`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Auto-select conversation when initialLeadId is provided
    useEffect(() => {
        const findOrFetchConversation = async () => {
            if (!initialLeadId || selectedConversation) return;

            // First, try to find in local list
            const localConv = conversations.find(c => c.lead.id === initialLeadId);
            if (localConv) {
                setSelectedConversation(localConv.id);
                onConversationOpened?.();
                return;
            }

            // If not found locally, try to fetch from API (might be assigned to another agent or in queue)
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/conversations/by-lead/${initialLeadId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const conv = await response.json();
                    if (conv && conv.id) {
                        // Add to local list and select it
                        setConversations(prev => {
                            if (prev.some(c => c.id === conv.id)) return prev;
                            return [conv, ...prev];
                        });
                        setSelectedConversation(conv.id);
                        onConversationOpened?.();
                    }
                } else {
                    console.log('No conversation found for lead:', initialLeadId);
                    onConversationOpened?.();
                }
            } catch (error) {
                console.error('Error fetching conversation for lead:', error);
                onConversationOpened?.();
            }
        };

        if (initialLeadId && conversations.length >= 0) {
            findOrFetchConversation();
        }
    }, [initialLeadId, conversations, selectedConversation, onConversationOpened]);

    // Subscribe to new assignments
    useEffect(() => {
        const unsubscribe = subscribeToAssignments((newConversation) => {
            setConversations(prev => [newConversation, ...prev]);
        });
        return unsubscribe;
    }, [subscribeToAssignments]);

    // NEW: Subscribe to conversation updates (close, transfer)
    useEffect(() => {
        const unsubscribe = subscribeToConversationUpdates((updatedConv) => {
            setConversations(prev => {
                // If closed or transferred to someone else (unless admin), remove it
                if (updatedConv.status === 'closed' || (!isAdmin && updatedConv.assignedAgentId !== userId)) {
                    return prev.filter(c => c.id !== updatedConv.id);
                }

                // Check if exists
                const exists = prev.some(c => c.id === updatedConv.id);

                let newConversations;
                if (exists) {
                    // Update existing
                    newConversations = prev.map(c => c.id === updatedConv.id ? { ...c, ...updatedConv } : c);
                } else {
                    // Add new (Upsert) - e.g. from unassigned to assigned, or created via webhook
                    newConversations = [updatedConv, ...prev];
                }

                // Sort by lastMessageAt descending
                return newConversations.sort((a, b) => {
                    const dateA = new Date(a.lastMessageAt || 0).getTime();
                    const dateB = new Date(b.lastMessageAt || 0).getTime();
                    return dateB - dateA;
                });
            });

            // If selected was closed/transferred, deselect
            if (selectedConversation === updatedConv.id && (updatedConv.status === 'closed' || (!isAdmin && updatedConv.assignedAgentId !== userId))) {
                setSelectedConversation(null);
            }
        });
        return unsubscribe;
    }, [subscribeToConversationUpdates, isAdmin, userId, selectedConversation]);

    // NEW: Subscribe to new conversations (real-time updates)
    useEffect(() => {
        const unsubscribe = subscribeToNewConversations((newConversation) => {
            console.log('📩 New conversation received:', newConversation);
            setConversations(prev => {
                // Check if conversation already exists
                const exists = prev.some(c => c.id === newConversation.id);
                if (exists) return prev;
                return [newConversation, ...prev];
            });
        });
        return unsubscribe;
    }, [subscribeToNewConversations]);

    // Subscribe to conversations data from socket
    useEffect(() => {
        const unsubscribe = subscribeToConversationsData((data) => {
            setConversations(data);
        });

        if (isConnected) {
            requestConversations(userId);
        }

        return unsubscribe;
    }, [isConnected, subscribeToConversationsData, requestConversations, userId]);

    // Filter by tab first, then by search
    const tabFilteredConversations = conversations.filter(conv => {
        if (activeTab === 'mine') {
            return conv.assignedAgent?.id === userId || conv.status === 'active';
        } else {
            // Queue: unassigned or queued status
            return !conv.assignedAgent || conv.status === 'queued';
        }
    });

    const filteredConversations = tabFilteredConversations.filter(conv =>
        conv.lead?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        conv.lead?.phone?.includes(searchTerm)
    );

    const queueCount = conversations.filter(c => !c.assignedAgent || c.status === 'queued').length;

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Agora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return date.toLocaleDateString('pt-BR');
    };

    const getPipelineColor = (pipeline: string) => {
        if (pipeline === 'high_ticket') return 'bg-purple-500';
        if (pipeline === 'low_ticket') return 'bg-blue-500';
        return 'bg-slate-500';
    };

    const handleConversationClosed = useCallback(() => {
        setSelectedConversation(null);
        fetchConversations();
    }, [fetchConversations]);

    // If a conversation is selected, show the chat view
    if (selectedConversation) {
        return (
            <ChatView
                conversationId={selectedConversation}
                userId={userId}
                onBack={() => setSelectedConversation(null)}
                onConversationClosed={handleConversationClosed}
            />
        );
    }

    return (
        <div className="h-dvh flex flex-col bg-[#f8fafc] animate-in fade-in duration-700">
            {/* Header */}
            <header className="px-10 pt-10 pb-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Atendimento</h1>
                        <p className="text-slate-400 text-xs font-medium mt-1">
                            {isAdmin ? 'Todas as conversas' : 'Suas conversas ativas'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {isConnected ? 'Online' : 'Offline'}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 rounded-2xl p-1">
                    <button
                        onClick={() => setActiveTab('mine')}
                        className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${activeTab === 'mine'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Meus
                    </button>
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'queue'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Fila
                        {queueCount > 0 && (
                            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold min-w-[20px]">
                                {queueCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 shadow-sm transition-all text-slate-900 placeholder:text-slate-400"
                    />
                </div>
            </header>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-10 pb-10">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <InboxIcon size={48} className="mb-4 opacity-30" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhuma conversa ativa</p>
                        <p className="text-[10px] mt-2">Novas mensagens aparecerão aqui</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/10 hover:translate-x-1 transition-all duration-200 group animate-fade-in-up"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                            <User size={24} className="text-slate-400" />
                                        </div>
                                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getPipelineColor(conv.pipeline)} border-2 border-white`} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                                                {conv.lead.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold ml-2 whitespace-nowrap">
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-slate-400 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Phone size={10} />
                                                <span>{conv.lead.phone}</span>
                                            </div>
                                            {conv.lead.company && (
                                                <div className="flex items-center gap-1">
                                                    <Building size={10} />
                                                    <span className="truncate max-w-[100px]">{conv.lead.company}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Last message preview */}
                                        {conv.messages?.length > 0 && conv.messages[0]?.text && (
                                            <p className="text-xs text-slate-500 mt-2 truncate">
                                                {conv.messages[0].text}
                                            </p>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox;
