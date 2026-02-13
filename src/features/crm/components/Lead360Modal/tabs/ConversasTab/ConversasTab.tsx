import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead } from '@/types/lead.types';
import { MessageSquare, ExternalLink, Clock, CheckCircle, Plus } from 'lucide-react';
import styles from './ConversasTab.module.css';
import { useInboxStore } from '@/features/inbox/stores/useInboxStore';
import { InboxService } from '@/features/inbox/services/InboxService';
import { ROUTES } from '@/config';
import { Button } from '@/design-system';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversasTabProps {
    lead: Lead;
}

// Normaliza telefone para comparação
const normalizePhone = (phone: string): string => {
    return phone?.replace(/\D/g, '') || '';
};

export function ConversasTab({ lead }: ConversasTabProps) {
    const navigate = useNavigate();
    const { conversations, init, selectConversation } = useInboxStore();

    // Inicializa store do Inbox se necessário
    useEffect(() => {
        if (conversations.length === 0) {
            init();
        }
    }, [conversations.length, init]);

    // Filtra conversas do lead pelo telefone
    const leadPhone = normalizePhone(lead.phone);
    const leadConversations = conversations.filter(c =>
        normalizePhone(c.leadPhone) === leadPhone
    );

    const activeConversations = leadConversations.filter(c => c.status === 'open');
    const closedConversations = leadConversations.filter(c => c.status === 'closed');

    const handleGoToConversation = (conversationId: string) => {
        selectConversation(conversationId);
        navigate(ROUTES.inbox.conversation(conversationId));
    };

    // Navega para o Inbox para iniciar nova conversa com o lead
    const handleStartConversation = async () => {
        try {
            const conversationId = await InboxService.findOrCreateConversation({
                leadId: lead.id,
                leadName: lead.name,
                leadPhone: lead.phone || '',
                leadEmail: lead.email,
                leadCompany: lead.company,
            });
            selectConversation(conversationId);
            navigate(ROUTES.inbox.conversation(conversationId));
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return '';
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
        } catch {
            return '';
        }
    };

    const renderConversationCard = (conv: typeof conversations[0]) => (
        <div key={conv.id} className={styles.conversationCard}>
            <div className={styles.cardHeader}>
                <span className={styles.channel}>
                    {conv.channel === 'whatsapp' ? '📱 WhatsApp' : '💬 Interno'}
                </span>
                {conv.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                )}
            </div>

            <p className={styles.lastMessage}>
                {conv.lastMessage?.content || 'Sem mensagens'}
            </p>

            <div className={styles.cardFooter}>
                <span className={styles.date}>
                    {formatDate(conv.lastMessage?.createdAt || conv.updatedAt)}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGoToConversation(conv.id)}
                >
                    <ExternalLink size={14} />
                    Ir para conversa
                </Button>
            </div>
        </div>
    );

    if (leadConversations.length === 0) {
        return (
            <div className={styles.tabContent}>
                <h3 className={styles.sectionTitle}>
                    <MessageSquare size={18} />
                    Histórico de Conversas
                </h3>

                <div className={styles.emptyState}>
                    <MessageSquare size={48} />
                    <p>Nenhuma conversa registrada com este lead.</p>
                    {lead.phone && (
                        <Button
                            variant="primary"
                            onClick={handleStartConversation}
                        >
                            <Plus size={16} />
                            Iniciar Conversa
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.tabContent}>
            {/* Conversas Ativas */}
            {activeConversations.length > 0 && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <Clock size={18} />
                        Conversas Ativas ({activeConversations.length})
                    </h3>
                    <div className={styles.conversationsList}>
                        {activeConversations.map(renderConversationCard)}
                    </div>
                </section>
            )}

            {/* Histórico (Fechadas) */}
            {closedConversations.length > 0 && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <CheckCircle size={18} />
                        Histórico ({closedConversations.length})
                    </h3>
                    <div className={styles.conversationsList}>
                        {closedConversations.map(renderConversationCard)}
                    </div>
                </section>
            )}
        </div>
    );
}
