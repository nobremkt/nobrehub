/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - INBOX PAGE (ROUTE-BASED)
 * Layout 3 Painéis: Lista (esquerda) | Chat (centro) | Detalhes (direita)
 * 
 * URL: /inbox              → nenhuma conversa selecionada
 * URL: /inbox/:conversationId → conversa selecionada
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ConversationList } from '../components/ConversationList/ConversationList';
import { ChatView } from '../components/ChatView/ChatView';
import { ProfilePanel } from '../components/ProfilePanel/ProfilePanel';

import { useInboxStore } from '../stores/useInboxStore';

import styles from './InboxPage.module.css';

import { DevToolbar } from '../components/DevToolbar';

export const InboxPage: React.FC = () => {
    const { init, selectedConversationId, selectConversation } = useInboxStore();
    const { '*': conversationId } = useParams();

    // Inicializa conversas
    useEffect(() => {
        init();
    }, [init]);

    // Sync URL → State: quando a URL muda, seleciona a conversa
    useEffect(() => {
        const targetId = conversationId || null;
        if (targetId !== selectedConversationId) {
            selectConversation(targetId);
        }
    }, [conversationId, selectConversation]);

    return (
        <>
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
            {import.meta.env.DEV && <DevToolbar />}
        </>
    );
};
