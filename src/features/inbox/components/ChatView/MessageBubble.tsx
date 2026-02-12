import React from 'react';
import { Message } from '../../types';
import { ChatBubble } from '@/design-system/components/Chat';

interface MessageBubbleProps {
    message: Message;
}

const formatMessageTime = (date: Date | number | string | undefined | null): string => {
    if (!date) return '';

    const d = date instanceof Date ? date : new Date(date);

    // Check for invalid date
    if (isNaN(d.getTime())) return '';

    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
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
        <ChatBubble
            content={contentUrl || ''}
            type={getType(message.type)}
            isMine={isOut}
            showSender={false}
            status={message.status}
            time={timeString}
            fileName={fileName}
            viewOnce={message.viewOnce}
            onImageClick={(url) => window.open(url, '_blank')}
            onFileClick={(url) => window.open(url, '_blank')}
        />
    );
};
