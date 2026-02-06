import { useAuthStore } from '@/stores/useAuthStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { TeamMessage } from '../../types/chat';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatBubble } from '@/design-system/components/Chat';

interface MessageBubbleProps {
    message: TeamMessage;
    showSender?: boolean;
    onImageClick?: (url: string) => void;
}

export const MessageBubble = ({ message, showSender = false, onImageClick }: MessageBubbleProps) => {
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

    const getMetadata = () => {
        if (message.attachments && message.attachments.length > 0) {
            return {
                fileName: message.attachments[0].name,
                // fileSize: message.attachments[0].size // If size existed
            };
        }
        // Fallback or parse from content URL
        return {};
    };

    const { fileName } = getMetadata();

    return (
        <ChatBubble
            content={message.content}
            type={message.type}
            isMine={isMine}
            senderName={senderName}
            showSender={showSender}
            senderAvatar={sender?.profilePhotoUrl || sender?.photoUrl}
            time={formatMessageTime(message.createdAt)}
            fileName={fileName}
            onImageClick={(url) => onImageClick ? onImageClick(url) : window.open(url, '_blank')}
            onFileClick={(url) => window.open(url, '_blank')}
        />
    );
};
