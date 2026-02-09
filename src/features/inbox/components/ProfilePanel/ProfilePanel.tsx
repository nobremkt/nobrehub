import React, { useState, useMemo } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { Tag, PhoneInput, Dropdown, Modal, Button } from '@/design-system';
import { formatPhone } from '@/utils';
import { DealStatus, Conversation } from '../../types';
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
    Edit2,
    Check,
    X,
    Bell,
    ArrowRightLeft,
    MessagesSquare,
    ExternalLink
} from 'lucide-react';
import { getInitials } from '@/utils';
import styles from './ProfilePanel.module.css';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useLossReasonStore } from '@/features/settings/stores/useLossReasonStore';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';
import { UserStatusIndicator } from '@/features/presence/components/UserStatusIndicator';
import { toast } from 'react-toastify';
import { Lead360Modal } from '@/features/crm/components/Lead360Modal/Lead360Modal';
import { CreateProjectModal } from '@/features/production/components/CreateProjectModal';

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

export const ProfilePanel: React.FC = () => {
    const { selectedConversationId, conversations, updateConversationDetails } = useInboxStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const { sectors, fetchSectors } = useSectorStore();
    const { lossReasons, fetchLossReasons } = useLossReasonStore();
    const teamStatus = useTeamStatus();

    // Inline Editing State
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Loss Reason Modal State
    const [showLossModal, setShowLossModal] = useState(false);
    const [selectedLossReason, setSelectedLossReason] = useState<string>('');

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Notes Editing State
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteValue, setNoteValue] = useState('');

    // Lead360 Modal State
    const [showLead360Modal, setShowLead360Modal] = useState(false);

    // Create Project Modal State
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

    // Motivos de perda dinâmicos (vem das configurações, ordenados por order)
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

    const startEditing = (field: string, currentValue: string | undefined) => {
        setEditingField(field);
        setEditValue(currentValue || '');
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveEditing = async () => {
        if (!selectedConversationId || !editingField) return;

        const updates: Partial<Conversation> = {};
        // Campos de contato
        if (editingField === 'name') updates.leadName = editValue;
        if (editingField === 'phone') updates.leadPhone = editValue;
        if (editingField === 'email') updates.leadEmail = editValue;
        if (editingField === 'instagram') updates.instagram = editValue;
        if (editingField === 'birthday') updates.birthday = editValue;
        if (editingField === 'position') updates.position = editValue;
        // Campos de empresa
        if (editingField === 'company') updates.leadCompany = editValue;
        if (editingField === 'segment') updates.segment = editValue;
        if (editingField === 'employees') updates.employees = editValue;
        if (editingField === 'revenue') updates.revenue = editValue;
        if (editingField === 'website') updates.website = editValue;

        await updateConversationDetails(selectedConversationId, updates);
        setEditingField(null);
        setEditValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEditing();
        if (e.key === 'Escape') cancelEditing();
    };

    const renderEditableField = (field: string, label: string, value: string | undefined, placeholder?: string) => {
        const isEditing = editingField === field;

        return (
            <div className={styles.field}>
                <span className={styles.fieldLabel}>{label}</span>
                {isEditing ? (
                    <div className={styles.editContainer}>
                        {field === 'phone' ? (
                            <div style={{ flex: 1 }}>
                                <PhoneInput
                                    value={editValue}
                                    onChange={(val) => setEditValue(val)}
                                    placeholder={placeholder}
                                    className={styles.phoneInputOverride}
                                />
                            </div>
                        ) : (
                            <input
                                className={styles.editInput}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                autoFocus
                            />
                        )}
                        <div className={styles.editActions}>
                            <button className={`${styles.editActionBtn} ${styles.save}`} onClick={saveEditing}>
                                <Check size={14} />
                            </button>
                            <button className={`${styles.editActionBtn} ${styles.cancel}`} onClick={cancelEditing}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <span className={styles.fieldValue}>
                            {field === 'phone' && value ? formatPhone(value) : (value || '-')}
                        </span>
                        <button
                            className={styles.fieldEdit}
                            onClick={() => startEditing(field, value)}
                        >
                            <Edit2 size={14} />
                        </button>
                    </>
                )}
            </div>
        );
    };

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
                <button
                    className={`${styles.actionButton} ${styles.highlight}`}
                    onClick={() => setShowCreateProjectModal(true)}
                    title="Criar Projeto"
                >
                    <Plus size={18} />
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
                    <div className={styles.dealSection}>
                        <div className={styles.dealPipeline}>
                            <span className={styles.dealLabel}>Pipeline</span>
                            <span className={styles.dealValue}>{conversation.pipeline === 'low-ticket' ? 'Vendas LT' : 'Vendas HT'}</span>
                        </div>
                        <div className={styles.dealStage}>
                            <span className={styles.dealLabel}>Etapa</span>
                            <Dropdown
                                options={[
                                    { label: 'Prospecção', value: 'prospeccao' },
                                    { label: 'Qualificação', value: 'qualificacao' },
                                    { label: 'Apresentação', value: 'apresentacao' },
                                    { label: 'Negociação', value: 'negociacao' },
                                    { label: 'Fechamento', value: 'fechamento' },
                                ]}
                                value={conversation.stage || 'prospeccao'}
                                onChange={(val) => updateConversationDetails(conversation.id, { stage: val as string })}
                                placeholder="Selecione a etapa"
                                noSound
                            />
                        </div>
                        <div className={styles.dealStatus}>
                            <button
                                className={`${styles.statusButton} ${styles.won} ${conversation.dealStatus === 'won' ? styles.active : ''}`}
                                onClick={() => updateConversationDetails(conversation.id, { dealStatus: 'won' as DealStatus })}
                            >
                                Ganho
                            </button>
                            <button
                                className={`${styles.statusButton} ${styles.lost} ${conversation.dealStatus === 'lost' ? styles.active : ''}`}
                                onClick={() => setShowLossModal(true)}
                            >
                                Perdido
                            </button>
                            <button
                                className={`${styles.statusButton} ${styles.open} ${(!conversation.dealStatus || conversation.dealStatus === 'open') ? styles.active : ''}`}
                                onClick={() => updateConversationDetails(conversation.id, { dealStatus: 'open' as DealStatus })}
                            >
                                Aberto
                            </button>
                        </div>
                    </div>
                </AccordionSection>

                {/* Contato */}
                <AccordionSection
                    title="Contato"
                    icon={<User size={16} />}
                    defaultOpen={true}
                >
                    <div className={styles.fieldList}>
                        {renderEditableField('name', 'Nome', conversation.leadName)}
                        {renderEditableField('birthday', 'Aniversário', conversation.birthday, 'DD/MM/AAAA')}
                        {renderEditableField('email', 'Email', conversation.leadEmail)}
                        {renderEditableField('phone', 'Telefone', conversation.leadPhone)}
                        {renderEditableField('instagram', 'Instagram', conversation.instagram, '@username')}
                        {renderEditableField('position', 'Cargo', conversation.position, 'Ex: Gerente')}
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Notas</span>
                            <span className={styles.fieldValue}>{conversation.notes || '-'}</span>
                        </div>
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Origem (UTM)</span>
                            <span className={styles.fieldValue}>{conversation.utmSource || 'Desconhecida'}</span>
                        </div>
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Tags</span>
                            <div className={styles.tagsInline}>
                                {conversation.tags?.map(tag => (
                                    <Tag key={tag} variant="default" size="sm">{tag}</Tag>
                                ))}
                            </div>
                        </div>
                    </div>
                </AccordionSection>

                {/* Empresa */}
                <AccordionSection
                    title="Empresa"
                    icon={<Briefcase size={16} />}
                >
                    <div className={styles.fieldList}>
                        {renderEditableField('company', 'Nome', conversation.leadCompany)}
                        {renderEditableField('segment', 'Segmento', conversation.segment, 'Ex: Tecnologia')}
                        {renderEditableField('employees', 'Funcionários', conversation.employees, 'Ex: 11-50')}
                        {renderEditableField('revenue', 'Faturamento', conversation.revenue, 'Ex: R$ 500k - 1M')}
                        {renderEditableField('website', 'Site', conversation.website, 'www.empresa.com.br')}
                    </div>
                </AccordionSection>

                {/* Negócio (Detalhes) */}
                <AccordionSection
                    title="Negócio"
                    icon={<Briefcase size={16} />}
                >
                    <div className={styles.fieldList}>
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Origem</span>
                            <span className={styles.fieldValue}>WhatsApp</span>
                        </div>
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Valor</span>
                            <span className={styles.fieldValue}>R$ 0,00</span>
                            <button className={styles.fieldEdit}><Edit2 size={14} /></button>
                        </div>
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Dono</span>
                            <span className={styles.fieldValue}>
                                {assignedMember ? assignedMember.name : 'Não atribuído'}
                            </span>
                            <button className={styles.fieldEdit}>
                                <Edit2 size={14} />
                            </button>
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection
                    title="Notas"
                    icon={<FileText size={16} />}
                >
                    <div className={styles.notesSection}>
                        {isEditingNote ? (
                            <>
                                <textarea
                                    className={styles.noteTextarea}
                                    value={noteValue}
                                    onChange={(e) => setNoteValue(e.target.value)}
                                    placeholder="Digite sua nota aqui..."
                                    autoFocus
                                    rows={4}
                                />
                                <div className={styles.noteActions}>
                                    <button
                                        className={styles.noteCancelBtn}
                                        onClick={() => {
                                            setIsEditingNote(false);
                                            setNoteValue(conversation?.notes || '');
                                        }}
                                    >
                                        <X size={14} />
                                        Cancelar
                                    </button>
                                    <button
                                        className={styles.noteSaveBtn}
                                        onClick={() => {
                                            if (selectedConversationId) {
                                                updateConversationDetails(selectedConversationId, { notes: noteValue });
                                                toast.success('Nota salva!');
                                            }
                                            setIsEditingNote(false);
                                        }}
                                    >
                                        <Check size={14} />
                                        Salvar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {conversation.notes ? (
                                    <p className={styles.notesText}>{conversation.notes}</p>
                                ) : (
                                    <p className={styles.notesEmpty}>Nenhuma nota adicionada</p>
                                )}
                                <button
                                    className={styles.addNoteButton}
                                    onClick={() => {
                                        setNoteValue(conversation.notes || '');
                                        setIsEditingNote(true);
                                    }}
                                >
                                    <Plus size={14} />
                                    {conversation.notes ? 'Editar nota' : 'Adicionar nota'}
                                </button>
                            </>
                        )}
                    </div>
                </AccordionSection>

                {/* Histórico */}
                <AccordionSection
                    title="Histórico"
                    icon={<History size={16} />}
                >
                    <div className={styles.historySection}>
                        <div className={styles.historyItem}>
                            <div className={styles.historyDot} />
                            <div className={styles.historyContent}>
                                <span className={styles.historyText}>Conversa iniciada</span>
                                <span className={styles.historyTime}>Hoje, 14:30</span>
                            </div>
                        </div>
                        <div className={styles.historyItem}>
                            <div className={styles.historyDot} />
                            <div className={styles.historyContent}>
                                <span className={styles.historyText}>Lead criado via WhatsApp</span>
                                <span className={styles.historyTime}>Hoje, 14:28</span>
                            </div>
                        </div>
                    </div>
                </AccordionSection>

                {/* Conversas */}
                <AccordionSection
                    title="Conversas"
                    icon={<MessagesSquare size={16} />}
                    badge={1}
                >
                    <div className={styles.conversationsSection}>
                        <div className={styles.conversationItem}>
                            <div className={styles.conversationIcon}>
                                <MessageSquare size={14} />
                            </div>
                            <div className={styles.conversationInfo}>
                                <span className={styles.conversationChannel}>
                                    {conversation.channel === 'whatsapp' ? 'WhatsApp' : conversation.channel}
                                </span>
                                <span className={styles.conversationDate}>
                                    {new Date(conversation.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <span className={styles.conversationStatus}>
                                {conversation.status === 'open' ? 'Aberta' : 'Fechada'}
                            </span>
                        </div>
                    </div>
                </AccordionSection>
            </div>

            {/* Modal de Motivo de Perda */}
            <Modal
                isOpen={showLossModal}
                onClose={() => {
                    setShowLossModal(false);
                    setSelectedLossReason('');
                }}
                title="Motivo da Perda"
                size="auto"
                footer={
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowLossModal(false);
                                setSelectedLossReason('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!selectedLossReason}
                            onClick={() => {
                                updateConversationDetails(conversation.id, {
                                    dealStatus: 'lost' as DealStatus,
                                    lossReason: selectedLossReason
                                });
                                setShowLossModal(false);
                                setSelectedLossReason('');
                                toast.success('Lead marcado como perdido');
                            }}
                        >
                            Confirmar
                        </Button>
                    </div>
                }
            >
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Selecione o motivo pelo qual este lead foi perdido:
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                }}>
                    {LOSS_REASONS.map((reason) => (
                        <Button
                            key={reason.value}
                            variant={selectedLossReason === reason.value ? 'primary' : 'ghost'}
                            onClick={() => setSelectedLossReason(reason.value)}
                            fullWidth
                            style={{
                                height: '60px',
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                opacity: selectedLossReason && selectedLossReason !== reason.value ? 0.5 : 1,
                                border: selectedLossReason === reason.value
                                    ? 'none'
                                    : '1px solid var(--color-border)',
                                boxShadow: selectedLossReason === reason.value
                                    ? '0 4px 12px rgba(220, 38, 38, 0.4)'
                                    : 'none',
                            }}
                        >
                            {reason.label}
                        </Button>
                    ))}
                </div>
            </Modal>

            {/* Modal de Transferência */}
            <Modal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                title="Transferir Conversa"
                size="auto"
            >
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Selecione um membro de Vendas ou Pós-Vendas:
                </p>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {transferableCollaborators.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                            Nenhum membro disponível no momento
                        </p>
                    ) : (
                        transferableCollaborators.map(member => {
                            const userStatus = member.authUid ? teamStatus[member.authUid]?.state : 'offline';
                            const isCurrentAssigned = member.id === conversation.assignedTo;

                            return (
                                <button
                                    key={member.id}
                                    onClick={() => handleTransfer(member.id)}
                                    disabled={isCurrentAssigned}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        background: isCurrentAssigned ? 'var(--color-primary-500)' : 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: isCurrentAssigned ? 'not-allowed' : 'pointer',
                                        opacity: isCurrentAssigned ? 0.7 : 1,
                                        transition: 'all 0.15s ease',
                                        width: '100%',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: 'var(--color-primary-500)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {member.photoUrl ? (
                                            <img src={member.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            getInitials(member.name)
                                        )}
                                        <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                                            <UserStatusIndicator status={userStatus} size="sm" />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                            {member.name}
                                        </div>
                                        {isCurrentAssigned && (
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                                                Atribuído atualmente
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </Modal>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={showCreateProjectModal}
                onClose={() => setShowCreateProjectModal(false)}
                leadId={conversation.leadId || conversation.id}
                leadName={conversation.leadName}
                conversationId={conversation.id}
            />

            {/* Lead 360° Modal */}
            <Lead360Modal
                isOpen={showLead360Modal}
                onClose={() => setShowLead360Modal(false)}
                lead={{
                    id: conversation.leadId || conversation.id,
                    name: conversation.leadName,
                    phone: conversation.leadPhone,
                    email: conversation.leadEmail || '',
                    company: conversation.leadCompany || '',
                    status: conversation.dealStatus || 'open',
                    pipeline: 'high-ticket',
                    order: 0,
                    responsibleId: conversation.assignedTo || '',
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                    tags: conversation.tags || [],
                }}
            />
        </div>
    );
};
