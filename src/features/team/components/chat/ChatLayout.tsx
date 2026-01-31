import { useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { useTeamChatStore } from '../../stores/useTeamChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';

import { ArrowLeft } from 'lucide-react';
import '../../styles/chat.css';

export const ChatLayout = () => {
    const { activeChatId, init, cleanup } = useTeamChatStore();
    const { user } = useAuthStore();
    const { fetchCollaborators } = useCollaboratorStore();

    useEffect(() => {
        fetchCollaborators(); // Ensure collaborators are loaded

        // Use authUid (Firebase Auth UID) for realtime database paths
        const userId = user?.authUid || user?.id;
        if (userId) {
            init(userId);
        }
        return () => cleanup();
    }, [user, init, cleanup, fetchCollaborators]);

    const handleBack = () => {
        useTeamChatStore.getState().clearSelection();
    };

    return (
        <div className="chat-layout">
            {/* Sidebar - Hidden on mobile if chat active */}
            <div className={`
                    w-full md:w-auto h-full flex-col
                    ${activeChatId ? 'hidden md:flex' : 'flex'}
                `}>
                <ChatSidebar />
            </div>

            {/* Main Window - Hidden on mobile if no chat active */}
            <div className={`
                    flex-1 h-full min-w-0 flex-col relative
                    ${!activeChatId ? 'hidden md:flex' : 'flex'}
                `}>
                {/* Mobile Back Header */}
                {activeChatId && (
                    <div className="md:hidden absolute top-0 left-0 z-20 p-2">
                        <button
                            onClick={handleBack}
                            className="mobile-back-btn bg-surface-primary/80 backdrop-blur-sm rounded-full shadow-sm"
                        >
                            <ArrowLeft size={18} />
                            <span>Voltar</span>
                        </button>
                    </div>
                )}

                <ChatWindow />
            </div>
        </div>
    );
};
