import React from 'react';
import { Message } from '../../types';
import { ChatBubble } from '@/design-system/components/Chat';

interface MessageBubbleProps {
    message: Message;
}

const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isOut = message.direction === 'out';

    const getType = (msgType: string): 'text' | 'image' | 'video' | 'file' | 'audio' | 'system' => {
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

    const timeString = message.createdAt instanceof Date
        ? formatMessageTime(message.createdAt)
        : formatMessageTime(new Date(message.createdAt));

    return (
        <ChatBubble
            content={contentUrl || ''}
            type={getType(message.type)}
            isMine={isOut}
            showSender={false}
            status={message.status}
            time={timeString}
            fileName={fileName}
            onImageClick={(url) => window.open(url, '_blank')}
            onFileClick={(url) => window.open(url, '_blank')}
        />
    );
};
