import React from 'react';
import { Message } from '../../types';
import { ChatBubble } from '@/design-system/components/Chat';

interface MessageBubbleProps {
    message: Message;
    reactions?: string[];
}

const formatMessageTime = (date: Date | number | string | undefined | null): string => {
    if (!date) return '';

    const d = date instanceof Date ? date : new Date(date);

    // Check for invalid date
    if (isNaN(d.getTime())) return '';

    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, reactions }) => {
    const isOut = message.direction === 'out';

    const getType = (msgType: string): 'text' | 'image' | 'video' | 'file' | 'audio' | 'system' => {
        if (msgType === 'system') return 'system';
        if (msgType === 'document') return 'file';
        if (msgType === 'image') return 'image';
        if (msgType === 'video') return 'video';
        if (msgType === 'audio') return 'audio';
        return 'text';
    };

    // Use mediaUrl for media types if available, otherwise fallback to content
    const contentUrl = (['image', 'video', 'audio', 'document'].includes(message.type) && message.mediaUrl)
        ? message.mediaUrl
        : message.content;

    // Use mediaName for filename if available
    const fileName = message.mediaName || (message.type === 'document' ? 'Documento' : undefined);

    const timeString = formatMessageTime(message.createdAt);

    return (
        <div style={{ position: 'relative' }}>
            <ChatBubble
                content={contentUrl || ''}
                type={getType(message.type)}
                isMine={isOut}
                showSender={false}
                status={message.status === 'scheduled' ? 'pending' : message.status as 'pending' | 'sent' | 'delivered' | 'read' | 'failed'}
                time={timeString}
                fileName={fileName}
                viewOnce={message.viewOnce}
                onImageClick={(url) => window.open(url, '_blank')}
                onFileClick={(url) => window.open(url, '_blank')}
            />
            {reactions && reactions.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '-8px',
                    justifyContent: isOut ? 'flex-end' : 'flex-start',
                    paddingLeft: isOut ? undefined : '8px',
                    paddingRight: isOut ? '8px' : undefined,
                }}>
                    <span style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px 6px',
                        fontSize: '14px',
                        lineHeight: '1',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                    }}>
                        {reactions.join('')}
                    </span>
                </div>
            )}
        </div>
    );
};

