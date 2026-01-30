import { useAuthStore } from '@/stores/useAuthStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { TeamMessage } from '../../types/chat';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '../../styles/chat.css';

interface MessageBubbleProps {
    message: TeamMessage;
    showSender?: boolean;
}

export const MessageBubble = ({ message, showSender = false }: MessageBubbleProps) => {
    const { user } = useAuthStore();
    const { collaborators } = useCollaboratorStore();

    // Use authUid for consistent identification
    const currentAuthUid = user?.authUid || user?.id;
    const isMine = message.senderId === currentAuthUid;

    // Find sender details
    const sender = collaborators.find(c => c.authUid === message.senderId);
    const senderName = sender?.name || 'Usuário';

    // Format time
    const formatMessageTime = (timestamp: number) => {
        const date = new Date(timestamp);

        if (isToday(date)) {
            return format(date, 'HH:mm', { locale: ptBR });
        } else if (isYesterday(date)) {
            return `Ontem ${format(date, 'HH:mm', { locale: ptBR })}`;
        } else {
            return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
        }
    };

    return (
        <div className={`message-wrapper ${isMine ? 'own' : 'other'}`}>
            <div className={`message-bubble ${isMine ? 'own' : 'other'}`}>
                {!isMine && showSender && (
                    <div className="message-sender">{senderName}</div>
                )}
                <div className="message-content">{message.content}</div>
                <div className="message-time">{formatMessageTime(message.createdAt)}</div>
            </div>
        </div>
    );
};
