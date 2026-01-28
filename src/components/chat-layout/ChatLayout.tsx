import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';
import ConversationList from './ConversationList';
import ChatView from '../ChatView';
import CRMSidebar from '../chat/CRMSidebar';
import Lead360Modal, { TabType } from '../Lead360Modal';
import {
    supabaseGetActiveConversations,
    supabaseGetConversationByLead,
    supabaseUpdateLeadStatus
} from '../../services/supabaseApi';

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
        statusHT?: string;
        statusLT?: string;
        tags?: string[];
    };
    assignedAgent?: { id: string; name: string };
    messages: Array<{ text?: string; createdAt: string; direction?: 'in' | 'out' }>;
}

interface ChatLayoutProps {
    userId: string;
    isAdmin?: boolean;
    initialLeadId?: string | null;
    onConversationOpened?: () => void;
}

/**
 * ChatLayout - 3-column layout for chat interface
 * Left: Conversation list (340px)
 * Center: Chat area (flex)
 * Right: Lead context sidebar (320px)
 */
const ChatLayout: React.FC<ChatLayoutProps> = ({
    userId,
    isAdmin = false,
    initialLeadId,
    onConversationOpened
}) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [modalInitialTab, setModalInitialTab] = useState<TabType>('atividades');

    const {
        isConnected,
        subscribeToAssignments,
        subscribeToConversationsData,
        subscribeToNewConversations,
        subscribeToConversationUpdates,
        requestConversations
    } = useFirebase({ userId });

    // Fetch conversations from API
    const fetchConversations = useCallback(async () => {
        try {
            const data = await supabaseGetActiveConversations();
            setConversations(data as Conversation[]);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle moving lead to different stage
    const handleMoveStage = useCallback(async (newStatus: string) => {
        if (!selectedConversationId) return;

        // Find current conversation within the callback
        const currentConv = conversations.find(c => c.id === selectedConversationId);
        if (!currentConv) return;

        try {
            await supabaseUpdateLeadStatus(currentConv.lead.id, newStatus);
            // Update local state immediately
            setConversations(prev => prev.map(conv => {
                if (conv.id === selectedConversationId) {
                    const updatedLead = { ...conv.lead };
                    if (conv.pipeline === 'high_ticket') {
                        updatedLead.statusHT = newStatus;
                    } else {
                        updatedLead.statusLT = newStatus;
                    }
                    return { ...conv, lead: updatedLead };
                }
                return conv;
            }));
        } catch (error) {
            console.error('Error moving stage:', error);
        }
    }, [selectedConversationId, conversations]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Auto-select conversation when initialLeadId is provided
    useEffect(() => {
        const findOrFetchConversation = async () => {
            if (!initialLeadId || selectedConversationId) return;

            const localConv = conversations.find(c => c.lead.id === initialLeadId);
            if (localConv) {
                setSelectedConversationId(localConv.id);
                onConversationOpened?.();
                return;
            }

            try {
                // Use supabaseGetConversationByLead to get or create conversation
                const conv = await supabaseGetConversationByLead(initialLeadId);
                if (conv?.id) {
                    setConversations(prev => {
                        if (prev.some(c => c.id === conv.id)) return prev;
                        return [conv as Conversation, ...prev];
                    });
                    setSelectedConversationId(conv.id);
                    onConversationOpened?.();
                } else {
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
    }, [initialLeadId, conversations, selectedConversationId, onConversationOpened]);

    // Socket subscriptions
    useEffect(() => {
        const unsubscribe = subscribeToAssignments((newConversation) => {
            setConversations(prev => [newConversation, ...prev]);
        });
        return unsubscribe;
    }, [subscribeToAssignments]);

    useEffect(() => {
        const unsubscribe = subscribeToConversationUpdates((updatedConv) => {
            setConversations(prev => {
                if (updatedConv.status === 'closed' || (!isAdmin && updatedConv.assignedAgentId && updatedConv.assignedAgentId !== userId)) {
                    return prev.filter(c => c.id !== updatedConv.id);
                }

                const exists = prev.some(c => c.id === updatedConv.id);
                let newConversations;
                if (exists) {
                    newConversations = prev.map(c => c.id === updatedConv.id ? { ...c, ...updatedConv } : c);
                } else {
                    newConversations = [updatedConv, ...prev];
                }

                return newConversations.sort((a, b) => {
                    const dateA = new Date(a.lastMessageAt || 0).getTime();
                    const dateB = new Date(b.lastMessageAt || 0).getTime();
                    return dateB - dateA;
                });
            });

            if (selectedConversationId === updatedConv.id && (updatedConv.status === 'closed' || (!isAdmin && updatedConv.assignedAgentId && updatedConv.assignedAgentId !== userId))) {
                setSelectedConversationId(null);
            }
        });
        return unsubscribe;
    }, [subscribeToConversationUpdates, isAdmin, userId, selectedConversationId]);

    useEffect(() => {
        const unsubscribe = subscribeToNewConversations((newConversation) => {
            setConversations(prev => {
                const exists = prev.some(c => c.id === newConversation.id);
                if (exists) return prev;
                return [newConversation, ...prev];
            });
        });
        return unsubscribe;
    }, [subscribeToNewConversations]);

    useEffect(() => {
        const unsubscribe = subscribeToConversationsData((data) => {
            setConversations(data);
        });

        if (isConnected) {
            requestConversations(userId);
        }

        return unsubscribe;
    }, [isConnected, subscribeToConversationsData, requestConversations, userId]);

    const handleConversationClosed = useCallback(() => {
        setSelectedConversationId(null);
        fetchConversations();
    }, [fetchConversations]);

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="h-full flex bg-slate-50 overflow-hidden">
            {/* Left: Conversation List */}
            <ConversationList
                userId={userId}
                isAdmin={isAdmin}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
                conversations={conversations}
                isLoading={isLoading}
            />

            {/* Center: Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedConversationId ? (
                    <ChatView
                        conversationId={selectedConversationId}
                        userId={userId}
                        onBack={() => setSelectedConversationId(null)}
                        onConversationClosed={handleConversationClosed}
                        embedded={true}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <MessageCircle size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-1">Nenhuma conversa selecionada</h3>
                        <p className="text-sm">Selecione uma conversa à esquerda para começar</p>
                    </div>
                )}
            </div>

            {/* Right: Lead Context Sidebar - only visible when conversation selected */}
            {selectedConversation && (
                <div className="flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
                    <CRMSidebar
                        lead={selectedConversation.lead as any}
                        pipeline={selectedConversation.pipeline}
                        conversationId={selectedConversation.id}
                        onOpenDetails={() => {
                            setModalInitialTab('atividades');
                            setShowLeadModal(true);
                        }}
                        onOpenConversations={() => {
                            setModalInitialTab('conversas');
                            setShowLeadModal(true);
                        }}
                        onMoveStage={handleMoveStage}
                    />
                </div>
            )}

            {/* Lead Detail Modal */}
            {selectedConversation && (
                <Lead360Modal
                    isOpen={showLeadModal}
                    lead={{
                        id: selectedConversation.lead.id,
                        name: selectedConversation.lead.name,
                        phone: selectedConversation.lead.phone,
                        email: '',
                        company: selectedConversation.lead.company,
                        estimatedValue: selectedConversation.lead.estimatedValue,
                        pipeline: selectedConversation.pipeline as 'high_ticket' | 'low_ticket' | 'production' | 'post_sales',
                        statusHT: selectedConversation.lead.statusHT,
                        statusLT: selectedConversation.lead.statusLT,
                        source: 'whatsapp',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        tags: selectedConversation.lead.tags || []
                    }}
                    onClose={() => setShowLeadModal(false)}
                    onOpenChat={() => setShowLeadModal(false)}
                    initialTab={modalInitialTab}
                />
            )}
        </div>
    );
};

export default ChatLayout;
