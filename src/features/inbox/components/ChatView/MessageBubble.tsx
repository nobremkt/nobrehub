import React from 'react';
import clsx from 'clsx';
import { Message } from '../../types';
import { Check, Clock } from 'lucide-react';
import styles from './ChatView.module.css';

interface MessageBubbleProps {
    message: Message;
}

const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isOut = message.direction === 'out';

    return (
        <div className={clsx(styles.bubbleRow, isOut ? styles.bubbleRowOut : styles.bubbleRowIn)}>
            <div className={clsx(styles.bubble, isOut ? styles.bubbleOut : styles.bubbleIn)}>
                <div className={styles.bubbleContent}>
                    {message.type === 'text' && message.content}
                    {message.type === 'image' && <div>[Imagem] {message.content}</div>}
                    {message.type === 'audio' && <div>[Áudio] {message.content}</div>}
                    {message.type === 'document' && <div>[Documento] {message.content}</div>}
                </div>

                <div className={styles.bubbleMeta}>
                    <span>
                        {/* @ts-ignore - Handle both timestamp and createdAt */}
                        {formatMessageTime(new Date(message.timestamp || message.createdAt || Date.now()))}
                    </span>
                    {isOut && (
                        <span className={styles.statusIcon}>
                            {message.status === 'pending' && <Clock size={14} className={styles.statusPending} />}
                            {message.status === 'sent' && <Check size={14} className={styles.statusSent} />}
                            {message.status === 'delivered' && (
                                <span className={styles.doubleCheck}>
                                    <Check size={14} />
                                    <Check size={14} style={{ marginLeft: '-8px' }} />
                                </span>
                            )}
                            {message.status === 'read' && (
                                <span className={styles.doubleCheck + ' ' + styles.statusRead}>
                                    <Check size={14} />
                                    <Check size={14} style={{ marginLeft: '-8px' }} />
                                </span>
                            )}
                            {message.status === 'failed' && <span className={styles.statusFailed}>!</span>}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
