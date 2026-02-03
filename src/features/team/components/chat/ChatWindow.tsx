import { useRef, useEffect, useState } from 'react';
import { useTeamChatStore } from '../../stores/useTeamChatStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { Spinner } from '@/design-system';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Phone, Video, Users, User, Info, MessageSquare } from 'lucide-react';
import { TeamMessage } from '../../types/chat';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';
import { GroupDetailsModal } from './GroupDetailsModal';
import styles from './ChatWindow.module.css';

export const ChatWindow = () => {
    const { activeChat, messages, isLoadingMessages, sendMessage } = useTeamChatStore();
    const { collaborators } = useCollaboratorStore();
    const teamStatus = useTeamStatus();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (content: string | Blob | File, type: 'text' | 'image' | 'file' | 'audio' = 'text') => {
        if (typeof content === 'string' && !content.trim()) return;
        await sendMessage(content, type);
    };

    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Get chat display info
    const getChatDisplayInfo = () => {
        if (!activeChat) return { name: '', photoUrl: null, isGroup: false };

        if (activeChat.type === 'group') {
            return {
                name: activeChat.name || 'Grupo',
                photoUrl: activeChat.photoUrl || null,
                isGroup: true,
                memberCount: activeChat.participants?.length || 0,
                otherId: undefined
            };
        }

        // For private chats, find the other user
        const currentUserId = useTeamChatStore.getState().currentUserId;
        const otherId = activeChat.participants?.find((uid: string) => uid !== currentUserId);
        const otherUser = collaborators.find(c => c.authUid === otherId);

        return {
            name: otherUser?.name || 'Usuário',
            photoUrl: otherUser?.photoUrl,
            isGroup: false,
            otherId: otherId // Returning ID to look up status
        };
    };

    const displayInfo = getChatDisplayInfo();

    // Empty State
    if (!activeChat) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <MessageSquare size={56} strokeWidth={1.5} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Selecione uma conversa</h3>
                    <p style={{ maxWidth: '300px' }}>
                        Escolha uma conversa da lista ou inicie uma nova para começar a conversar com sua equipe
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {displayInfo.photoUrl ? (
                        <img src={displayInfo.photoUrl} alt={displayInfo.name} className={styles.avatarImg} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {displayInfo.isGroup ? <Users size={24} /> : <User size={24} />}
                        </div>
                    )}
                    <div className={styles.headerInfo}>
                        <div className={styles.headerName}>{displayInfo.name}</div>
                        {displayInfo.isGroup ? (
                            <div className={styles.headerStatus}>
                                {displayInfo.memberCount} membros
                            </div>
                        ) : (
                            (() => {
                                const status = displayInfo.otherId ? teamStatus[displayInfo.otherId]?.state || 'offline' : 'offline';
                                let statusColor = 'var(--color-text-muted)';
                                let statusText = 'Offline';

                                switch (status) {
                                    case 'online':
                                        statusColor = 'var(--color-success-500)';
                                        statusText = 'Online';
                                        break;
                                    case 'idle':
                                        statusColor = 'var(--color-warning-500)';
                                        statusText = 'Ausente';
                                        break;
                                    case 'offline':
                                    default:
                                        statusColor = 'var(--color-text-muted)';
                                        statusText = 'Offline';
                                        break;
                                }

                                return (
                                    <div className={styles.headerStatus}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor }}></div>
                                        {statusText}
                                    </div>
                                );
                            })()
                        )}
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <button className={styles.headerActionBtn} title="Chamada de voz" disabled>
                        <Phone size={20} />
                    </button>
                    <button className={styles.headerActionBtn} title="Chamada de vídeo" disabled>
                        <Video size={20} />
                    </button>
                    <button
                        className={styles.headerActionBtn}
                        title="Informações"
                        onClick={() => {
                            if (activeChat.type === 'group') {
                                setIsGroupInfoOpen(true);
                            }
                        }}
                    >
                        <Info size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea}>
                {isLoadingMessages ? (
                    <div className={styles.loading}>
                        <Spinner />
                    </div>
                ) : messages.length === 0 ? (
                    <div className={styles.emptyState} style={{ background: 'transparent' }}>
                        <p>Nenhuma mensagem ainda. Diga olá! 👋</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg: TeamMessage, index: number) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                showSender={activeChat.type === 'group' &&
                                    (index === 0 || messages[index - 1]?.senderId !== msg.senderId)}
                                onImageClick={(url) => setLightboxImage(url)}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <ChatInput onSend={handleSendMessage} />

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '29px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Zoom"
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            cursor: 'default'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}


            {/* Group Info Modal */}
            {activeChat && activeChat.type === 'group' && (
                <GroupDetailsModal
                    isOpen={isGroupInfoOpen}
                    onClose={() => setIsGroupInfoOpen(false)}
                    chat={activeChat}
                />
            )}
        </div>
    );
};
