import React, { useEffect, useRef } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
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
            <ChatHeader conversation={conversation} />

            <div className={styles.messagesArea}>
                {currentMessages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <ChatInput onSend={handleSendMessage} />
        </div>
    );
};
