/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CLIENT INBOX
 * ═══════════════════════════════════════════════════════════════════════════════
 * Inbox de clientes do atendente selecionado com chat integrado.
 * State & handlers delegated to useClientInbox hook.
 */

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
import { Button, Dropdown, Spinner } from '@/design-system';
import { MessageBubble } from '@/features/inbox/components/ChatView/MessageBubble';
import { DateSeparator } from '@/features/inbox/components/ChatView/DateSeparator';
import { ChatInput } from '@/features/inbox/components/ChatView/ChatInput';
import { SessionWarning } from '@/features/inbox/components/ChatView/SessionWarning';
import { SendTemplateModal } from '@/features/inbox/components/SendTemplateModal';
import { Lead360Modal } from '@/features/crm/components/Lead360Modal/Lead360Modal';
import { ClientStatus } from '@/types/lead.types';
import { ProjectStatus } from '@/types/project.types';
import { useClientInbox } from './useClientInbox';
import styles from './ClientInbox.module.css';

// ─── Constants ───────────────────────────────────────────────────────

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
    'alteracao_interna': 'Alt. Interna',
    'alteracao_cliente': 'Alt. Cliente',
    'entregue': 'Entregue',
    'concluido': 'Concluído'
};

// ─── Component ───────────────────────────────────────────────────────

