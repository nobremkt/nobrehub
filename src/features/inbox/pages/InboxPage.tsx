/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - INBOX PAGE (REFACTORED)
 * Layout 3 Painéis: Lista (esquerda) | Chat (centro) | Detalhes (direita)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect } from 'react';
import { ConversationList } from '../components/ConversationList/ConversationList';
import { ChatView } from '../components/ChatView/ChatView';
import { ProfilePanel } from '../components/ProfilePanel/ProfilePanel';
import { AppLayout } from '@/design-system/layouts';
import { useInboxStore } from '../stores/useInboxStore';

import styles from './InboxPage.module.css';

import { DevToolbar } from '../components/DevToolbar';

export const InboxPage: React.FC = () => {
    const { init, selectedConversationId } = useInboxStore();

    useEffect(() => {
        init();
    }, [init]);

    return (
        <AppLayout fullWidth>
            <div className={`${styles.container} ${selectedConversationId ? styles.chatActive : ''}`}>
                {/* Painel Esquerdo - Lista de Conversas */}
                <div className={styles.conversationListWrapper}>
                    <ConversationList />
                </div>

                {/* Painel Central - Chat View */}
                <div className={styles.chatViewWrapper}>
                    <ChatView />
                </div>

                {/* Painel Direito - Detalhes do Contato */}
                <div className={styles.sidebarWrapper}>
                    <ProfilePanel />
                </div>
            </div>
            <DevToolbar />
        </AppLayout>
    );
};
