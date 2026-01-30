import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Conversation } from '../../types';
import { formatRelativeTime, getInitials } from '@/utils';
import styles from './ConversationList.module.css';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isActive,
    onClick
}) => {
    const lastMessageTime = useMemo(() => {
        if (!conversation.lastMessage) return '';
        // Handle both 'timestamp' (number from Realtime DB) and 'createdAt' (Date from mock)
        // @ts-ignore
        const dateVal = conversation.lastMessage.timestamp || conversation.lastMessage.createdAt;
        if (!dateVal) return '';

        return formatRelativeTime(new Date(dateVal));
    }, [conversation.lastMessage]);

    return (
        <div
            className={clsx(styles.item, { [styles.itemActive]: isActive })}
            onClick={onClick}
        >
            <div className={styles.avatar}>
                {conversation.leadAvatar ? (
                    <img src={conversation.leadAvatar} alt={conversation.leadName} className={styles.avatarImg} />
                ) : (
                    <span className={styles.initials}>{getInitials(conversation.leadName || '')}</span>
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.rowTop}>
                    <span className={styles.name}>{conversation.leadName}</span>
                    <span className={styles.time}>{lastMessageTime}</span>
                </div>

                <div className={styles.rowBottom}>
                    <span className={styles.preview}>
                        {conversation.lastMessage ? (
                            <>
                                {conversation.lastMessage.direction === 'out' && 'Você: '}
                                {conversation.lastMessage.type === 'text' ? conversation.lastMessage.content :
                                    conversation.lastMessage.type === 'audio' ? '🎵 Áudio' :
                                        conversation.lastMessage.type === 'image' ? '📷 Imagem' :
                                            '📎 Anexo'}
                            </>
                        ) : (
                            'Nova conversa'
                        )}
                    </span>

                    {conversation.unreadCount > 0 && (
                        <span className={styles.badge}>{conversation.unreadCount}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
