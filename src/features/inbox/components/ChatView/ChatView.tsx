import React, { useEffect, useRef, useState } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { InboxService } from '../../services/InboxService';
import { StorageService } from '../../services/StorageService';
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

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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

        // Validate file size
        if (!StorageService.validateFileSize(file)) {
            setUploadError('Arquivo muito grande. Máximo: 16MB');
            setTimeout(() => setUploadError(null), 3000);
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // Upload to Firebase Storage
            const mediaUrl = await StorageService.uploadMedia(selectedConversationId, file);

            // Send the media message
            await InboxService.sendMediaMessage(
                selectedConversationId,
                mediaUrl,
                type,
                file.name
            );
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadError('Falha ao enviar arquivo. Tente novamente.');
            setTimeout(() => setUploadError(null), 3000);
        } finally {
            setIsUploading(false);
        }
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

            {/* Upload Status */}
            {isUploading && (
                <div style={{
                    position: 'absolute',
                    bottom: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    padding: '12px 24px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    zIndex: 100
                }}>
                    <div className={styles.spinner} />
                    <span>Enviando arquivo...</span>
                </div>
            )}

            {/* Error Message */}
            {uploadError && (
                <div style={{
                    position: 'absolute',
                    bottom: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-danger-500)',
                    color: 'white',
                    borderRadius: 12,
                    padding: '12px 24px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100
                }}>
                    {uploadError}
                </div>
            )}

            <ChatInput
                onSend={handleSendMessage}
                onSendMedia={handleSendMedia}
                disabled={isUploading}
            />
        </div>
    );
};
