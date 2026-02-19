import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { InboxService } from '../../services/InboxService';
import { StorageService } from '../../services/StorageService';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { DateSeparator } from './DateSeparator';
import { SessionWarning } from './SessionWarning';
import { SendTemplateModal } from '../SendTemplateModal';
import { InteractiveMessageModal } from '../InteractiveMessageModal/InteractiveMessageModal';
import type { TemplateComponent } from '../../types';
import { Lead360Modal } from '@/features/crm/components/Lead360Modal/Lead360Modal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
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
        sendMessage,
        updateConversationDetails,
        loadMoreMessages,
        isLoadingMore,
        hasMoreMessages,
    } = useInboxStore();

    const { user } = useAuthStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isInteractiveModalOpen, setIsInteractiveModalOpen] = useState(false);
    const [showLead360Modal, setShowLead360Modal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesAreaRef = useRef<HTMLDivElement>(null);
    const isInitialScrollRef = useRef(true);
    const prevConversationIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (collaborators.length === 0) {
            fetchCollaborators();
        }
    }, [collaborators.length, fetchCollaborators]);

    const conversation = conversations.find(c => c.id === selectedConversationId);
    const currentMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

    // Build reactionsMap from reaction-type messages
    const reactionsMap = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const msg of currentMessages) {
            if (msg.type !== 'reaction') continue;
            const emoji = msg.content || (msg.metadata?.emoji as string);
            const targetId = msg.metadata?.replyToMessageId as string;
            if (!emoji || !targetId) continue;
            const existing = map.get(targetId) || [];
            existing.push(emoji);
            map.set(targetId, existing);
        }
        return map;
    }, [currentMessages]);

    // Group non-reaction messages by date for rendering separators
    const messagesWithSeparators = useMemo(() => {
        const result: { type: 'separator' | 'message'; date?: Date; message?: typeof currentMessages[0] }[] = [];
        let lastDateKey = '';

        for (const msg of currentMessages) {
            // Skip reaction messages — they render as emoji badges on the target
            if (msg.type === 'reaction') continue;

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

    // Check if vendor has sent a template in the current session (after last inbound)
    const hasSentTemplateInSession = useMemo(() => {
        if (!lastInboundAt) return false;
        const outboundTemplates = currentMessages.filter(
            m => m.direction === 'out' && m.type === 'template' &&
                new Date(m.createdAt).getTime() >= lastInboundAt.getTime()
        );
        return outboundTemplates.length > 0;
    }, [currentMessages, lastInboundAt]);

    // Check if WhatsApp 24h session has expired (only for WhatsApp conversations)
    const isSessionExpired = useMemo(() => {
        if (!conversation || conversation.channel !== 'whatsapp') return false;
        if (!lastInboundAt) return true; // No inbound messages = expired

        const now = new Date();
        const hoursSinceLastInbound = (now.getTime() - lastInboundAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastInbound >= 24;
    }, [conversation, lastInboundAt]);

    // Free text is blocked ONLY when: session expired (window closed)
    // We removed the requirement for a template if the window is open (User Correction 13/02)
    const isInputBlocked = isSessionExpired;

    const scrollToBottom = useCallback((instant = true) => {
        const container = messagesAreaRef.current;
        if (!container) return;
        if (instant) {
            container.scrollTop = container.scrollHeight;
        } else {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    }, []);

    // Detect conversation switch vs new message
    useEffect(() => {
        if (selectedConversationId !== prevConversationIdRef.current) {
            // Conversation switched — instant scroll after DOM paint
            isInitialScrollRef.current = true;
            prevConversationIdRef.current = selectedConversationId;
            // Double rAF ensures React has committed and browser has painted
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    scrollToBottom(true);
                });
            });
            // Keep initial flag for 2s to catch late-loading media
            const timer = setTimeout(() => { isInitialScrollRef.current = false; }, 2000);
            return () => clearTimeout(timer);
        } else if (currentMessages.length > 0) {
            // New message in same conversation — smooth scroll
            scrollToBottom(false);
        }
    }, [currentMessages, selectedConversationId, scrollToBottom]);

    // Safety-net: re-scroll when images/videos load and change container height
    useEffect(() => {
        const container = messagesAreaRef.current;
        if (!container) return;

        const handleMediaLoad = () => {
            // Only auto-scroll if user is near the bottom (within 200px) or initial load
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
            if (isNearBottom || isInitialScrollRef.current) {
                container.scrollTop = container.scrollHeight;
            }
        };

        // Listen for load events on images/videos inside the container (capture phase)
        container.addEventListener('load', handleMediaLoad, true);
        return () => container.removeEventListener('load', handleMediaLoad, true);
    }, [selectedConversationId]);

    // Infinite scroll: load older messages when scrolling to top
    const handleScroll = useCallback(() => {
        const container = messagesAreaRef.current;
        if (!container || !selectedConversationId) return;
        if (isLoadingMore || !hasMoreMessages[selectedConversationId]) return;

        // Trigger when within 100px of the top
        if (container.scrollTop < 100) {
            const prevScrollHeight = container.scrollHeight;
            loadMoreMessages(selectedConversationId).then(() => {
                // Preserve scroll position after prepending older messages
                requestAnimationFrame(() => {
                    if (messagesAreaRef.current) {
                        const newScrollHeight = messagesAreaRef.current.scrollHeight;
                        messagesAreaRef.current.scrollTop = newScrollHeight - prevScrollHeight;
                    }
                });
            });
        }
    }, [selectedConversationId, isLoadingMore, hasMoreMessages, loadMoreMessages]);

    useEffect(() => {
        const container = messagesAreaRef.current;
        if (!container) return;
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

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
                undefined,
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
        components: TemplateComponent[],
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

    const handleSendInteractive = async (
        body: string,
        buttons: { id: string; title: string }[],
        header?: string
    ) => {
        if (!selectedConversationId) return;
        await InboxService.sendInteractiveMessage(
            selectedConversationId,
            body,
            buttons,
            header
        );
    };

    const handleAssign = async (userId: string | null) => {
        if (!selectedConversationId) return;

        const previousAssignedTo = conversation?.assignedTo;
        const assigneeName = userId
            ? collaborators.find(c => c.id === userId)?.name
            : undefined;

        // Optimistic update to avoid requiring full reload (F5)
        useInboxStore.setState((state) => ({
            conversations: state.conversations.map((conv) =>
                conv.id === selectedConversationId
                    ? {
                        ...conv,
                        assignedTo: userId || undefined,
                        updatedAt: new Date(),
                    }
                    : conv
            ),
        }));

        try {
            // For assignment system logs, actor should be the assignee (ex: Beatriz)
            const systemActorName = userId ? (assigneeName || user?.name || 'Sistema') : (user?.name || 'Sistema');
            await InboxService.assignConversation(selectedConversationId, userId, systemActorName);
        } catch (error) {
            // Rollback optimistic update if request fails
            useInboxStore.setState((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.id === selectedConversationId
                        ? {
                            ...conv,
                            assignedTo: previousAssignedTo,
                        }
                        : conv
                ),
            }));
            console.error('Failed to assign conversation:', error);
        }
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
                onToggleFavorite={handleToggleFavorite}
                onTogglePin={handleTogglePin}
                onOpenLead360={() => setShowLead360Modal(true)}
            />

            {/* WhatsApp 24h Session Warning */}
            {conversation.channel === 'whatsapp' && (
                <SessionWarning
                    lastInboundAt={lastInboundAt}
                    needsTemplateFirst={!hasSentTemplateInSession && !isSessionExpired}
                    onSendTemplate={() => setIsTemplateModalOpen(true)}
                />
            )}

            <div className={styles.messagesArea} ref={messagesAreaRef}>
                {/* Pagination loading indicator */}
                {isLoadingMore && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '12px',
                        color: 'var(--color-text-muted)',
                        fontSize: '13px',
                    }}>
                        Carregando mensagens anteriores...
                    </div>
                )}
                {messagesWithSeparators.map((item, index) =>
                    item.type === 'separator' ? (
                        <DateSeparator key={`sep-${index}`} date={item.date!} />
                    ) : (
                        <MessageBubble key={item.message!.id} message={item.message!} reactions={reactionsMap.get(item.message!.id)} />
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
                onOpenInteractive={() => setIsInteractiveModalOpen(true)}
                onScheduleMessage={handleScheduleMessage}
                disabled={isUploading || isInputBlocked}
                sessionExpired={isInputBlocked}
            />

            {/* Send Template Modal */}
            <SendTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSend={handleSendTemplate}
                conversation={conversation}
            />

            {/* Interactive Message Modal */}
            <InteractiveMessageModal
                isOpen={isInteractiveModalOpen}
                onClose={() => setIsInteractiveModalOpen(false)}
                onSend={handleSendInteractive}
            />

            {/* Lead360 Modal */}
            <Lead360Modal
                isOpen={showLead360Modal}
                onClose={() => setShowLead360Modal(false)}
                lead={{
                    id: conversation.leadId || conversation.id,
                    name: conversation.leadName,
                    phone: conversation.leadPhone,
                    email: conversation.leadEmail || '',
                    company: conversation.leadCompany || '',
                    status: conversation.dealStatus || 'open',
                    pipeline: (conversation.pipeline || 'high-ticket') as 'high-ticket' | 'low-ticket',
                    order: 0,
                    responsibleId: conversation.assignedTo || '',
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                    tags: conversation.tags || []
                }}
                onLeadStatusSync={async (data) => {
                    await updateConversationDetails(conversation.id, {
                        dealStatus: data.dealStatus,
                        status: data.status,
                        stage: data.stage,
                        lossReason: data.lossReason,
                    });
                }}
            />
        </div>
    );
};
