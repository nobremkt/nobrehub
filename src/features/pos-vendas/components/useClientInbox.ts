/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE CLIENT INBOX — state & handlers for the ClientInbox component
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { usePostSalesStore } from '../stores/usePostSalesStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { PostSalesClientService } from '../services/PostSalesClientService';
import { ProductionService } from '@/features/production/services/ProductionService';
import { InboxService } from '@/features/inbox/services/InboxService';
import { useInboxStore } from '@/features/inbox/stores/useInboxStore';
import { StorageService } from '@/features/inbox/services/StorageService';
import { Conversation, Message } from '@/features/inbox/types';
import { ClientStatus } from '@/types/lead.types';
import { Project } from '@/types/project.types';
import { toast } from 'react-toastify';

export function useClientInbox() {
    const { selectedPostSalesId, clientsByAttendant, setClientsForAttendant } = usePostSalesStore();
    const { collaborators } = useCollaboratorStore();

    const [isLoading, setIsLoading] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
    const [linkedProjects, setLinkedProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const { setDraftMessage } = useInboxStore();

    // Chat states
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [showClientDetailsModal, setShowClientDetailsModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ─── Memoized values ────────────────────────────────────────────────

    const selectedAttendant = useMemo(() => {
        return collaborators.find(c => c.id === selectedPostSalesId);
    }, [collaborators, selectedPostSalesId]);

    const allClients = useMemo(() => {
        if (!selectedPostSalesId) return [];
        const allClientsList = clientsByAttendant[selectedPostSalesId] || [];
        if (statusFilter === 'concluido') {
            return allClientsList.filter(c => c.clientStatus === 'concluido');
        }
        return allClientsList.filter(c => c.clientStatus !== 'concluido');
    }, [clientsByAttendant, selectedPostSalesId, statusFilter]);

    const clients = useMemo(() => {
        if (statusFilter === 'all' || statusFilter === 'concluido') return allClients;
        return allClients.filter(c => c.clientStatus === statusFilter);
    }, [allClients, statusFilter]);

    const statusCounts = useMemo(() => {
        const allClientsList = clientsByAttendant[selectedPostSalesId || ''] || [];
        const activeClients = allClientsList.filter(c => c.clientStatus !== 'concluido');
        return {
            all: activeClients.length,
            aguardando_projeto: activeClients.filter(c => c.clientStatus === 'aguardando_projeto').length,
            aguardando_alteracao: activeClients.filter(c => c.clientStatus === 'aguardando_alteracao').length,
            entregue: activeClients.filter(c => c.clientStatus === 'entregue').length,
            aguardando_pagamento: activeClients.filter(c => c.clientStatus === 'aguardando_pagamento').length,
            concluido: allClientsList.filter(c => c.clientStatus === 'concluido').length,
        };
    }, [clientsByAttendant, selectedPostSalesId]);

    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId);
    }, [clients, selectedClientId]);

    const selectedProject = useMemo(() => {
        if (linkedProjects.length === 0) return null;
        if (!selectedProjectId) return linkedProjects[0];
        return linkedProjects.find(project => project.id === selectedProjectId) || linkedProjects[0];
    }, [linkedProjects, selectedProjectId]);

    // ─── Message grouping ───────────────────────────────────────────────

    const getDateKey = (date: Date | number | string): string => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const messagesWithSeparators = useMemo(() => {
        const result: { type: 'separator' | 'message'; date?: Date; message?: Message }[] = [];
        let lastDateKey = '';

        for (const msg of messages) {
            const msgDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
            const dateKey = getDateKey(msgDate);

            if (dateKey !== lastDateKey) {
                result.push({ type: 'separator', date: msgDate });
                lastDateKey = dateKey;
            }

            result.push({ type: 'message', message: msg });
        }

        return result;
    }, [messages]);

    const lastInboundAt = useMemo(() => {
        const inboundMessages = messages.filter(m => m.direction === 'in');
        if (inboundMessages.length === 0) return undefined;
        const lastInbound = inboundMessages[inboundMessages.length - 1];
        return lastInbound.createdAt ? new Date(lastInbound.createdAt) : undefined;
    }, [messages]);

    const isSessionExpired = useMemo(() => {
        if (!conversation || conversation.channel !== 'whatsapp') return false;
        if (!lastInboundAt) return true;
        const now = new Date();
        const hoursSinceLastInbound = (now.getTime() - lastInboundAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastInbound >= 24;
    }, [conversation, lastInboundAt]);

    // ─── Effects ────────────────────────────────────────────────────────

    useEffect(() => {
        if (!selectedPostSalesId) return;
        setIsLoading(true);
        const unsubscribe = PostSalesClientService.subscribeToClientsByAttendant(
            selectedPostSalesId,
            (fetchedClients) => {
                setClientsForAttendant(selectedPostSalesId, fetchedClients);
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, [selectedPostSalesId, setClientsForAttendant]);

    useEffect(() => {
        if (!selectedClientId) {
            setLinkedProjects([]);
            setSelectedProjectId(null);
            return;
        }
        const unsubscribe = ProductionService.subscribeToProjectsByLeadId(
            selectedClientId,
            (projects) => {
                setLinkedProjects(projects);
                setSelectedProjectId(prev =>
                    prev && projects.some(project => project.id === prev)
                        ? prev
                        : (projects[0]?.id || null)
                );
            }
        );
        return () => unsubscribe();
    }, [selectedClientId]);

    useEffect(() => {
        if (!selectedClientId) {
            setConversation(null);
            setMessages([]);
            return;
        }
        const unsubscribe = InboxService.subscribeToConversationByLeadId(
            selectedClientId,
            (conv) => { setConversation(conv); }
        );
        return () => unsubscribe();
    }, [selectedClientId]);

    useEffect(() => {
        if (!conversation?.id) {
            setMessages([]);
            return;
        }
        const unsubscribe = InboxService.subscribeToMessages(
            conversation.id,
            (msgs) => {
                setMessages(msgs);
                InboxService.markAsRead(conversation.id);
            }
        );
        return () => unsubscribe();
    }, [conversation?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Handlers ───────────────────────────────────────────────────────

    const handleSendMessage = async (text: string) => {
        if (!conversation?.id) return;
        await InboxService.sendMessage(conversation.id, text);
    };

    const handleSendMedia = async (
        file: File,
        type: 'image' | 'video' | 'audio' | 'document',
        caption?: string,
        viewOnce?: boolean
    ) => {
        if (!conversation?.id) return;
        if (!StorageService.validateFileSize(file)) {
            console.error('Arquivo muito grande. Máximo: 16MB');
            return;
        }
        setIsUploading(true);
        try {
            const mediaUrl = await StorageService.uploadMedia(conversation.id, file);
            await InboxService.sendMediaMessage(
                conversation.id, mediaUrl, type,
                caption || file.name, 'agent', viewOnce
            );
        } catch (error) {
            console.error('Upload falhou:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendTemplate = async (
        templateName: string, language: string,
        components: any[], previewText: string
    ) => {
        if (!conversation?.id) return;
        await InboxService.sendTemplateMessage(
            conversation.id, templateName, language, components, previewText
        );
    };

    const handleScheduleMessage = async (text: string, scheduledFor: Date) => {
        if (!conversation?.id) return;
        await InboxService.scheduleMessage(conversation.id, text, scheduledFor);
    };

    const handleUpdateStatus = async (clientId: string, _newStatus: ClientStatus) => {
        if (!selectedPostSalesId) return;
        try {
            if (!selectedProject?.id) {
                console.warn('Cannot mark as delivered: no selected project');
                return;
            }
            await PostSalesClientService.markProjectAsDelivered(
                clientId, selectedProject.id, selectedPostSalesId
            );
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleCompleteClient = async (clientId: string) => {
        if (!selectedPostSalesId) return;
        try {
            await PostSalesClientService.completeClient(
                clientId, selectedProject?.id, selectedPostSalesId
            );
        } catch (error) {
            console.error('Error completing client:', error);
        }
    };

    const handleRequestRevision = async (clientId: string) => {
        if (!selectedPostSalesId || !selectedProject?.id) return;
        try {
            await PostSalesClientService.requestRevision(
                clientId, selectedProject.id, 'Alteração solicitada pelo cliente'
            );
        } catch (error) {
            console.error('Error requesting revision:', error);
            toast.error('Erro ao solicitar alteração do projeto.');
        }
    };

    const handleApproveClient = async (clientId: string) => {
        if (!selectedPostSalesId) return;
        try {
            await PostSalesClientService.approveClient(clientId, selectedProject?.id);
        } catch (error) {
            console.error('Error approving client:', error);
            toast.error('Erro ao aprovar cliente.');
        }
    };

    const handleCopyStatusPageLink = async (statusPageUrl?: string) => {
        if (!statusPageUrl) return;
        try {
            await navigator.clipboard.writeText(statusPageUrl);
            toast.success('Link da pagina de status copiado!');
        } catch (error) {
            console.error('Error copying status page url:', error);
            toast.error('Nao foi possivel copiar o link.');
        }
    };

    // ─── Utility ────────────────────────────────────────────────────────

    const formatCurrency = (value?: number) => {
        if (!value) return null;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return {
        // State
        selectedPostSalesId,
        selectedAttendant,
        isLoading,
        selectedClientId, setSelectedClientId,
        statusFilter, setStatusFilter,
        clients,
        statusCounts,
        selectedClient,
        linkedProjects,
        selectedProject,
        selectedProjectId, setSelectedProjectId,
        conversation,
        messagesWithSeparators,
        messagesEndRef,
        isUploading,
        isTemplateModalOpen, setIsTemplateModalOpen,
        showClientDetailsModal, setShowClientDetailsModal,
        lastInboundAt,
        isSessionExpired,
        setDraftMessage,
        // Handlers
        handleSendMessage,
        handleSendMedia,
        handleSendTemplate,
        handleScheduleMessage,
        handleUpdateStatus,
        handleCompleteClient,
        handleRequestRevision,
        handleApproveClient,
        handleCopyStatusPageLink,
        // Utils
        formatCurrency,
        getInitials,
    };
}
