/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PROFILE PANEL (Painel Direito do Inbox)
 * Painel de detalhes com Accordion colapsável
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { Tag, PhoneInput, Dropdown, Modal, Button } from '@/design-system';
import { formatPhone } from '@/utils';
import { DealStatus } from '../../types';
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
    X
} from 'lucide-react';
import { getInitials } from '@/utils';
import styles from './ProfilePanel.module.css';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useLossReasonStore } from '@/features/settings/stores/useLossReasonStore';
import { toast } from 'react-toastify';

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
    const { lossReasons, fetchLossReasons } = useLossReasonStore();

    // Inline Editing State
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Loss Reason Modal State
    const [showLossModal, setShowLossModal] = useState(false);
    const [selectedLossReason, setSelectedLossReason] = useState<string>('');

    // Motivos de perda dinâmicos (vem das configurações, ordenados por order)
    const LOSS_REASONS = [...lossReasons]
        .filter(r => r.active)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map(r => ({ value: r.id, label: r.name }));

    // Load collaborators and loss reasons on mount
    React.useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (lossReasons.length === 0) fetchLossReasons();
    }, [fetchCollaborators, collaborators.length, fetchLossReasons, lossReasons.length]);

    const conversation = conversations.find(c => c.id === selectedConversationId);

    const assignedMember = conversation ? collaborators.find(c => c.id === conversation.assignedTo) : null;

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

        const updates: any = {};
        if (editingField === 'name') updates.leadName = editValue;
        if (editingField === 'phone') updates.leadPhone = editValue;
        if (editingField === 'email') updates.leadEmail = editValue;
        if (editingField === 'company') updates.leadCompany = editValue;

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
                    onClick={() => {/* TODO: Abrir WhatsApp Web */ }}
                    title="WhatsApp"
                >
                    <MessageSquare size={18} />
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
                >
                    <div className={styles.fieldList}>
                        {renderEditableField('name', 'Nome', conversation.leadName)}
                        {renderEditableField('phone', 'Telefone', conversation.leadPhone)}
                        {renderEditableField('email', 'Email', conversation.leadEmail)}
                        {renderEditableField('company', 'Empresa', conversation.leadCompany)}
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

                {/* Notas */}
                <AccordionSection
                    title="Notas"
                    icon={<FileText size={16} />}
                >
                    <div className={styles.notesSection}>
                        {conversation.notes ? (
                            <p className={styles.notesText}>{conversation.notes}</p>
                        ) : (
                            <p className={styles.notesEmpty}>Nenhuma nota adicionada</p>
                        )}
                        <button className={styles.addNoteButton}>
                            <Plus size={14} />
                            Adicionar nota
                        </button>
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
                            variant={selectedLossReason === reason.value ? 'secondary' : 'primary'}
                            onClick={() => setSelectedLossReason(reason.value)}
                            fullWidth
                            style={{
                                height: '60px',
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                border: selectedLossReason === reason.value
                                    ? '2px solid var(--color-text-primary)'
                                    : 'none',
                            }}
                        >
                            {reason.label}
                        </Button>
                    ))}
                </div>
            </Modal>
        </div>
    );
};
