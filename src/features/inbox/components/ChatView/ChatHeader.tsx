import React from 'react';
import { Conversation } from '../../types';
import { Button, Tag } from '@/design-system';
import { MoreVertical, Phone, CheckCircle } from 'lucide-react';
import styles from './ChatView.module.css';

interface ChatHeaderProps {
    conversation: Conversation;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation }) => {
    return (
        <div className={styles.header}>
            <div className={styles.headerLeft}>
                <div className={styles.headerInfo}>
                    <span className={styles.headerName}>{conversation.leadName}</span>
                    <span className={styles.headerStatus}>
                        {conversation.leadCompany ? `${conversation.leadCompany} • ` : ''}
                        {conversation.leadPhone}
                    </span>
                </div>
            </div>

            <div className={styles.headerRight}>
                {conversation.status === 'open' ? (
                    <Tag variant="success" size="sm">Aberto</Tag>
                ) : (
                    <Tag variant="default" size="sm">Fechado</Tag>
                )}

                <div className={styles.actions}>
                    <Button variant="ghost" size="sm">
                        <CheckCircle size={18} />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Phone size={18} />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <MoreVertical size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