export const ClientInbox = () => {
    const cx = useClientInbox();

    // ─── Empty / Loading states ──────────────────────────────────────
    if (!cx.selectedPostSalesId) {
        return (
            <div className={styles.emptyState}>
                <User size={64} />
                <h3>Selecione um atendente</h3>
                <p>Escolha um membro da equipe para ver os clientes</p>
            </div>
        );
    }

    if (cx.isLoading) {
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
                    Clientes de {cx.selectedAttendant?.name || 'Atendente'}
                </h2>
                <span className={styles.count}>{cx.clients.length} ativos</span>
            </div>

            <div className={styles.content}>
                {/* Client List */}
                <div className={styles.clientList}>
                    {/* Status Filter Tabs */}
                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${cx.statusFilter === 'all' ? styles.active : ''}`}
                            onClick={() => cx.setStatusFilter('all')}
                        >
                            Todos
                            <span className={styles.filterCount}>{cx.statusCounts.all}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${cx.statusFilter === 'aguardando_projeto' ? styles.active : ''}`}
                            onClick={() => cx.setStatusFilter('aguardando_projeto')}
                        >
                            <Clock size={12} />
                            Ag. Vídeo
                            <span className={styles.filterCount}>{cx.statusCounts.aguardando_projeto}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${cx.statusFilter === 'entregue' ? styles.active : ''}`}
                            onClick={() => cx.setStatusFilter('entregue')}
                        >
                            <CheckCircle size={12} />
                            Entregue
                            <span className={styles.filterCount}>{cx.statusCounts.entregue}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${cx.statusFilter === 'aguardando_alteracao' ? styles.active : ''}`}
                            onClick={() => cx.setStatusFilter('aguardando_alteracao')}
                        >
                            <AlertTriangle size={12} />
                            Alteração
                            <span className={styles.filterCount}>{cx.statusCounts.aguardando_alteracao}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${cx.statusFilter === 'aguardando_pagamento' ? styles.active : ''}`}
                            onClick={() => cx.setStatusFilter('aguardando_pagamento')}
                        >
                            <CreditCard size={12} />
                            Pagamento
                            <span className={styles.filterCount}>{cx.statusCounts.aguardando_pagamento}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${styles.concluidos} ${cx.statusFilter === 'concluido' ? styles.active : ''}`}
                            onClick={() => cx.setStatusFilter('concluido')}
                        >
                            <CheckCircle size={12} />
                            Concluídos
                            <span className={styles.filterCount}>{cx.statusCounts.concluido}</span>
                        </button>
                    </div>

                    {/* Client Cards */}
                    <div className={styles.clientCards}>
                        {cx.clients.length === 0 ? (
                            <div className={styles.emptyList}>
                                <User size={32} />
                                <p>Nenhum cliente encontrado</p>
                            </div>
                        ) : (
                            cx.clients.map(client => {
                                const config = STATUS_CONFIG[client.clientStatus || 'aguardando_projeto'];
                                const isSelected = cx.selectedClientId === client.id;

                                return (
                                    <div
                                        key={client.id}
                                        className={`${styles.clientCard} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => cx.setSelectedClientId(client.id)}
                                    >
                                        <div className={styles.clientAvatar}>
                                            {cx.getInitials(client.name)}
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
                                                {cx.formatCurrency(client.dealValue)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Client Details Panel */}
                <div className={styles.detailsPanel}>
                    {cx.selectedClient ? (
                        <>
                            {/* Compact Header Bar */}
                            <div className={styles.headerBar}>
                                <div className={styles.headerLeft}>
                                    <div className={styles.headerAvatar}>
                                        {cx.getInitials(cx.selectedClient.name)}
                                    </div>
                                    <div className={styles.headerInfo}>
                                        <h3 className={styles.headerName}>{cx.selectedClient.name}</h3>
                                        <div className={styles.headerMeta}>
                                            <span className={`${styles.statusBadge} ${styles[STATUS_CONFIG[cx.selectedClient.clientStatus || 'aguardando_projeto'].color]}`}>
                                                {STATUS_CONFIG[cx.selectedClient.clientStatus || 'aguardando_projeto'].label}
                                            </span>
                                            {cx.selectedProject && (
                                                <span className={styles.projectBadge}>
                                                    <Hammer size={12} />
                                                    {PROJECT_STATUS_LABELS[cx.selectedProject.status]}
                                                </span>
                                            )}
                                            {cx.linkedProjects.length > 1 && (
                                                <div className={styles.projectSelector}>
                                                    <Dropdown
                                                        options={cx.linkedProjects.map(project => ({
                                                            value: project.id,
                                                            label: project.name
                                                        }))}
                                                        value={cx.selectedProject?.id || ''}
                                                        onChange={(value) => cx.setSelectedProjectId(String(value))}
                                                        placeholder="Selecionar projeto..."
                                                        noSound
                                                    />
                                                </div>
                                            )}
                                            {cx.selectedClient.dealClosedAt && (
                                                <span className={styles.dateBadge}>
                                                    <Calendar size={12} />
                                                    {new Date(cx.selectedClient.dealClosedAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.headerActions}>
                                    <Button variant="ghost" size="sm"
                                        onClick={() => { if (cx.selectedClient?.phone) window.location.href = `tel:${cx.selectedClient.phone}`; }}
                                        title={cx.selectedClient.phone ? "Ligar" : "Sem telefone"}
                                        disabled={!cx.selectedClient.phone}
                                    >
                                        <Phone size={18} />
                                    </Button>
                                    <Button variant="ghost" size="sm"
                                        onClick={() => {
                                            if (cx.selectedClient?.phone) {
                                                const phone = cx.selectedClient.phone.replace(/\D/g, '');
                                                window.open(`https://wa.me/${phone}`, '_blank');
                                            }
                                        }}
                                        title={cx.selectedClient.phone ? "Abrir no WhatsApp" : "Sem telefone"}
                                        disabled={!cx.selectedClient.phone}
                                    >
                                        <ExternalLink size={18} />
                                    </Button>

                                    {cx.selectedProject?.statusPageUrl && (
                                        <>
                                            <Button variant="ghost" size="sm"
                                                onClick={() => window.open(cx.selectedProject!.statusPageUrl, '_blank')}
                                                title="Abrir pagina de status do cliente"
                                            >
                                                <Hammer size={18} />
                                            </Button>
                                            <Button variant="ghost" size="sm"
                                                onClick={() => cx.handleCopyStatusPageLink(cx.selectedProject!.statusPageUrl)}
                                                title="Copiar link da pagina de status"
                                            >
                                                <Copy size={18} />
                                            </Button>
                                        </>
                                    )}

                                    <Button variant="ghost" size="sm"
                                        onClick={() => cx.setShowClientDetailsModal(true)}
                                        title="Ver detalhes completos"
                                    >
                                        <Info size={18} />
                                    </Button>

                                    {/* Fluxo pós-venda buttons */}
                                    {cx.selectedClient.clientStatus === 'aguardando_projeto' && (
                                        <Button variant="secondary" size="sm"
                                            onClick={() => cx.handleUpdateStatus(cx.selectedClient!.id, 'entregue')}
                                        >
                                            Marcar Entregue
                                        </Button>
                                    )}
                                    {cx.selectedClient.clientStatus === 'entregue' && (
                                        <>
                                            <Button variant="ghost" size="sm"
                                                onClick={() => cx.handleRequestRevision(cx.selectedClient!.id)}
                                            >
                                                Alteração
                                            </Button>
                                            <Button variant="primary" size="sm"
                                                onClick={() => cx.handleApproveClient(cx.selectedClient!.id)}
                                            >
                                                Aprovou ✓
                                            </Button>
                                        </>
                                    )}
                                    {cx.selectedClient.clientStatus === 'aguardando_alteracao' && (
                                        <Button variant="secondary" size="sm"
                                            onClick={() => cx.handleUpdateStatus(cx.selectedClient!.id, 'entregue')}
                                        >
                                            Alteração Entregue
                                        </Button>
                                    )}
                                    {cx.selectedClient.clientStatus === 'aguardando_pagamento' && (
                                        <Button variant="primary" size="sm"
                                            onClick={() => cx.handleCompleteClient(cx.selectedClient!.id)}
                                        >
                                            Concluir
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Full Chat Area */}
                            <div className={styles.chatArea}>
                                {cx.conversation ? (
                                    <>
                                        {cx.conversation.channel === 'whatsapp' && (
                                            <SessionWarning
                                                lastInboundAt={cx.lastInboundAt}
                                                onSendTemplate={() => cx.setIsTemplateModalOpen(true)}
                                            />
                                        )}

                                        <div className={styles.messagesArea}>
                                            {cx.messagesWithSeparators.length === 0 ? (
                                                <div className={styles.noMessages}>
                                                    <MessageCircle size={32} />
                                                    <p>Nenhuma mensagem ainda</p>
                                                </div>
                                            ) : (
                                                cx.messagesWithSeparators.map((item, index) =>
                                                    item.type === 'separator' ? (
                                                        <DateSeparator key={`sep-${index}`} date={item.date!} />
                                                    ) : (
                                                        <MessageBubble key={item.message!.id} message={item.message!} />
                                                    )
                                                )
                                            )}
                                            <div ref={cx.messagesEndRef} />
                                        </div>

                                        {cx.isUploading && (
                                            <div className={styles.uploadStatus}>
                                                <Spinner size="sm" />
                                                <span>Enviando arquivo...</span>
                                            </div>
                                        )}

                                        <ChatInput
                                            onSend={cx.handleSendMessage}
                                            onSendMedia={cx.handleSendMedia}
                                            onOpenTemplate={() => cx.setIsTemplateModalOpen(true)}
                                            onScheduleMessage={cx.handleScheduleMessage}
                                            disabled={cx.isUploading || cx.isSessionExpired}
                                            sessionExpired={cx.isSessionExpired}
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
                            {cx.conversation && (
                                <SendTemplateModal
                                    isOpen={cx.isTemplateModalOpen}
                                    onClose={() => cx.setIsTemplateModalOpen(false)}
                                    onSend={cx.handleSendTemplate}
                                    conversation={cx.conversation}
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

            {/* Lead 360 Modal */}
            {cx.selectedClient && (
                <Lead360Modal
                    isOpen={cx.showClientDetailsModal}
                    onClose={() => cx.setShowClientDetailsModal(false)}
                    lead={cx.selectedClient}
                    onTemplateSelect={(message) => {
                        cx.setDraftMessage(message);
                        cx.setShowClientDetailsModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default ClientInbox;
