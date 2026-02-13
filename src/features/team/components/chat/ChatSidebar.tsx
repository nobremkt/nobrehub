import { useState, useEffect } from 'react';
import { useTeamChatStore } from '../../stores/useTeamChatStore';
import type { TeamChat } from '../../types/chat';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { Plus, Search, Users, MessageSquare, MoreVertical, Pin, PinOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewChatModal } from './NewChatModal';
import { UserStatusIndicator } from '@/features/presence/components/UserStatusIndicator';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';
import { Input, Avatar } from '@/design-system';
import styles from './ChatSidebar.module.css';

export const ChatSidebar = () => {
    const { chats, selectChat, activeChatId, isLoadingChats, togglePin } = useTeamChatStore();
    const { user } = useAuthStore();
    const { collaborators } = useCollaboratorStore();
    const teamStatus = useTeamStatus();

    const [searchTerm, setSearchTerm] = useState('');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

    // State for the hover menu
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

    const getChatName = (chat: TeamChat) => {
        if (chat.type === 'group') return chat.name;

        const otherId = chat.participants?.find((uid: string) => uid !== currentAuthUid);
        const otherUser = collaborators.find(c => c.authUid === otherId);
        return otherUser?.name || 'Usuário Desconhecido';
    };

    const getChatImage = (chat: TeamChat) => {
        if (chat.type === 'group') return null;
        const otherId = chat.participants?.find((uid: string) => uid !== currentAuthUid);
        const otherUser = collaborators.find(c => c.authUid === otherId);
        return otherUser?.profilePhotoUrl || otherUser?.photoUrl;
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return '';
        try {
            return formatDistanceToNow(timestamp, { addSuffix: false, locale: ptBR });
        } catch (e) {
            return '';
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (openMenuId) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [openMenuId]);

    const handleTogglePin = (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        togglePin(chatId);
        setOpenMenuId(null);
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
                    <Input
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={16} />}
                        fullWidth
                    />
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
                        const isPinned = chat.pinned;

                        const otherId = chat.type !== 'group' && chat.participants?.find((uid: string) => uid !== currentAuthUid);
                        const otherStatus = otherId ? teamStatus[otherId]?.state : 'offline';

                        return (
                            <div
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                className={`${styles.item} ${isActive ? styles.itemActive : ''} group relative`}
                                style={{ zIndex: openMenuId === chat.id ? 50 : 1 }}
                            >
                                {/* Avatar */}
                                <div className={styles.avatarContainer}>
                                    {chat.type === 'group' && !chat.photoUrl ? (
                                        <div className={styles.groupAvatar}>
                                            <Users size={20} />
                                        </div>
                                    ) : (
                                        <Avatar
                                            src={chat.type === 'group' ? chat.photoUrl : photoUrl}
                                            alt={name}
                                            size="md"
                                            fallback={name?.substring(0, 2).toUpperCase()}
                                        />
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
                                        <span className={styles.name}>
                                            {isPinned && <Pin size={12} className="text-text-muted rotate-45 mr-1 inline" fill="currentColor" />}
                                            {name}
                                        </span>
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

                                {/* 3-dot Menu Trigger (Visible on Hover or if Menu Open) */}
                                <div className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${openMenuId === chat.id ? 'opacity-100' : ''}`}>
                                    <button
                                        className="p-1.5 rounded-full hover:bg-surface-tertiary text-text-muted hover:text-text-primary bg-surface-secondary shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                                        }}
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {/* Simple Dropdown Menu */}
                                    {openMenuId === chat.id && (
                                        <div
                                            className="absolute right-0 top-full mt-1 w-32 bg-surface-primary border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
                                                onClick={(e) => handleTogglePin(e, chat.id)}
                                            >
                                                {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                                {isPinned ? 'Desanexar' : 'Anexar'}
                                            </button>
                                        </div>
                                    )}
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
