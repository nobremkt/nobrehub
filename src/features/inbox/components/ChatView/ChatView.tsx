import React, { useEffect, useRef } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { InboxService } from '../../services/InboxService';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import styles from './ChatView.module.css';

export const ChatView: React.FC = () => {
    const {
        conversations,
        selectedConversationId,
        messages,
        sendMessage
    } = useInboxStore();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversation = conversations.find(c => c.id === selectedConversationId);
    const currentMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages, selectedConversationId]);

    const handleSendMessage = async (text: string) => {
        if (!selectedConversationId) return;
        await sendMessage(text);
    };

    const handleSendMedia = async (file: File, type: 'image' | 'video' | 'audio' | 'document') => {
        if (!selectedConversationId) return;

        // For now, we'll need to upload to a storage service first
        // This is a placeholder - in production, upload to Firebase Storage or similar
        console.log('Media upload:', file.name, type);

        // TODO: Implement file upload to Firebase Storage
        // const mediaUrl = await uploadToStorage(file);
        // await InboxService.sendMediaMessage(selectedConversationId, mediaUrl, type, file.name);

        alert('Envio de mídia em desenvolvimento. Em breve!');
    };

    const handleAssign = async (userId: string | null) => {
        if (!selectedConversationId) return;
        await InboxService.assignConversation(selectedConversationId, userId);
    };

    const handleCloseConversation = async () => {
        if (!selectedConversationId) return;
        await InboxService.toggleConversationStatus(selectedConversationId);
    };

    if (!selectedConversationId || !conversation) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    Selecione uma conversa para iniciar o atendimento
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <ChatHeader
                conversation={conversation}
                onAssign={handleAssign}
                onCloseConversation={handleCloseConversation}
            />

            <div className={styles.messagesArea}>
                {currentMessages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <ChatInput
                onSend={handleSendMessage}
                onSendMedia={handleSendMedia}
            />
        </div>
    );
};
