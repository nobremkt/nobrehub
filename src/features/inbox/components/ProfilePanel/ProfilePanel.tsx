/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PROFILE PANEL (Painel Direito do Inbox)
 * Painel de detalhes com Accordion colapsável
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
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
    Edit2
} from 'lucide-react';
import { getInitials } from '@/utils';
import styles from './ProfilePanel.module.css';

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
    const { selectedConversationId, conversations } = useInboxStore();
    const conversation = conversations.find(c => c.id === selectedConversationId);

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
        // TODO: Adicionar toast de feedback
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
                            <span className={styles.dealValue}>Vendas HT</span>
                        </div>
                        <div className={styles.dealStage}>
                            <span className={styles.dealLabel}>Etapa</span>
                            <div className={styles.stageIndicator}>
                                <span className={styles.stageDot} />
                                Prospecção
                            </div>
                        </div>
                        <div className={styles.dealStatus}>
                            <button className={`${styles.statusButton} ${styles.won}`}>
                                Ganho
                            </button>
                            <button className={`${styles.statusButton} ${styles.lost}`}>
                                Perdido
                            </button>
                            <button className={`${styles.statusButton} ${styles.open} ${styles.active}`}>
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
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Nome</span>
                            <span className={styles.fieldValue}>{conversation.leadName}</span>
                            <button className={styles.fieldEdit}><Edit2 size={14} /></button>
                        </div>
                        <div className={styles.field}>
                            <span className={styles.fieldLabel}>Telefone</span>
                            <span className={styles.fieldValue}>{conversation.leadPhone}</span>
                            <button className={styles.fieldEdit}><Edit2 size={14} /></button>
                        </div>
                        {conversation.leadEmail && (
                            <div className={styles.field}>
                                <span className={styles.fieldLabel}>Email</span>
                                <span className={styles.fieldValue}>{conversation.leadEmail}</span>
                                <button className={styles.fieldEdit}><Edit2 size={14} /></button>
                            </div>
                        )}
                        {conversation.leadCompany && (
                            <div className={styles.field}>
                                <span className={styles.fieldLabel}>Empresa</span>
                                <span className={styles.fieldValue}>{conversation.leadCompany}</span>
                                <button className={styles.fieldEdit}><Edit2 size={14} /></button>
                            </div>
                        )}
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
                            <span className={styles.fieldValue}>Não atribuído</span>
                            <button className={styles.fieldEdit}><Edit2 size={14} /></button>
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
        </div>
    );
};
