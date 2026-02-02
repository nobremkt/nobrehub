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
import '../../styles/chat.css';

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
        return formatDistanceToNow(timestamp, { addSuffix: false, locale: ptBR });
    };

    // Skeleton loader
    const SkeletonItem = () => (
        <div className="chat-skeleton-item">
            <div className="chat-skeleton-avatar" />
            <div className="chat-skeleton-content">
                <div className="chat-skeleton-line" style={{ width: '70%' }} />
                <div className="chat-skeleton-line short" />
            </div>
        </div>
    );

    return (
        <div className="chat-sidebar">
            {/* Header */}
            <div className="chat-sidebar-header">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="chat-sidebar-title">Mensagens</h2>
                    <button
                        onClick={() => setIsNewChatModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <Plus size={16} />
                        <span>Nova</span>
                    </button>
                </div>

                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    />
                </div>
            </div>

            {/* List */}
            <div className="chat-list">
                {isLoadingChats ? (
                    <>
                        <SkeletonItem />
                        <SkeletonItem />
                        <SkeletonItem />
                    </>
                ) : filteredChats.length === 0 ? (
                    <div className="chat-empty-state" style={{ padding: '2rem' }}>
                        <div className="chat-empty-icon" style={{ width: '80px', height: '80px', padding: '1.25rem' }}>
                            <MessageSquare size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="chat-empty-title" style={{ fontSize: '1rem' }}>
                            {searchTerm ? 'Nenhum resultado' : 'Nenhuma conversa'}
                        </h3>
                        <p className="chat-empty-description" style={{ fontSize: '0.875rem' }}>
                            {searchTerm
                                ? 'Tente buscar por outro nome'
                                : 'Inicie uma conversa com sua equipe'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setIsNewChatModalOpen(true)}
                                className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
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
                            <button
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                className={`chat-item ${isActive ? 'active' : ''}`}
                            >
                                {/* Avatar */}
                                <div className="chat-avatar relative">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt={name} />
                                    ) : (
                                        <div className="chat-avatar-placeholder">
                                            {chat.type === 'group' ? <Users size={22} /> : <User size={22} />}
                                        </div>
                                    )}

                                    {chat.type !== 'group' && (
                                        <div className="absolute bottom-0 right-0 border-2 border-surface-primary rounded-full">
                                            <UserStatusIndicator status={otherStatus} size="sm" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="chat-item-info">
                                    <div className="chat-item-header">
                                        <span className="chat-item-name">{name}</span>
                                        {lastMsg && (
                                            <span className="chat-item-time">
                                                {formatTime(lastMsg.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`chat-item-preview ${lastMsg?.senderId === currentAuthUid ? 'own-message' : ''}`}>
                                        {lastMsg ? (
                                            <>
                                                {lastMsg.senderId === currentAuthUid && 'Você: '}
                                                {lastMsg.content}
                                            </>
                                        ) : (
                                            <span className="italic text-text-muted">Nova conversa</span>
                                        )}
                                    </p>
                                </div>
                            </button>
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
