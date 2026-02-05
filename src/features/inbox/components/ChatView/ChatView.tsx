import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { InboxService } from '../../services/InboxService';
import { StorageService } from '../../services/StorageService';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { DateSeparator } from './DateSeparator';
import { SessionWarning } from './SessionWarning';
import { SendTemplateModal } from '../SendTemplateModal';
import { Lead360Modal } from '@/features/crm/components/Lead360Modal/Lead360Modal';
import styles from './ChatView.module.css';

/**
 * Helper to get date key for grouping (YYYY-MM-DD)
 */
const getDateKey = (date: Date | number | string): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const ChatView: React.FC = () => {
    const {
        conversations,
        selectedConversationId,
        messages,
        sendMessage
    } = useInboxStore();

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [showLead360Modal, setShowLead360Modal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversation = conversations.find(c => c.id === selectedConversationId);
    const currentMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

    // Group messages by date for rendering separators
    const messagesWithSeparators = useMemo(() => {
        const result: { type: 'separator' | 'message'; date?: Date; message?: typeof currentMessages[0] }[] = [];
        let lastDateKey = '';

        for (const msg of currentMessages) {
            const msgDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
            const dateKey = getDateKey(msgDate);

            if (dateKey !== lastDateKey) {
                result.push({ type: 'separator', date: msgDate });
                lastDateKey = dateKey;
            }

            result.push({ type: 'message', message: msg });
        }

        return result;
    }, [currentMessages]);

    // Find last inbound message for WhatsApp 24h window calculation
    const lastInboundAt = useMemo(() => {
        const inboundMessages = currentMessages.filter(m => m.direction === 'in');
        if (inboundMessages.length === 0) return undefined;
        const lastInbound = inboundMessages[inboundMessages.length - 1];
        return lastInbound.createdAt ? new Date(lastInbound.createdAt) : undefined;
    }, [currentMessages]);

    // Check if WhatsApp 24h session has expired (only for WhatsApp conversations)
    const isSessionExpired = useMemo(() => {
        if (!conversation || conversation.channel !== 'whatsapp') return false;
        if (!lastInboundAt) return true; // No inbound messages = expired

        const now = new Date();
        const hoursSinceLastInbound = (now.getTime() - lastInboundAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastInbound >= 24;
    }, [conversation, lastInboundAt]);

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

    const handleSendMedia = async (file: File, type: 'image' | 'video' | 'audio' | 'document', caption?: string, viewOnce?: boolean) => {
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

            // Send the media message with caption and viewOnce support
            await InboxService.sendMediaMessage(
                selectedConversationId,
                mediaUrl,
                type,
                caption || file.name,
                'agent',
                viewOnce
            );
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadError('Falha ao enviar arquivo. Tente novamente.');
            setTimeout(() => setUploadError(null), 3000);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendTemplate = async (
        templateName: string,
        language: string,
        components: any[],
        previewText: string
    ) => {
        if (!selectedConversationId) return;
        await InboxService.sendTemplateMessage(
            selectedConversationId,
            templateName,
            language,
            components,
            previewText
        );
    };

    const handleAssign = async (userId: string | null) => {
        if (!selectedConversationId) return;
        await InboxService.assignConversation(selectedConversationId, userId);
    };

    const handleCloseConversation = async () => {
        if (!selectedConversationId) return;
        await InboxService.toggleConversationStatus(selectedConversationId);
    };

    const handleToggleFavorite = async () => {
        if (!selectedConversationId) return;
        await InboxService.toggleFavorite(selectedConversationId);
    };

    const handleTogglePin = async () => {
        if (!selectedConversationId) return;
        await InboxService.togglePin(selectedConversationId);
    };

    const handleScheduleMessage = async (text: string, scheduledFor: Date) => {
        if (!selectedConversationId) return;
        await InboxService.scheduleMessage(selectedConversationId, text, scheduledFor);
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
                onToggleFavorite={handleToggleFavorite}
                onTogglePin={handleTogglePin}
                onOpenLead360={() => setShowLead360Modal(true)}
            />

            {/* WhatsApp 24h Session Warning */}
            {conversation.channel === 'whatsapp' && (
                <SessionWarning
                    lastInboundAt={lastInboundAt}
                    onSendTemplate={() => setIsTemplateModalOpen(true)}
                />
            )}

            <div className={styles.messagesArea}>
                {messagesWithSeparators.map((item, index) =>
                    item.type === 'separator' ? (
                        <DateSeparator key={`sep-${index}`} date={item.date!} />
                    ) : (
                        <MessageBubble key={item.message!.id} message={item.message!} />
                    )
                )}
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
                onOpenTemplate={() => setIsTemplateModalOpen(true)}
                onScheduleMessage={handleScheduleMessage}
                disabled={isUploading || isSessionExpired}
                sessionExpired={isSessionExpired}
            />

            {/* Send Template Modal */}
            <SendTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSend={handleSendTemplate}
                conversation={conversation}
            />

            {/* Lead360 Modal */}
            <Lead360Modal
                isOpen={showLead360Modal}
                onClose={() => setShowLead360Modal(false)}
                lead={{
                    id: conversation.id,
                    name: conversation.leadName,
                    phone: conversation.leadPhone,
                    email: conversation.leadEmail || '',
                    company: conversation.leadCompany || '',
                    status: conversation.dealStatus || 'open',
                    pipeline: 'high-ticket',
                    order: 0,
                    responsibleId: conversation.assignedTo || '',
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                    tags: conversation.tags || []
                }}
            />
        </div>
    );
};
