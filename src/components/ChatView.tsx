import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Phone, User, DollarSign, CreditCard, XCircle, RefreshCw, MoreVertical } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'sonner';

interface Message {
    id: string;
    direction: 'in' | 'out';
    text?: string;
    type: string;
    status: string;
    createdAt: string;
    sentByUser?: { id: string; name: string };
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
    };
    assignedAgent?: { id: string; name: string };
    messages: Message[];
}

interface ChatViewProps {
    conversationId: string;
    userId: string;
    onBack: () => void;
    onConversationClosed: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ChatView: React.FC<ChatViewProps> = ({ conversationId, userId, onBack, onConversationClosed }) => {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showActions, setShowActions] = useState(false);

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [availableAgents, setAvailableAgents] = useState<{ id: string; name: string }[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchAvailableAgents = async () => {
        setIsLoadingAgents(true);
        try {
            const token = localStorage.getItem('token');
            // Fetch agents from same pipeline or all relevant ones
            // Assuming current conversation pipeline implies target agents
            const response = await fetch(`${API_URL}/conversations/agents/available?pipeline=${conversation?.pipeline}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Filter out current assigned agent
                setAvailableAgents(data.filter((a: any) => a.id !== conversation?.assignedAgent?.id));
                setShowTransferModal(true);
                setShowActions(false); // Close actions menu
            }
        } catch (error) {
            toast.error('Erro ao buscar agentes');
        } finally {
            setIsLoadingAgents(false);
        }
    };

    const handleTransfer = async (newAgentId: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/conversations/${conversationId}/transfer`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newAgentId })
            });
            toast.success('Conversa transferida com sucesso!');
            setShowTransferModal(false);
            onConversationClosed();
        } catch (error) {
            toast.error('Erro ao transferir conversa');
        }
    };

    const { subscribeToConversation, sendMessage } = useSocket({ userId });

    // Fetch conversation details
    const fetchConversation = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setConversation(data);
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching conversation:', error);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        fetchConversation();
    }, [fetchConversation]);

    // Subscribe to new messages
    useEffect(() => {
        const unsubscribe = subscribeToConversation(conversationId, (newMsg: Message) => {
            setMessages(prev => [...prev, newMsg]);
        });
        return unsubscribe;
    }, [conversationId, subscribeToConversation]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        sendMessage(conversationId, newMessage.trim(), userId);
        setNewMessage('');
        setIsSending(false);
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
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/conversations/${conversationId}/close`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'payment' })
            });
            toast.success('Sinal confirmado! Lead movido para Pós-Venda.');
            onConversationClosed();
        } catch (error) {
            toast.error('Erro ao processar pagamento');
        }
    };

    const handleNoInterest = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/conversations/${conversationId}/close`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'no_interest' })
            });
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

    if (isLoading) {
        return (
            <div className="h-dvh flex items-center justify-center bg-[#f8fafc]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="h-dvh flex items-center justify-center bg-[#f8fafc]">
                <p className="text-slate-400">Conversa não encontrada</p>
            </div>
        );
    }

    return (
        <div className="h-dvh flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>

                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                        <User size={20} className="text-rose-600" />
                    </div>

                    <div className="flex-1">
                        <h2 className="font-bold text-slate-900">{conversation.lead.name}</h2>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                                <Phone size={10} />
                                <span>{conversation.lead.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <DollarSign size={10} />
                                <span>{formatCurrency(conversation.lead.estimatedValue)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <MoreVertical size={20} className="text-slate-600" />
                        </button>

                        {showActions && (
                            <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[200px]">
                                <button
                                    onClick={handlePaymentSignal}
                                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-emerald-50 text-left transition-colors"
                                >
                                    <CreditCard size={18} className="text-emerald-600" />
                                    <span className="text-sm font-bold text-emerald-700">💰 Sinal Pago</span>
                                </button>
                                <button
                                    onClick={handleNoInterest}
                                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-rose-50 text-left transition-colors"
                                >
                                    <XCircle size={18} className="text-rose-500" />
                                    <span className="text-sm font-bold text-rose-600">Sem Interesse</span>
                                </button>
                                <button
                                    onClick={fetchAvailableAgents}
                                    disabled={isLoadingAgents}
                                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-blue-50 text-left transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={18} className="text-blue-500" />
                                    <span className="text-sm font-bold text-blue-600">Transferir</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-2xl px-5 py-3 ${msg.direction === 'out'
                                ? 'bg-rose-600 text-white rounded-br-md'
                                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <p className={`text-[10px] mt-1 ${msg.direction === 'out' ? 'text-rose-200' : 'text-slate-400'}`}>
                                {formatTime(msg.createdAt)}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 p-4">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-rose-600/50 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        className="p-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/20"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

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
    );
};

export default ChatView;
