import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Phone, User, DollarSign, CreditCard, XCircle, RefreshCw, MoreVertical, Paperclip, Mic, ArrowRightLeft, X, FileText, Clock, Smile, Tag } from 'lucide-react';
import { MessageToolbar } from './chat-layout/MessageToolbar';
import { useFirebase } from '../contexts/FirebaseContext';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { toast } from 'sonner';
import CRMSidebar from './chat/CRMSidebar';
import Lead360Modal, { TabType } from './Lead360Modal';
import TemplateSelector from './TemplateSelector';
import { supabase } from '../lib/supabase';

import MessageBubble from './chat/MessageBubble';
import ChatHeader from './chat/ChatHeader';
import ScheduleMessageModal from './chat/ScheduleMessageModal';
import { TagsEditor } from './TagsEditor';
import { supabaseUpdateLeadTags, supabaseGetAllTags } from '../services/supabaseApi';
import {
    supabaseGetConversation,
    supabaseGetMessages,
    supabaseGetAvailableAgents,
    supabaseTransferConversation,
    supabaseCloseConversation,
    supabaseHoldConversation,
    supabaseResumeConversation,
    supabaseUpdateLeadStatus,
    supabaseSendWhatsAppMessage,
    supabaseSendWhatsAppTemplate
} from '../services/supabaseApi';

interface Message {
    id: string;
    direction: 'in' | 'out';
    text?: string;
    mediaUrl?: string;
    type: string;
    status: string;
    createdAt: string;
    sentByUser?: { id: string; name: string };
    waMessageId?: string;
    timestamp?: string;
    templateName?: string;
}

interface Conversation {
    id: string;
    status: string;
    pipeline: string;
    lead: {
        id: string;
        name: string;
        phone: string;
        company?: string;
        estimatedValue: number;
        statusHT?: string;
        statusLT?: string;
        tags?: string[];
        notes?: string;
    };
    assignedAgent?: { id: string; name: string };
    messages: Message[];
}

