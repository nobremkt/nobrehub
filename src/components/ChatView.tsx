import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Phone, User, DollarSign, CreditCard, XCircle, RefreshCw, MoreVertical, Paperclip, Mic, ArrowRightLeft, X, FileText } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'sonner';
import LeadContextSidebar from './LeadContextSidebar';
import LeadDetailModal from './LeadDetailModal';
import TemplateSelector from './TemplateSelector';
import MessageBubble from './chat/MessageBubble';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ChatView: React.FC<ChatViewProps> = ({ conversationId, userId, onBack, onConversationClosed, embedded = false }) => {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioMimeTypeRef = useRef<string>('audio/webm');

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [availableAgents, setAvailableAgents] = useState<{ id: string; name: string }[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);

    // Lead Detail Modal State
    const [showLeadModal, setShowLeadModal] = useState(false);

    // Template Selector State
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Audio Recording Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // WhatsApp prefers OGG/Opus. Try that first, fallback to webm.
            let mimeType = 'audio/webm;codecs=opus';
            if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                mimeType = 'audio/ogg;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            }

            console.log('🎙️ Recording with mimeType:', mimeType);
            audioMimeTypeRef.current = mimeType;

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);
            setRecordingDuration(0);

            // Start duration timer
            recordingIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            toast.success('Gravando áudio...');
        } catch (error: any) {
            console.error('Error starting recording:', error);

            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                toast.error('Microfone não encontrado. Conecte um microfone e tente novamente.');
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error('Permissão de microfone negada. Permita o acesso nas configurações do navegador.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                toast.error('Microfone em uso por outro aplicativo. Feche outros apps e tente novamente.');
            } else {
                toast.error('Erro ao acessar microfone. Verifique as permissões.');
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
        }
    };

    const sendAudio = async () => {
        if (!conversation || audioChunksRef.current.length === 0) return;

        stopRecording(); // Ensure recording is stopped

        // Wait a moment for the last chunk
        await new Promise(resolve => setTimeout(resolve, 200));

        // Use the actual mimeType that was used for recording
        const mimeType = audioMimeTypeRef.current;
        const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.${ext}`, { type: mimeType });

        setIsSending(true);
        const toastId = toast.loading('Enviando áudio...');

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('to', conversation.lead.phone);
        formData.append('type', 'audio');
        formData.append('leadId', conversation.lead.id);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/whatsapp/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha no envio do áudio');
            }

            toast.dismiss(toastId);
            toast.success('Áudio enviado!');
            audioChunksRef.current = [];
            setRecordingDuration(0);

        } catch (error: any) {
            console.error('Audio upload failed:', error);
            toast.dismiss(toastId);
            toast.error(`Erro no envio: ${error.message}`);
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
            const response = await fetch(`${API_URL}/whatsapp/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type is set automatically for FormData
                },
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
            console.error('Upload failed:', error);
            toast.dismiss(toastId);
            toast.error(`Erro no envio: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

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

    const { subscribeToConversation, sendMessage, isConnected } = useSocket({ userId });

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

    // Backup polling for messages - only as fallback when socket fails
    // This guarantees messages appear even if socket events fail
    useEffect(() => {
        if (!conversationId || isLoading) return;

        const pollInterval = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const serverMessages = data.messages || [];

                    // Merge server messages with local state to prevent losing optimistic updates
                    setMessages(prev => {
                        // Create a map of server messages by ID for quick lookup
                        const serverMap = new Map(serverMessages.map((m: Message) => [m.id, m]));

                        // Start with server messages
                        const merged = [...serverMessages];

                        // Add any local messages that don't exist on server yet (optimistic updates)
                        const localOnlyMessages = prev.filter(localMsg => !serverMap.has(localMsg.id));

                        if (localOnlyMessages.length > 0) {
                            console.log('📬 Polling: Preserving', localOnlyMessages.length, 'local-only messages');
                            merged.push(...localOnlyMessages);
                            // Sort by createdAt to maintain order
                            merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                        }

                        // Only log if there are changes
                        if (merged.length !== prev.length) {
                            console.log('📬 Polling: Messages updated', prev.length, '->', merged.length);
                        }

                        return merged;
                    });
                }
            } catch (error) {
                // Silent fail for polling - don't spam console
            }
        }, 5000); // Poll every 5 seconds as fallback (socket handles real-time)

        return () => clearInterval(pollInterval);
    }, [conversationId, isLoading]);

    // Subscribe to new messages
    // Subscribe to new messages
    useEffect(() => {
        if (!conversationId) return;

        console.log(`🔌 ChatView: Subscribing to messages for ${conversationId}`);
        const unsubscribe = subscribeToConversation(conversationId, (newMessage) => {
            console.log('📨 ChatView: MESSAGE RECEIVED!', newMessage);
            console.log('📨 newMessage.id:', newMessage.id);
            console.log('📨 newMessage.waMessageId:', newMessage.waMessageId);

            setMessages((prev) => {
                console.log('🔄 setMessages called, prev length:', prev.length);
                console.log('🔄 prev IDs:', prev.map(m => m.id).slice(-5)); // Last 5 IDs

                // 1. Exact ID match check
                const isDuplicate = prev.some(m => m.id === newMessage.id);
                console.log('🔄 isDuplicate by ID?', isDuplicate);

                if (isDuplicate) {
                    console.log('⚠️ SKIPPING - Duplicate ID found');
                    return prev;
                }

                // 2. Deduplication for Optimistic UI:
                // If we find a 'pending' message with same text & direction, replace it.
                // This prevents duplicating the message when the real event arrives.
                if (newMessage.direction === 'out') {
                    const pendingIndex = prev.findIndex(m =>
                        m.status === 'pending' &&
                        m.direction === 'out' &&
                        m.text === newMessage.text
                    );

                    if (pendingIndex !== -1) {
                        console.log('✅ Replacing pending message at index:', pendingIndex);
                        const updated = [...prev];
                        updated[pendingIndex] = newMessage;
                        return updated;
                    }
                }

                // Add and sort
                console.log('✅ ADDING NEW MESSAGE to state');
                const updated = [...prev, newMessage].sort((a, b) =>
                    new Date(a.createdAt || a.timestamp || 0).getTime() - new Date(b.createdAt || b.timestamp || 0).getTime()
                );
                console.log('✅ New state length:', updated.length);
                return updated;
            });
            // Force scroll to bottom on new message
            scrollToBottom();
        });

        return () => {
            console.log(`🔌 ChatView: Unsubscribing from ${conversationId}`);
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: conversation.lead.phone,
                    text: textToSend,
                    leadId: conversation.lead.id
                })
            });

            if (!response.ok) throw new Error('Failed to send');

            const data = await response.json();

            // On API success, update the temp message (id/status) if the socket hasn't replaced it yet
            setMessages(prev => {
                const index = prev.findIndex(m => m.id === tempId);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        id: data.dbId || data.messageId, // Use DB ID if available
                        status: 'sent',
                        waMessageId: data.messageId
                    };
                    return updated;
                }
                return prev;
            });

        } catch (err) {
            console.error('Failed to send message:', err);
            toast.error('Erro ao enviar mensagem');
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

    // Move lead to different stage
    const handleMoveStage = async (newStage: string) => {
        if (!conversation) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/leads/${conversation.lead.id}/status`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStage })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            const updatedLead = await response.json();
            toast.success(`Lead movido para: ${newStage}`);

            // Update local state
            setConversation(prev => prev ? {
                ...prev,
                lead: {
                    ...prev.lead,
                    statusHT: updatedLead.statusHT,
                    statusLT: updatedLead.statusLT
                }
            } : null);
        } catch (error) {
            console.error('Failed to move stage:', error);
            toast.error('Erro ao mover lead de etapa');
            throw error;
        }
    };

    // Send template message
    const handleSendTemplate = async (templateName: string, parameters: string[], fullText?: string) => {
        if (!conversation) return;

        const token = localStorage.getItem('token');
        const userName = localStorage.getItem('userName') || 'Você';
        const userId = localStorage.getItem('userId');

        try {
            const response = await fetch(`${API_URL}/whatsapp/send-template`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: conversation.lead.phone,
                    templateName,
                    parameters,
                    leadId: conversation.lead.id,
                    fullText
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send template');
            }

            const result = await response.json();

            // Add template message to local state
            const newMessage: Message = {
                id: result.dbId || `temp-${Date.now()}`,
                direction: 'out',
                text: fullText || `📋 Template: ${templateName}`,
                type: 'template',
                templateName: templateName,
                status: 'sent',
                createdAt: new Date().toISOString(),
                sentByUser: userId ? { id: userId, name: userName } : undefined,
                waMessageId: result.messageId
            };

            setMessages(prev => [...prev, newMessage]);
            toast.success(`Template "${templateName}" enviado com sucesso!`);
        } catch (err: any) {
            console.error('Failed to send template:', err);
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
                <p className="text-slate-400">Conversa não encontrada</p>
            </div>
        );
    }

    return (
        <div className={`${embedded ? 'h-full' : 'h-dvh'} flex bg-[#f8fafc]`}>
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-4">
                        {!embedded && (
                            <button
                                onClick={onBack}
                                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <ArrowLeft size={20} className="text-slate-600" />
                            </button>
                        )}

                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                                <User size={20} className="text-rose-600" />
                            </div>
                            {/* Status Dot */}
                            <div
                                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                                    }`}
                                title={isConnected ? `Conectado (Socket Real-time)` : 'Desconectado (Polling Backup)'}
                            />
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

                        {/* Action Buttons - Visible */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchAvailableAgents}
                                disabled={isLoadingAgents}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                                title="Transferir conversa"
                            >
                                <ArrowRightLeft size={16} />
                                <span className="hidden sm:inline">Transferir</span>
                            </button>
                            <button
                                onClick={handlePaymentSignal}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 rounded-xl text-sm font-medium text-emerald-700 transition-colors"
                                title="Marcar sinal pago"
                            >
                                <CreditCard size={16} />
                                <span className="hidden sm:inline">Sinal</span>
                            </button>
                            <button
                                onClick={handleNoInterest}
                                className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 rounded-xl text-sm font-medium text-rose-700 transition-colors"
                                title="Encerrar sem interesse"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </header>
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

                {/* Input Bar - WhatsApp Style */}
                <div className="bg-white border-t border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                        {/* Attach Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,audio/*,application/pdf"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            title="Anexar arquivo"
                            disabled={isSending}
                        >
                            <Paperclip size={20} />
                        </button>

                        {/* Template Button */}
                        <button
                            onClick={() => setShowTemplateSelector(true)}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
                            title="Enviar template (HSM)"
                            disabled={isSending}
                        >
                            <FileText size={20} />
                        </button>

                        {/* Input */}
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                        />

                        {/* Audio Button / Recording Controls */}
                        {isRecording ? (
                            <div className="flex items-center gap-2">
                                <span className="text-rose-600 font-mono text-sm animate-pulse">
                                    {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                                    {(recordingDuration % 60).toString().padStart(2, '0')}
                                </span>
                                <button
                                    onClick={() => { stopRecording(); audioChunksRef.current = []; setRecordingDuration(0); }}
                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
                                    title="Cancelar gravação"
                                >
                                    <X size={20} />
                                </button>
                                <button
                                    onClick={sendAudio}
                                    disabled={isSending}
                                    className="p-3.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                                    title="Enviar áudio"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={startRecording}
                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
                                    title="Gravar áudio"
                                    disabled={isSending}
                                >
                                    <Mic size={20} />
                                </button>

                                {/* Send Button */}
                                <button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || isSending}
                                    className={`p-3.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/20 ${newMessage.trim() && !isSending ? 'animate-pulse-glow' : ''
                                        }`}
                                >
                                    <Send size={20} />
                                </button>
                            </>
                        )}
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

            {/* Context Sidebar - Only show when NOT embedded (ChatLayout renders its own) */}
            {!embedded && (
                <div className="hidden lg:block">
                    <LeadContextSidebar
                        lead={conversation.lead}
                        pipeline={conversation.pipeline}
                        onOpenDetails={() => setShowLeadModal(true)}
                        onMoveStage={handleMoveStage}
                    />
                </div>
            )}

            {/* Lead Detail Modal */}
            {
                showLeadModal && (
                    <LeadDetailModal
                        isOpen={showLeadModal}
                        lead={conversation.lead as any}
                        onClose={() => setShowLeadModal(false)}
                        onEdit={() => { }}
                        onDelete={() => { }}
                        onOpenChat={() => { }}
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
        </div >
    );
};

export default ChatView;
