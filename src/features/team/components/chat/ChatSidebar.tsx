import { useState } from 'react';
import { useTeamChatStore } from '../../stores/useTeamChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { Plus, Search, User, Users, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewChatModal } from './NewChatModal';
import { UserStatusIndicator } from '@/features/presence/components/UserStatusIndicator';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';
import styles from './ChatSidebar.module.css';

export const ChatSidebar = () => {
    const { chats, selectChat, activeChatId, isLoadingChats } = useTeamChatStore();
    const { user } = useAuthStore();
    const { collaborators } = useCollaboratorStore();
    const teamStatus = useTeamStatus();

    const [searchTerm, setSearchTerm] = useState('');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

    // Get current user's authUid for consistent identification
    const currentAuthUid = user?.authUid || user?.id;

    // Filter chats
    const filteredChats = chats.filter(chat => {
        if (!searchTerm) return true;

        if (chat.type === 'group') {
            return chat.name?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        // For private chats, find the other user's name
        const otherId = chat.participants?.find((uid: string) => uid !== currentAuthUid);
        const otherUser = collaborators.find(c => c.authUid === otherId);
        return otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getChatName = (chat: any) => {
        if (chat.type === 'group') return chat.name;

        const otherId = chat.participants?.find((uid: string) => uid !== currentAuthUid);
        const otherUser = collaborators.find(c => c.authUid === otherId);
        return otherUser?.name || 'Usuário Desconhecido';
    };

    const getChatImage = (chat: any) => {
        if (chat.type === 'group') return null;
        const otherId = chat.participants?.find((uid: string) => uid !== currentAuthUid);
        const otherUser = collaborators.find(c => c.authUid === otherId);
        return otherUser?.photoUrl;
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return '';
        try {
            return formatDistanceToNow(timestamp, { addSuffix: false, locale: ptBR });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h2 className={styles.title}>
                        <MessageSquare size={20} />
                        Mensagens
                    </h2>
                    <button
                        onClick={() => setIsNewChatModalOpen(true)}
                        className={styles.newChatButton}
                    >
                        <Plus size={16} />
                        Nova
                    </button>
                </div>

                <div className={styles.search}>
                    <div className={styles.inputWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar conversas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className={styles.list}>
                {isLoadingChats ? (
                    <div className={styles.emptyState}>Carregando...</div>
                ) : filteredChats.length === 0 ? (
                    <div className={styles.emptyState}>
                        <MessageSquare size={32} strokeWidth={1.5} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {searchTerm ? 'Nenhum resultado' : 'Nenhuma conversa'}
                        </h3>
                        <p style={{ fontSize: '0.875rem' }}>
                            {searchTerm
                                ? 'Tente buscar por outro nome'
                                : 'Inicie uma conversa com sua equipe'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setIsNewChatModalOpen(true)}
                                style={{ color: 'var(--color-primary-500)', marginTop: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                            >
                                Iniciar nova conversa →
                            </button>
                        )}
                    </div>
                ) : (
                    filteredChats.map(chat => {
                        const name = getChatName(chat);
                        const photoUrl = getChatImage(chat);
                        const isActive = chat.id === activeChatId;
                        const lastMsg = chat.lastMessage;

                        const otherId = chat.type !== 'group' && chat.participants?.find((uid: string) => uid !== currentAuthUid);
                        const otherStatus = otherId ? teamStatus[otherId]?.state : 'offline';

                        return (
                            <div
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                            >
                                {/* Avatar */}
                                <div className={styles.avatar}>
                                    {photoUrl ? (
                                        <img src={photoUrl} alt={name} className={styles.avatarImg} />
                                    ) : (
                                        chat.type === 'group' ? <Users size={20} /> : <User size={20} />
                                    )}

                                    {chat.type !== 'group' && (
                                        <div className="absolute bottom-0 right-0 border-2 border-surface-primary rounded-full">
                                            <UserStatusIndicator status={otherStatus} size="sm" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className={styles.content}>
                                    <div className={styles.rowTop}>
                                        <span className={styles.name}>{name}</span>
                                        {lastMsg && (
                                            <span className={styles.time}>
                                                {formatTime(lastMsg.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.preview}>
                                        {lastMsg ? (
                                            <>
                                                {lastMsg.senderId === currentAuthUid && <span className={styles.ownMessage}>Você: </span>}
                                                {lastMsg.content}
                                            </>
                                        ) : (
                                            <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Nova conversa</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <NewChatModal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
            />
        </div>
    );
};