interface ChatViewProps {
    conversationId: string;
    userId: string;
    onBack: () => void;
    onConversationClosed: () => void;
    embedded?: boolean; // When true, don't use h-dvh and hide back button
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xedfkizltrervaltuzrx.supabase.co';

const ChatView: React.FC<ChatViewProps> = ({ conversationId, userId, onBack, onConversationClosed, embedded = false }) => {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio Recording Hook
    const { isRecording, recordingDuration, startRecording, stopRecording, sendAudio: sendAudioHook, cancelRecording } = useAudioRecording();

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [availableAgents, setAvailableAgents] = useState<{ id: string; name: string }[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);

    // Lead Detail Modal State
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [modalInitialTab, setModalInitialTab] = useState<TabType>('atividades');

    // Template Selector State
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // Schedule Message Modal State
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Tags Popover State
    const [showTagsPopover, setShowTagsPopover] = useState(false);
    const tagsButtonRef = useRef<HTMLButtonElement>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    useEffect(() => {
        if (showTagsPopover) {
            supabaseGetAllTags().then(setAvailableTags);
        }
    }, [showTagsPopover]);

    // Close tags popover on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showTagsPopover && tagsButtonRef.current && !tagsButtonRef.current.contains(event.target as Node)) {
                // Check if click is inside the popover (which is not a child of button in DOM usually, but we will render it relatively)
                const popover = document.getElementById('tags-popover');
                if (popover && !popover.contains(event.target as Node)) {
                    setShowTagsPopover(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTagsPopover]);

    const handleUpdateTags = async (newTags: string[]) => {
        if (!conversation) return;
        try {
            // Optimistic update
            setConversation(prev => prev ? {
                ...prev,
                lead: { ...prev.lead, tags: newTags }
            } : null);

            await supabaseUpdateLeadTags(conversation.lead.id, newTags);
            toast.success('Tags atualizadas');
        } catch (error) {
            toast.error('Erro ao atualizar tags');
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Audio send wrapper using the hook
    const sendAudio = async () => {
        if (!conversation) return;
        setIsSending(true);
        try {
            await sendAudioHook(conversation.lead.phone, conversation.lead.id, SUPABASE_URL);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !conversation) return;

        // Validations
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Arquivo muito grande (Max 10MB)');
            return;
        }

        setIsSending(true);
        const toastId = toast.loading('Enviando arquivo...');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('to', conversation.lead.phone);

        // Determine type
        let type = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        if (file.type.startsWith('audio/')) type = 'audio';
        if (file.type.startsWith('video/')) type = 'video';

        formData.append('type', type);
        formData.append('leadId', conversation.lead.id);
        if (newMessage.trim()) formData.append('caption', newMessage.trim());

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha no upload');
            }

            const data = await response.json();

            // Note: Socket will handle the incoming message update
            toast.dismiss(toastId);
            toast.success('Arquivo enviado!');
            setNewMessage(''); // Clear caption if any
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input

        } catch (error: any) {
            toast.dismiss(toastId);
            toast.error(`Erro no envio: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const fetchAvailableAgents = async () => {
        setIsLoadingAgents(true);
        try {
            const agents = await supabaseGetAvailableAgents(conversation?.pipeline);
            setAvailableAgents(agents.filter((a: any) => a.id !== conversation?.assignedAgent?.id));
            setShowTransferModal(true);
            setShowActions(false);
        } catch (error) {
            toast.error('Erro ao buscar agentes');
        } finally {
            setIsLoadingAgents(false);
        }
    };

    const handleTransfer = async (newAgentId: string) => {
        try {
            await supabaseTransferConversation(conversationId, newAgentId);
            toast.success('Conversa transferida com sucesso!');
            setShowTransferModal(false);
            onConversationClosed();
        } catch (error) {
            toast.error('Erro ao transferir conversa');
        }
    };

    const { subscribeToConversation, sendMessage, isConnected } = useFirebase({ userId });

    // Fetch conversation details
    const fetchConversation = useCallback(async () => {
        try {
            const data = await supabaseGetConversation(conversationId);
            setConversation(data as any);
            const msgs = await supabaseGetMessages(conversationId);
            setMessages(msgs);
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        fetchConversation();
    }, [fetchConversation]);

    // Backup polling - ONLY syncs status updates and adds missing messages
    // Does NOT replace existing messages to avoid race conditions with socket
    useEffect(() => {
        if (!conversationId || isLoading) return;

        const pollInterval = setInterval(async () => {
            try {
                const serverMessages = await supabaseGetMessages(conversationId);

                setMessages(prev => {
                    // Build lookup maps by waMessageId (primary) and id (fallback)
                    const localByWaId = new Map<string, number>();
                    const localById = new Map<string, number>();
                    prev.forEach((m, idx) => {
                        if (m.waMessageId) localByWaId.set(m.waMessageId, idx);
                        localById.set(m.id, idx);
                    });

                    let hasChanges = false;
                    const updated = [...prev];

                    // Process each server message
                    serverMessages.forEach(serverMsg => {
                        // Try to find local message by waMessageId first, then by id
                        let localIdx = -1;
                        if (serverMsg.waMessageId && localByWaId.has(serverMsg.waMessageId)) {
                            localIdx = localByWaId.get(serverMsg.waMessageId)!;
                        } else if (localById.has(serverMsg.id)) {
                            localIdx = localById.get(serverMsg.id)!;
                        }

                        if (localIdx !== -1) {
                            // Message exists locally - update if ANY meaningful property changed
                            const localMsg = updated[localIdx];
                            if (localMsg.status !== serverMsg.status || localMsg.id !== serverMsg.id || localMsg.waMessageId !== serverMsg.waMessageId) {
                                updated[localIdx] = { ...localMsg, ...serverMsg };
                                hasChanges = true;
                            }
                        } else {
                            // Message doesn't exist locally - add it
                            // But skip if we have a pending message with same text (optimistic UI)
                            const hasPendingMatch = prev.some(m =>
                                m.status === 'pending' &&
                                m.direction === serverMsg.direction &&
                                m.text === serverMsg.text
                            );
                            if (!hasPendingMatch) {
                                updated.push(serverMsg);
                                hasChanges = true;
                            }
                        }
                    });

                    if (!hasChanges) return prev;

                    // Sort and return
                    updated.sort((a, b) =>
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                    return updated;
                });
            } catch (error) {
                // Silent fail for polling
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [conversationId, isLoading]);

    // Subscribe to new messages via socket
    useEffect(() => {
        if (!conversationId) return;

        const unsubscribe = subscribeToConversation(conversationId, (newMessage) => {
            setMessages((prev) => {
                console.log('📩 Realtime Msg:', newMessage.id, newMessage.waMessageId, newMessage.text);

                // Find existing message by waMessageId (primary) or id (fallback)
                let existingIdx = -1;
                if (newMessage.waMessageId) {
                    existingIdx = prev.findIndex(m => m.waMessageId === newMessage.waMessageId);
                }
                if (existingIdx === -1) {
                    existingIdx = prev.findIndex(m => m.id === newMessage.id);
                }

                // If message exists, update it (status may have changed)
                if (existingIdx !== -1) {
                    const existing = prev[existingIdx];
                    console.log('🔄 Updating existing:', existing.id, '->', newMessage.status);

                    // Always update if we found it, to ensure we have the latest data/ID
                    if (existing.status !== newMessage.status || existing.id !== newMessage.id || existing.waMessageId !== newMessage.waMessageId) {
                        const updated = [...prev];
                        updated[existingIdx] = { ...existing, ...newMessage };
                        return updated;
                    }
                    return prev;
                }

                // Check for pending message with same text (optimistic UI replacement)
                if (newMessage.direction === 'out') {
                    const pendingIdx = prev.findIndex(m =>
                        (m.status === 'pending' || m.id.startsWith('temp-')) &&
                        m.direction === 'out' &&
                        m.text === newMessage.text
                    );

                    if (pendingIdx !== -1) {
                        console.log('✅ Replacing pending:', prev[pendingIdx].id);
                        const updated = [...prev];
                        updated[pendingIdx] = newMessage;
                        return updated;
                    }
                }

                // Add new message
                console.log('➕ Adding new message:', newMessage.id);
                const updated = [...prev, newMessage].sort((a, b) =>
                    new Date(a.createdAt || a.timestamp || 0).getTime() - new Date(b.createdAt || b.timestamp || 0).getTime()
                );
                return updated;
            });
            scrollToBottom();
        });

        return () => {
            unsubscribe();
        };
    }, [conversationId, subscribeToConversation, scrollToBottom]);

    // Auto scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending || !conversation) return;

        const textToSend = newMessage.trim();
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            direction: 'out',
            text: textToSend,
            type: 'text',
            status: 'pending',
            createdAt: new Date().toISOString(),
            sentByUser: { id: userId, name: 'You' }
        };

        // Optimistic Update
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setIsSending(true);
        scrollToBottom();

        try {
            const result = await supabaseSendWhatsAppMessage(
                conversation.lead.phone,
                textToSend,
                conversationId,
                conversation.lead.id
            );

            setMessages(prev => {
                const index = prev.findIndex(m => m.id === tempId);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        id: result.messageId || tempId,
                        status: 'sent',
                        waMessageId: result.messageId
                    };
                    return updated;
                }
                return prev;
            });

        } catch (err: any) {
            toast.error(err.message || 'Erro ao enviar mensagem');
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick Actions
    const handlePaymentSignal = async () => {
        try {
            await supabaseCloseConversation(conversationId);
            toast.success('Sinal confirmado! Lead movido para PÃ³s-Venda.');
            onConversationClosed();
        } catch (error) {
            toast.error('Erro ao processar pagamento');
        }
    };

    // Hold conversation (pause atendimento)
    const handleHold = async () => {
        try {
            await supabaseHoldConversation(conversationId);
            setConversation(prev => prev ? { ...prev, status: 'on_hold' } : null);
            toast.info('Conversa colocada em espera');
        } catch (error) {
            toast.error('Erro ao colocar conversa em espera');
        }
    };

    // Resume conversation from hold
    const handleResume = async () => {
        try {
            await supabaseResumeConversation(conversationId);
            setConversation(prev => prev ? { ...prev, status: 'active' } : null);
            toast.success('Atendimento retomado');
        } catch (error) {
            toast.error('Erro ao retomar conversa');
        }
    };

    // Close conversation with reason modal
    const handleCloseConversation = async () => {
        try {
            await supabaseCloseConversation(conversationId);
            toast.success('Atendimento encerrado');
            onConversationClosed();
        } catch (error) {
            toast.error('Erro ao encerrar conversa');
        }
    };

    const handleNoInterest = async () => {
        try {
            await supabaseCloseConversation(conversationId);
            toast.info('Conversa fechada - Sem interesse');
            onConversationClosed();
        } catch (error) {
            toast.error('Erro ao fechar conversa');
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
    };

    // Move lead to different stage
    const handleMoveStage = async (newStage: string) => {
        if (!conversation) return;

        try {
            const updatedLead = await supabaseUpdateLeadStatus(conversation.lead.id, newStage, conversation.pipeline);
            toast.success(`Lead movido para: ${newStage}`);

            setConversation(prev => prev ? {
                ...prev,
                lead: {
                    ...prev.lead,
                    statusHT: updatedLead.statusHT || (conversation.pipeline === 'high_ticket' ? newStage : prev.lead.statusHT),
                    statusLT: updatedLead.statusLT || (conversation.pipeline === 'low_ticket' ? newStage : prev.lead.statusLT)
                }
            } : null);
        } catch (error) {
            toast.error('Erro ao mover lead de etapa');
            throw error;
        }
    };

    // Send template message
    const handleSendTemplate = async (templateName: string, parameters: string[], fullText?: string) => {
        if (!conversation) return;

        // Get user info from Supabase Auth (secure)
        const { data: session } = await supabase.auth.getSession();
        const currentUserId = session?.session?.user?.id;
        const userName = session?.session?.user?.user_metadata?.name || 'Você';

        try {
            const result = await supabaseSendWhatsAppTemplate(
                conversation.lead.phone,
                templateName,
                { components: parameters.length > 0 ? [{ type: 'body', parameters: parameters.map(p => ({ type: 'text', text: p })) }] : undefined },
                conversationId,
                conversation.lead.id
            );

            const newMessage: Message = {
                id: result.messageId || `temp-${Date.now()}`,
                direction: 'out',
                text: fullText || `ðŸ“‹ Template: ${templateName}`,
                type: 'template',
                templateName: templateName,
                status: 'sent',
                createdAt: new Date().toISOString(),
                sentByUser: currentUserId ? { id: currentUserId, name: userName } : undefined,
                waMessageId: result.messageId
            };

            setMessages(prev => [...prev, newMessage]);
            toast.success(`Template "${templateName}" enviado com sucesso!`);
        } catch (err: any) {
            toast.error(err.message || 'Erro ao enviar template');
            throw err;
        }
    };

    if (isLoading) {
        return (
            <div className={`${embedded ? 'h-full' : 'h-dvh'} flex items-center justify-center bg-[#f8fafc]`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className={`${embedded ? 'h-full' : 'h-dvh'} flex items-center justify-center bg-[#f8fafc]`}>
                <p className="text-slate-400">Conversa nÃ£o encontrada</p>
            </div>
        );
    }

    return (
        <div className={`${embedded ? 'h-full' : 'h-dvh'} flex bg-[#f8fafc]`}>
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header - Using new ChatHeader component */}
                <ChatHeader
                    leadName={conversation.lead.name}
                    leadPhone={conversation.lead.phone}
                    channel="WhatsApp"
                    lastMessageAt={conversation.messages?.[conversation.messages.length - 1]?.createdAt || null}
                    conversationStatus={conversation.status as any}
                    assignedAgent={conversation.assignedAgent}
                    isConnected={isConnected}
                    onHold={handleHold}
                    onResume={handleResume}
                    onClose={handleCloseConversation}
                    onTransfer={fetchAvailableAgents}
                    onSchedule={() => setShowScheduleModal(true)}
                    onBack={!embedded ? onBack : undefined}
                    embedded={embedded}
                />
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            id={msg.id}
                            direction={msg.direction}
                            text={msg.text}
                            mediaUrl={msg.mediaUrl}
                            type={msg.type as any}
                            status={msg.status as any}
                            createdAt={msg.createdAt}
                            templateName={msg.templateName}
                            sentByUser={msg.sentByUser}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar (New Toolbar) */}
                <MessageToolbar
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    handleSend={handleSend}
                    isSending={isSending}
                    isRecording={isRecording}
                    recordingDuration={recordingDuration}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    sendAudio={sendAudio}
                    handleFileUpload={handleFileUpload}
                    setShowTemplateSelector={setShowTemplateSelector}
                    setShowScheduleModal={setShowScheduleModal}
                    showTagsPopover={showTagsPopover}
                    setShowTagsPopover={setShowTagsPopover}
                    availableTags={availableTags}
                    handleUpdateTags={handleUpdateTags}
                    currentTags={conversation?.lead.tags || []}
                />

                {/* Transfer Modal */}
                {
                    showTransferModal && (
                        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-slate-900">Transferir Conversa</h3>
                                    <button
                                        onClick={() => setShowTransferModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="p-4 max-h-[300px] overflow-y-auto">
                                    {availableAgents.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <User size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Nenhum outro agente online</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {availableAgents.map(agent => (
                                                <button
                                                    key={agent.id}
                                                    onClick={() => handleTransfer(agent.id)}
                                                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                        {agent.name.charAt(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-slate-700 group-hover:text-blue-700">{agent.name}</p>
                                                        <p className="text-xs text-emerald-500 font-bold">Online</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Context Sidebar - Only show when NOT embedded (ChatLayout renders its own) */}
            {!embedded && (
                <div className="hidden lg:block">
                    <CRMSidebar
                        lead={conversation.lead as any}
                        pipeline={conversation.pipeline}
                        conversationId={conversationId}
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

            {
                showLeadModal && (
                    <Lead360Modal
                        isOpen={showLeadModal}
                        lead={conversation.lead as any}
                        onClose={() => setShowLeadModal(false)}
                        onOpenChat={() => { }}
                        initialTab={modalInitialTab}
                    />
                )
            }

            {/* Template Selector Modal */}
            {
                showTemplateSelector && (
                    <TemplateSelector
                        onSend={handleSendTemplate}
                        onClose={() => setShowTemplateSelector(false)}
                        leadName={conversation.lead.name}
                    />
                )
            }

            {/* Schedule Message Modal */}
            <ScheduleMessageModal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                conversationId={conversationId}
                leadName={conversation.lead.name}
            />
        </div >
    );
};

export default ChatView;
