import React, { useState, useMemo } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { Tag } from '@/design-system';
import {
    Phone,
    Mail,
    Copy,
    MessageSquare,
    ChevronDown,
    ChevronRight,
    User,
    Briefcase,
    FileText,
    History,
    Plus,
    Bell,
    ArrowRightLeft,
    ExternalLink
} from 'lucide-react';
import { getInitials } from '@/utils';
import styles from './ProfilePanel.module.css';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useLossReasonStore } from '@/features/settings/stores/useLossReasonStore';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';
import { toast } from 'react-toastify';
import { Lead360Modal } from '@/features/crm/components/Lead360Modal/Lead360Modal';
import { CreateProjectModal } from '@/features/production/components/CreateProjectModal';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';

// Sub-components
import { DealSection } from './DealSection';
import { ContactFieldsSection } from './ContactFieldsSection';
import { CompanySection } from './CompanySection';
import { NotesSection } from './NotesSection';
import { LossReasonModal } from './LossReasonModal';
import { TransferModal } from './TransferModal';

// ─── Accordion ───────────────────────────────────────────────────────────────

interface AccordionSectionProps {
    title: string;
    icon: React.ReactNode;
    badge?: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
    title,
    icon,
    badge,
    defaultOpen = false,
    children
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={styles.accordionSection}>
            <button
                className={styles.accordionHeader}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.accordionIcon}>{icon}</span>
                <span className={styles.accordionTitle}>{title}</span>
                {badge !== undefined && (
                    <span className={styles.accordionBadge}>{badge}</span>
                )}
                <span className={styles.accordionChevron}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
            </button>
            {isOpen && (
                <div className={styles.accordionContent}>
                    {children}
                </div>
            )}
        </div>
    );
};

// ─── ProfilePanel ────────────────────────────────────────────────────────────

