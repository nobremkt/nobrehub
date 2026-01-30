import { useRef, useEffect } from 'react';
import { useTeamChatStore } from '../../stores/useTeamChatStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { Spinner } from '@/design-system';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Phone, Video, Users, User, Info, MessageSquare } from 'lucide-react';
import { TeamMessage } from '../../types/chat';
import '../../styles/chat.css';

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

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;
        await sendMessage(content);
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
            <div className="chat-window">
                <div className="chat-empty-state">
                    <div className="chat-empty-icon">
                        <MessageSquare size={56} strokeWidth={1.5} />
                    </div>
                    <h3 className="chat-empty-title">Selecione uma conversa</h3>
                    <p className="chat-empty-description">
                        Escolha uma conversa da lista ou inicie uma nova para começar a conversar com sua equipe
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <div className="chat-header-avatar">
                        {displayInfo.photoUrl ? (
                            <img src={displayInfo.photoUrl} alt={displayInfo.name} />
                        ) : (
                            <div className="chat-avatar-placeholder">
                                {displayInfo.isGroup ? <Users size={24} /> : <User size={24} />}
                            </div>
                        )}
                    </div>
                    <div className="chat-header-details">
                        <h3>{displayInfo.name}</h3>
                        {displayInfo.isGroup ? (
                            <span className="text-xs text-text-muted">
                                {displayInfo.memberCount} membros
                            </span>
                        ) : (
                            <span className="chat-header-status">Online</span>
                        )}
                    </div>
                </div>

                <div className="chat-header-actions">
                    <button className="chat-header-action-btn" title="Chamada de voz" disabled>
                        <Phone size={18} />
                    </button>
                    <button className="chat-header-action-btn" title="Chamada de vídeo" disabled>
                        <Video size={18} />
                    </button>
                    <button className="chat-header-action-btn" title="Informações">
                        <Info size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {isLoadingMessages ? (
                    <div className="chat-loading">
                        <Spinner />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty-state" style={{ padding: '3rem' }}>
                        <p className="text-text-muted text-sm">
                            Nenhuma mensagem ainda. Diga olá! 👋
                        </p>
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
