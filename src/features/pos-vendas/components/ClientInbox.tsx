/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CLIENT INBOX
 * ═══════════════════════════════════════════════════════════════════════════════
 * Inbox de clientes do atendente selecionado com chat integrado
 * Similar ao ProjectBoard de Produção
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { usePostSalesStore } from '../stores/usePostSalesStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { PostSalesDistributionService } from '../services/PostSalesDistributionService';
import { ProductionService } from '@/features/production/services/ProductionService';
import { InboxService } from '@/features/inbox/services/InboxService';
import { useInboxStore } from '@/features/inbox/stores/useInboxStore';
import { StorageService } from '@/features/inbox/services/StorageService';
import { Conversation, Message } from '@/features/inbox/types';
import { ClientStatus } from '@/types/lead.types';
import { Project, ProjectStatus } from '@/types/project.types';
import { Button, Dropdown, Spinner } from '@/design-system';

// Componentes de Chat do Inbox (reutilizados)
import { MessageBubble } from '@/features/inbox/components/ChatView/MessageBubble';
import { DateSeparator } from '@/features/inbox/components/ChatView/DateSeparator';
import { ChatInput } from '@/features/inbox/components/ChatView/ChatInput';
import { SessionWarning } from '@/features/inbox/components/ChatView/SessionWarning';
import { SendTemplateModal } from '@/features/inbox/components/SendTemplateModal';
import { Lead360Modal } from '@/features/crm/components/Lead360Modal/Lead360Modal';
import { toast } from 'react-toastify';

import {
    User,
    Clock,
    CheckCircle,
    AlertTriangle,
    CreditCard,
    Calendar,
    Hammer,
    MessageCircle,
    Phone,
    ExternalLink,
    Info,
    Copy
} from 'lucide-react';
import styles from './ClientInbox.module.css';

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; icon: typeof Clock }> = {
    'aguardando_projeto': { label: 'Aguardando Vídeo', color: 'info', icon: Clock },
    'aguardando_alteracao': { label: 'Em Alteração', color: 'warning', icon: AlertTriangle },
    'entregue': { label: 'Entregue', color: 'success', icon: CheckCircle },
    'aguardando_pagamento': { label: 'Aguard. Pagamento', color: 'primary', icon: CreditCard },
    'concluido': { label: 'Concluído', color: 'muted', icon: CheckCircle }
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    'aguardando': 'Aguardando Início',
    'em-producao': 'Em Produção',
    'a-revisar': 'A Revisar',
    'revisado': 'Revisado',
    'alteracao': 'Em Alteração',
    'entregue': 'Entregue',
    'concluido': 'Concluído'
};

