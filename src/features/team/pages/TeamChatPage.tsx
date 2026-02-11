import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useTeamChatStore } from '../stores/useTeamChatStore';

import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import styles from './TeamChatPage.module.css';

export const TeamChatPage: React.FC = () => {
    const { chatId: urlChatId } = useParams<{ chatId?: string }>();
    const { activeChatId, clearSelection, selectChat, chats } = useTeamChatStore();
    const { fetchCollaborators } = useCollaboratorStore();

    useEffect(() => {
        fetchCollaborators();

        // Init is now handled globally by TeamChatListener in MainLayout
        // We only need to clear selection when leaving this page
        return () => clearSelection();
    }, [clearSelection, fetchCollaborators]);

    // Deep link: auto-select chat from URL param
    useEffect(() => {
        if (urlChatId && urlChatId !== activeChatId && chats.length > 0) {
            const chatExists = chats.find(c => c.id === urlChatId);
            if (chatExists) {
                selectChat(urlChatId);
            }
        }
    }, [urlChatId, chats, activeChatId, selectChat]);

    return (
        <div className={`${styles.container} ${activeChatId ? styles.chatActive : ''}`}>
            {/* Painel Esquerdo - Lista de Conversas */}
            <div className={styles.conversationListWrapper}>
                <ChatSidebar />
            </div>

            {/* Painel Central - Chat View */}
            <div className={styles.chatViewWrapper}>
                <ChatWindow />
            </div>

            {/* Painel Direito - (Opcional/Futuro) */}
            <div className={styles.sidebarWrapper}>
                {/* <TeamProfilePanel /> */}
            </div>
        </div>
    );
};