export const ProfilePanel: React.FC = () => {
    const { selectedConversationId, conversations, updateConversationDetails } = useInboxStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const { sectors, fetchSectors } = useSectorStore();
    const { lossReasons, fetchLossReasons } = useLossReasonStore();
    const teamStatus = useTeamStatus();
    const { leads: kanbanLeads } = useKanbanStore();

    // Modal state
    const [showLossModal, setShowLossModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showLead360Modal, setShowLead360Modal] = useState(false);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

    // Dynamic loss reasons from settings
    const LOSS_REASONS = [...lossReasons]
        .filter(r => r.active)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map(r => ({ value: r.id, label: r.name }));

    // Filter: sales + post-sales sectors, only online/idle
    const transferableCollaborators = useMemo(() => {
        const transferSectorIds = sectors
            .filter(s => {
                const name = s.name.toLowerCase();
                return name.includes('vendas') ||
                    name.includes('pós-venda') ||
                    name.includes('pos-venda') ||
                    name.includes('post-sales') ||
                    name.includes('pos venda');
            })
            .map(s => s.id);

        return collaborators.filter(member => {
            if (!member.active || !transferSectorIds.includes(member.sectorId || '')) {
                return false;
            }
            const status = member.authUid ? teamStatus[member.authUid]?.state : 'offline';
            return status === 'online' || status === 'idle';
        });
    }, [collaborators, sectors, teamStatus]);

    // Load collaborators, sectors and loss reasons on mount
    React.useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (sectors.length === 0) fetchSectors();
        if (lossReasons.length === 0) fetchLossReasons();
    }, [fetchCollaborators, collaborators.length, fetchSectors, sectors.length, fetchLossReasons, lossReasons.length]);

    const conversation = conversations.find(c => c.id === selectedConversationId);
    const assignedMember = conversation ? collaborators.find(c => c.id === conversation.assignedTo) : null;

    // kanbanStore lead = source of truth for Lead360Modal
    const kanbanLead = useMemo(() => {
        if (!conversation) return null;
        return kanbanLeads.find(l => l.id === conversation.leadId) || null;
    }, [kanbanLeads, conversation]);

    const handleTransfer = (userId: string) => {
        if (!selectedConversationId) return;

        const member = collaborators.find(c => c.id === userId);
        const memberSectorName = sectors.find(s => s.id === member?.sectorId)?.name?.toLowerCase() || '';
        const isPostSalesMember =
            memberSectorName.includes('pós-venda') ||
            memberSectorName.includes('pos-venda') ||
            memberSectorName.includes('post-sales') ||
            memberSectorName.includes('pos venda');

        updateConversationDetails(selectedConversationId, {
            assignedTo: userId,
            context: isPostSalesMember ? 'post_sales' : 'sales',
            postSalesId: isPostSalesMember ? userId : ''
        });

        setShowTransferModal(false);
        toast.success(`Transferido para ${member?.name || 'membro da equipe'}`);
    };

    // ─── Empty state ─────────────────────────────────────────────────────────
    if (!selectedConversationId || !conversation) {
        return (
            <div className={styles.panel}>
                <div className={styles.emptyState}>
                    Selecione uma conversa para ver os detalhes
                </div>
            </div>
        );
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado!');
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className={styles.panel}>
            {/* Header com Avatar e Nome */}
            <div className={styles.profileHeader}>
                <div className={styles.avatarLarge}>
                    {conversation.leadAvatar ? (
                        <img
                            src={conversation.leadAvatar}
                            alt={conversation.leadName}
                            className={styles.avatarImg}
                        />
                    ) : (
                        getInitials(conversation.leadName)
                    )}
                </div>
                <h2 className={styles.profileName}>{conversation.leadName}</h2>
                {conversation.leadCompany && (
                    <p className={styles.profileCompany}>{conversation.leadCompany}</p>
                )}

                {/* Tags */}
                <div className={styles.tagsContainer}>
                    {conversation.tags?.map(tag => (
                        <Tag
                            key={tag}
                            variant={
                                tag === 'Quente' ? 'warning' :
                                    tag === 'Novo Lead' ? 'primary' :
                                        'default'
                            }
                        >
                            {tag}
                        </Tag>
                    ))}
                    <button className={styles.addTagButton}>
                        <Plus size={14} />
                        Adicionar
                    </button>
                </div>

                {/* Botão Lead 360° */}
                <button
                    className={styles.lead360Btn}
                    onClick={() => setShowLead360Modal(true)}
                >
                    <ExternalLink size={14} />
                    <span>Lead 360°</span>
                </button>
            </div>

            {/* Ações Rápidas */}
            <div className={styles.quickActions}>
                <button
                    className={styles.actionButton}
                    onClick={() => window.open(`tel:${conversation.leadPhone}`)}
                    title="Ligar"
                >
                    <Phone size={18} />
                </button>
                <button
                    className={styles.actionButton}
                    onClick={() => conversation.leadEmail && window.open(`mailto:${conversation.leadEmail}`)}
                    title="Email"
                    disabled={!conversation.leadEmail}
                >
                    <Mail size={18} />
                </button>
                <button
                    className={styles.actionButton}
                    onClick={() => copyToClipboard(conversation.leadPhone)}
                    title="Copiar telefone"
                >
                    <Copy size={18} />
                </button>
                <button
                    className={styles.actionButton}
                    onClick={() => {
                        const phone = conversation.leadPhone.replace(/\D/g, '');
                        window.open(`https://wa.me/${phone}`, '_blank');
                    }}
                    title="WhatsApp"
                >
                    <MessageSquare size={18} />
                </button>
                <button
                    className={styles.actionButton}
                    onClick={() => toast.info('Função de notificações em breve')}
                    title="Notificar"
                >
                    <Bell size={18} />
                </button>
                <button
                    className={styles.actionButton}
                    onClick={() => setShowTransferModal(true)}
                    title="Transferir"
                >
                    <ArrowRightLeft size={18} />
                </button>
            </div>

            {/* Accordion Sections */}
            <div className={styles.accordionContainer}>
                {/* Negócio Atual */}
                <AccordionSection
                    title="Negócio Selecionado"
                    icon={<Briefcase size={16} />}
                    defaultOpen={true}
                >
                    <DealSection
                        conversation={conversation}
                        assignedMemberName={assignedMember?.name || null}
                        onUpdateConversation={updateConversationDetails}
                        onShowLossModal={() => setShowLossModal(true)}
                        onShowCreateProject={() => setShowCreateProjectModal(true)}
                    />
                </AccordionSection>

                {/* Dados do Contato */}
                <AccordionSection
                    title="Dados do Contato"
                    icon={<User size={16} />}
                    defaultOpen={true}
                >
                    <ContactFieldsSection
                        conversation={conversation}
                        onUpdateConversation={updateConversationDetails}
                    />
                </AccordionSection>

                {/* Empresa */}
                <AccordionSection
                    title="Empresa"
                    icon={<Briefcase size={16} />}
                >
                    <CompanySection
                        conversation={conversation}
                        onUpdateConversation={updateConversationDetails}
                    />
                </AccordionSection>

                {/* Notas */}
                <AccordionSection
                    title="Notas"
                    icon={<FileText size={16} />}
                >
                    <NotesSection
                        conversation={conversation}
                        conversationId={selectedConversationId}
                        onUpdateConversation={updateConversationDetails}
                    />
                </AccordionSection>

                {/* Histórico */}
                <AccordionSection
                    title="Histórico"
                    icon={<History size={16} />}
                >
                    <p className={styles.comingSoon}>Em breve</p>
                </AccordionSection>
            </div>

            {/* ═══ Modals ═══ */}
            <LossReasonModal
                isOpen={showLossModal}
                onClose={() => setShowLossModal(false)}
                conversation={conversation}
                lossReasons={LOSS_REASONS}
                onUpdateConversation={updateConversationDetails}
            />

            <TransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                conversation={conversation}
                transferableCollaborators={transferableCollaborators}
                teamStatus={teamStatus}
                onTransfer={handleTransfer}
            />

            {/* Create Project Modal */}
            {showCreateProjectModal && (
                <CreateProjectModal
                    isOpen={showCreateProjectModal}
                    onClose={() => setShowCreateProjectModal(false)}
                    leadId={conversation.leadId || ''}
                    leadName={conversation.leadName}
                    conversationId={conversation.id}
                />
            )}

            {/* Lead 360° Modal */}
            <Lead360Modal
                isOpen={showLead360Modal}
                onClose={() => setShowLead360Modal(false)}
                lead={kanbanLead || {
                    id: conversation.leadId || conversation.id,
                    name: conversation.leadName,
                    phone: conversation.leadPhone,
                    email: conversation.leadEmail || '',
                    company: conversation.leadCompany || '',
                    status: conversation.stage || '',
                    pipeline: (conversation.pipeline || 'high-ticket') as 'high-ticket' | 'low-ticket',
                    order: 0,
                    responsibleId: conversation.assignedTo || '',
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                    tags: conversation.tags || [],
                }}
                onLeadStatusSync={async (data) => {
                    await updateConversationDetails(conversation.id, {
                        dealStatus: data.dealStatus,
                        status: data.status,
                        stage: data.stage,
                        lossReason: data.lossReason,
                    });
                }}
            />
        </div>
    );
};
