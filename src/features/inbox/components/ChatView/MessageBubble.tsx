import React from 'react';
import clsx from 'clsx';
import { Message } from '../../types';
import { Check, CheckCircle, Clock } from 'lucide-react';
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
                        <span style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
                            {message.status === 'pending' && <Clock size={12} />}
                            {message.status === 'sent' && <Check size={12} />}
                            {message.status === 'delivered' && <Check size={12} />}
                            {message.status === 'read' && <CheckCircle size={12} color="#65d072" />}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
