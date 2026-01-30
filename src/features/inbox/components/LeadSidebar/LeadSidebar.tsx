import React from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { Button, Tag } from '@/design-system';
import { Mail, Phone, User, ExternalLink } from 'lucide-react';
import { getInitials } from '@/utils';
import styles from './LeadSidebar.module.css';

export const LeadSidebar: React.FC = () => {
    const { selectedConversationId, conversations } = useInboxStore();
    const conversation = conversations.find(c => c.id === selectedConversationId);

    if (!selectedConversationId || !conversation) {
        return <div className={styles.sidebar} />;
    }

    return (
        <div className={styles.sidebar}>
            <div className={styles.section}>
                <div className={styles.header}>
                    <div className={styles.avatar}>
                        {conversation.leadAvatar ? (
                            <img src={conversation.leadAvatar} alt={conversation.leadName} className={styles.avatarImg} />
                        ) : (
                            getInitials(conversation.leadName)
                        )}
                    </div>
                    <div className={styles.name}>{conversation.leadName}</div>
                    {conversation.leadCompany && (
                        <div className={styles.company}>{conversation.leadCompany}</div>
                    )}
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" size="sm" leftIcon={<User size={16} />}>Perfil</Button>
                    <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={16} />}>CRM</Button>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Contatos</div>

                <div className={styles.infoRow}>
                    <Phone size={16} />
                    <span>{conversation.leadPhone}</span>
                </div>

                {conversation.leadEmail && (
                    <div className={styles.infoRow}>
                        <Mail size={16} />
                        <span>{conversation.leadEmail}</span>
                    </div>
                )}
            </div>

            {conversation.tags && conversation.tags.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Tags</div>
                    <div className={styles.tags}>
                        {conversation.tags.map(tag => (
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
                    </div>
                </div>
            )}

            {conversation.notes && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Notas</div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                        {conversation.notes}
                    </p>
                </div>
            )}
        </div>
    );
};