export const ClientInbox = () => {
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

    // Encontra o atendente selecionado
    const selectedAttendant = useMemo(() => {
        return collaborators.find(c => c.id === selectedPostSalesId);
    }, [collaborators, selectedPostSalesId]);

    // Clientes do atendente selecionado
    // Quando filtro é 'concluido', mostra apenas concluídos
    // Caso contrário, mostra ativos (não concluídos)
    const allClients = useMemo(() => {
        if (!selectedPostSalesId) return [];
        const allClientsList = clientsByAttendant[selectedPostSalesId] || [];
        if (statusFilter === 'concluido') {
            return allClientsList.filter(c => c.clientStatus === 'concluido');
        }
        return allClientsList.filter(c => c.clientStatus !== 'concluido');
    }, [clientsByAttendant, selectedPostSalesId, statusFilter]);

    // Clientes filtrados por status
    const clients = useMemo(() => {
        if (statusFilter === 'all' || statusFilter === 'concluido') return allClients;
        return allClients.filter(c => c.clientStatus === statusFilter);
    }, [allClients, statusFilter]);

    // Contagem por status (precisa da lista completa)
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

    // Cliente selecionado
    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId);
    }, [clients, selectedClientId]);

    const selectedProject = useMemo(() => {
        if (linkedProjects.length === 0) return null;
        if (!selectedProjectId) return linkedProjects[0];
        return linkedProjects.find(project => project.id === selectedProjectId) || linkedProjects[0];
    }, [linkedProjects, selectedProjectId]);

    // Inscreve-se para atualizações em tempo real dos clientes do atendente
    useEffect(() => {
        if (!selectedPostSalesId) return;

        setIsLoading(true);

        const unsubscribe = PostSalesDistributionService.subscribeToClientsByAttendant(
            selectedPostSalesId,
            (fetchedClients) => {
                setClientsForAttendant(selectedPostSalesId, fetchedClients);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [selectedPostSalesId, setClientsForAttendant]);

    // Inscreve-se para atualizações em tempo real do projeto vinculado ao cliente
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

    // Busca a conversa associada ao cliente (por leadId)
    useEffect(() => {
        if (!selectedClientId) {
            setConversation(null);
            setMessages([]);
            return;
        }

        // Subscribe para conversa por leadId
        const unsubscribe = InboxService.subscribeToConversationByLeadId(
            selectedClientId,
            (conv) => {
                setConversation(conv);
            }
        );

        return () => unsubscribe();
    }, [selectedClientId]);

    // Busca mensagens da conversa
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

    // Auto-scroll para última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Group messages by date for rendering separators
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

    // Calcula última mensagem de entrada para janela de 24h do WhatsApp
    const lastInboundAt = useMemo(() => {
        const inboundMessages = messages.filter(m => m.direction === 'in');
        if (inboundMessages.length === 0) return undefined;
        const lastInbound = inboundMessages[inboundMessages.length - 1];
        return lastInbound.createdAt ? new Date(lastInbound.createdAt) : undefined;
    }, [messages]);

    // Verifica se a sessão de 24h do WhatsApp expirou
    const isSessionExpired = useMemo(() => {
        if (!conversation || conversation.channel !== 'whatsapp') return false;
        if (!lastInboundAt) return true; // Sem mensagens de entrada = expirou

        const now = new Date();
        const hoursSinceLastInbound = (now.getTime() - lastInboundAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastInbound >= 24;
    }, [conversation, lastInboundAt]);

    // Enviar mensagem de texto
    const handleSendMessage = async (text: string) => {
        if (!conversation?.id) return;
        await InboxService.sendMessage(conversation.id, text);
    };

    // Enviar mídia
    const handleSendMedia = async (file: File, type: 'image' | 'video' | 'audio' | 'document', caption?: string, viewOnce?: boolean) => {
        if (!conversation?.id) return;

        // Validar tamanho do arquivo
        if (!StorageService.validateFileSize(file)) {
            console.error('Arquivo muito grande. Máximo: 16MB');
            return;
        }

        setIsUploading(true);
        try {
            // Upload para Firebase Storage
            const mediaUrl = await StorageService.uploadMedia(conversation.id, file);

            // Envia a mensagem de mídia
            await InboxService.sendMediaMessage(
                conversation.id,
                mediaUrl,
                type,
                caption || file.name,
                'agent',
                viewOnce
            );
        } catch (error) {
            console.error('Upload falhou:', error);
        } finally {
            setIsUploading(false);
        }
    };

    // Enviar template
    const handleSendTemplate = async (
        templateName: string,
        language: string,
        components: any[],
        previewText: string
    ) => {
        if (!conversation?.id) return;
        await InboxService.sendTemplateMessage(
            conversation.id,
            templateName,
            language,
            components,
            previewText
        );
    };

    // Agendar mensagem
    const handleScheduleMessage = async (text: string, scheduledFor: Date) => {
        if (!conversation?.id) return;
        await InboxService.scheduleMessage(conversation.id, text, scheduledFor);
    };


    // Atualiza status do cliente
    const handleUpdateStatus = async (clientId: string, _newStatus: ClientStatus) => {
        if (!selectedPostSalesId) return;

        try {
            if (!selectedProject?.id) {
                console.warn('Cannot mark as delivered: no selected project');
                return;
            }

            await PostSalesDistributionService.markProjectAsDelivered(
                clientId,
                selectedProject.id,
                selectedPostSalesId
            );
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Marca cliente como concluído
    const handleCompleteClient = async (clientId: string) => {
        if (!selectedPostSalesId) return;

        try {
            await PostSalesDistributionService.completeClient(
                clientId,
                selectedProject?.id,
                selectedPostSalesId
            );
        } catch (error) {
            console.error('Error completing client:', error);
        }
    };

    // Solicita revisão - projeto volta pro MESMO produtor
    const handleRequestRevision = async (clientId: string) => {
        if (!selectedPostSalesId || !selectedProject?.id) return;

        try {
            await PostSalesDistributionService.requestRevision(
                clientId,
                selectedProject.id,
                'AlteraÃ§Ã£o solicitada pelo cliente'
            );
        } catch (error) {
            console.error('Error requesting revision:', error);
        }
    };

    // Cliente aprovou o projeto
    const handleApproveClient = async (clientId: string) => {
        if (!selectedPostSalesId) return;

        try {
            await PostSalesDistributionService.approveClient(clientId, selectedProject?.id);
        } catch (error) {
            console.error('Error approving client:', error);
        }
    };

    // Formata valor
    const formatCurrency = (value?: number) => {
        if (!value) return null;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Gera iniciais do nome
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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

    // Se nenhum atendente selecionado
    if (!selectedPostSalesId) {
        return (
            <div className={styles.emptyState}>
                <User size={64} />
                <h3>Selecione um atendente</h3>
                <p>Escolha um membro da equipe para ver os clientes</p>
            </div>
        );
    }

    // Loading
    if (isLoading) {
        return (
            <div className={styles.emptyState}>
                <Spinner size="lg" />
                <p>Carregando clientes...</p>
            </div>
        );
    }

    return (
        <div className={styles.inbox}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>
                    Clientes de {selectedAttendant?.name || 'Atendente'}
                </h2>
                <span className={styles.count}>{clients.length} ativos</span>
            </div>

            <div className={styles.content}>
                {/* Client List */}
                <div className={styles.clientList}>
                    {/* Status Filter Tabs */}
                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'all' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            Todos
                            <span className={styles.filterCount}>{statusCounts.all}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'aguardando_projeto' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('aguardando_projeto')}
                        >
                            <Clock size={12} />
                            Ag. Vídeo
                            <span className={styles.filterCount}>{statusCounts.aguardando_projeto}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'entregue' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('entregue')}
                        >
                            <CheckCircle size={12} />
                            Entregue
                            <span className={styles.filterCount}>{statusCounts.entregue}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'aguardando_alteracao' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('aguardando_alteracao')}
                        >
                            <AlertTriangle size={12} />
                            Alteração
                            <span className={styles.filterCount}>{statusCounts.aguardando_alteracao}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'aguardando_pagamento' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('aguardando_pagamento')}
                        >
                            <CreditCard size={12} />
                            Pagamento
                            <span className={styles.filterCount}>{statusCounts.aguardando_pagamento}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${styles.concluidos} ${statusFilter === 'concluido' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('concluido')}
                        >
                            <CheckCircle size={12} />
                            Concluídos
                            <span className={styles.filterCount}>{statusCounts.concluido}</span>
                        </button>
                    </div>

                    {/* Client Cards */}
                    <div className={styles.clientCards}>
                        {clients.length === 0 ? (
                            <div className={styles.emptyList}>
                                <User size={32} />
                                <p>Nenhum cliente encontrado</p>
                            </div>
                        ) : (
                            clients.map(client => {
                                const config = STATUS_CONFIG[client.clientStatus || 'aguardando_projeto'];
                                const isSelected = selectedClientId === client.id;

                                return (
                                    <div
                                        key={client.id}
                                        className={`${styles.clientCard} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => setSelectedClientId(client.id)}
                                    >
                                        <div className={styles.clientAvatar}>
                                            {getInitials(client.name)}
                                        </div>
                                        <div className={styles.clientInfo}>
                                            <h4 className={styles.clientName}>{client.name}</h4>
                                            <div className={`${styles.statusBadge} ${styles[config.color]}`}>
                                                <config.icon size={10} />
                                                {config.label}
                                            </div>
                                        </div>
                                        {client.dealValue && (
                                            <span className={styles.dealValue}>
                                                {formatCurrency(client.dealValue)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Client Details */}
                <div className={styles.detailsPanel}>
                    {selectedClient ? (
                        <>
                            {/* Compact Header Bar */}
                            <div className={styles.headerBar}>
                                <div className={styles.headerLeft}>
                                    <div className={styles.headerAvatar}>
                                        {getInitials(selectedClient.name)}
                                    </div>
                                    <div className={styles.headerInfo}>
                                        <h3 className={styles.headerName}>{selectedClient.name}</h3>
                                        <div className={styles.headerMeta}>
                                            <span className={`${styles.statusBadge} ${styles[STATUS_CONFIG[selectedClient.clientStatus || 'aguardando_projeto'].color]}`}>
                                                {STATUS_CONFIG[selectedClient.clientStatus || 'aguardando_projeto'].label}
                                            </span>
                                            {selectedProject && (
                                                <span className={styles.projectBadge}>
                                                    <Hammer size={12} />
                                                    {PROJECT_STATUS_LABELS[selectedProject.status]}
                                                </span>
                                            )}
                                            {linkedProjects.length > 1 && (
                                                <div className={styles.projectSelector}>
                                                    <Dropdown
                                                        options={linkedProjects.map(project => ({
                                                            value: project.id,
                                                            label: project.name
                                                        }))}
                                                        value={selectedProject?.id || ''}
                                                        onChange={(value) => setSelectedProjectId(String(value))}
                                                        placeholder="Selecionar projeto..."
                                                        noSound
                                                    />
                                                </div>
                                            )}
                                            {selectedClient.dealClosedAt && (
                                                <span className={styles.dateBadge}>
                                                    <Calendar size={12} />
                                                    {new Date(selectedClient.dealClosedAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.headerActions}>
                                    {/* Ações de Comunicação */}
                                    {/* Ações de Comunicação */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedClient.phone) {
                                                window.location.href = `tel:${selectedClient.phone}`;
                                            }
                                        }}
                                        title={selectedClient.phone ? "Ligar" : "Sem telefone"}
                                        disabled={!selectedClient.phone}
                                    >
                                        <Phone size={18} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedClient.phone) {
                                                const phone = selectedClient.phone.replace(/\D/g, '');
                                                window.open(`https://wa.me/${phone}`, '_blank');
                                            }
                                        }}
                                        title={selectedClient.phone ? "Abrir no WhatsApp" : "Sem telefone"}
                                        disabled={!selectedClient.phone}
                                    >
                                        <ExternalLink size={18} />
                                    </Button>

                                    {selectedProject?.statusPageUrl && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(selectedProject.statusPageUrl, '_blank')}
                                                title="Abrir pagina de status do cliente"
                                            >
                                                <Hammer size={18} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyStatusPageLink(selectedProject.statusPageUrl)}
                                                title="Copiar link da pagina de status"
                                            >
                                                <Copy size={18} />
                                            </Button>
                                        </>
                                    )}

                                    {/* Ver Detalhes Completos */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowClientDetailsModal(true)}
                                        title="Ver detalhes completos"
                                    >
                                        <Info size={18} />
                                    </Button>

                                    {/* Botões de Fluxo do Pós-Venda */}
                                    {selectedClient.clientStatus === 'aguardando_projeto' && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleUpdateStatus(selectedClient.id, 'entregue')}
                                        >
                                            Marcar Entregue
                                        </Button>
                                    )}
                                    {selectedClient.clientStatus === 'entregue' && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRequestRevision(selectedClient.id)}
                                            >
                                                Alteração
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleApproveClient(selectedClient.id)}
                                            >
                                                Aprovou ✓
                                            </Button>
                                        </>
                                    )}
                                    {selectedClient.clientStatus === 'aguardando_alteracao' && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleUpdateStatus(selectedClient.id, 'entregue')}
                                        >
                                            Alteração Entregue
                                        </Button>
                                    )}
                                    {selectedClient.clientStatus === 'aguardando_pagamento' && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleCompleteClient(selectedClient.id)}
                                        >
                                            Concluir
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Full Chat Area */}
                            <div className={styles.chatArea}>
                                {conversation ? (
                                    <>
                                        {/* WhatsApp 24h Session Warning */}
                                        {conversation.channel === 'whatsapp' && (
                                            <SessionWarning
                                                lastInboundAt={lastInboundAt}
                                                onSendTemplate={() => setIsTemplateModalOpen(true)}
                                            />
                                        )}

                                        <div className={styles.messagesArea}>
                                            {messagesWithSeparators.length === 0 ? (
                                                <div className={styles.noMessages}>
                                                    <MessageCircle size={32} />
                                                    <p>Nenhuma mensagem ainda</p>
                                                </div>
                                            ) : (
                                                messagesWithSeparators.map((item, index) =>
                                                    item.type === 'separator' ? (
                                                        <DateSeparator key={`sep-${index}`} date={item.date!} />
                                                    ) : (
                                                        <MessageBubble key={item.message!.id} message={item.message!} />
                                                    )
                                                )
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Upload Status */}
                                        {isUploading && (
                                            <div className={styles.uploadStatus}>
                                                <Spinner size="sm" />
                                                <span>Enviando arquivo...</span>
                                            </div>
                                        )}

                                        <ChatInput
                                            onSend={handleSendMessage}
                                            onSendMedia={handleSendMedia}
                                            onOpenTemplate={() => setIsTemplateModalOpen(true)}
                                            onScheduleMessage={handleScheduleMessage}
                                            disabled={isUploading || isSessionExpired}
                                            sessionExpired={isSessionExpired}
                                        />
                                    </>
                                ) : (
                                    <div className={styles.noConversation}>
                                        <MessageCircle size={48} />
                                        <h4>Sem conversa vinculada</h4>
                                        <p>Este cliente não possui conversa do WhatsApp</p>
                                    </div>
                                )}
                            </div>

                            {/* Send Template Modal */}
                            {conversation && (
                                <SendTemplateModal
                                    isOpen={isTemplateModalOpen}
                                    onClose={() => setIsTemplateModalOpen(false)}
                                    onSend={handleSendTemplate}
                                    conversation={conversation}
                                />
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyDetails}>
                            <User size={48} />
                            <h4>Selecione um cliente</h4>
                            <p>Clique em um cliente para ver o chat</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Ver Detalhes Completos (Lead 360) */}
            {selectedClient && (
                <Lead360Modal
                    isOpen={showClientDetailsModal}
                    onClose={() => setShowClientDetailsModal(false)}
                    lead={selectedClient}
                    onTemplateSelect={(message) => {
                        setDraftMessage(message);
                        setShowClientDetailsModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default ClientInbox;
