import { useRef, useEffect } from 'react';
import { useTeamChatStore } from '../../stores/useTeamChatStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { Spinner } from '@/design-system';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Phone, Video, Users, User, Info, MessageSquare } from 'lucide-react';
import { TeamMessage } from '../../types/chat';
import styles from './ChatWindow.module.css';

export const ChatWindow = () => {
    const { activeChat, messages, isLoadingMessages, sendMessage } = useTeamChatStore();
    const { collaborators } = useCollaboratorStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Get chat display info
    const getChatDisplayInfo = () => {
        if (!activeChat) return { name: '', photoUrl: null, isGroup: false };

        if (activeChat.type === 'group') {
            return {
                name: activeChat.name || 'Grupo',
                photoUrl: null,
                isGroup: true,
                memberCount: activeChat.participants?.length || 0
            };
        }

        // For private chats, find the other user
        const currentUserId = useTeamChatStore.getState().currentUserId;
        const otherId = activeChat.participants?.find((uid: string) => uid !== currentUserId);
        const otherUser = collaborators.find(c => c.authUid === otherId);

        return {
            name: otherUser?.name || 'Usuário',
            photoUrl: otherUser?.photoUrl,
            isGroup: false
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
                            <div className={styles.headerStatus}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-success-500)' }}></div>
                                Online
                            </div>
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
                    <button className={styles.headerActionBtn} title="Informações">
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
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <ChatInput onSend={handleSendMessage} />
        </div>
    );
};
