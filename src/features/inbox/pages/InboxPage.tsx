/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - INBOX PAGE (REFACTORED)
 * Layout 3 Painéis: Lista (esquerda) | Chat (centro) | Detalhes (direita)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConversationList } from '../components/ConversationList/ConversationList';
import { ChatView } from '../components/ChatView/ChatView';
import { ProfilePanel } from '../components/ProfilePanel/ProfilePanel';

import { useInboxStore } from '../stores/useInboxStore';
import { InboxService } from '../services/InboxService';

import styles from './InboxPage.module.css';

import { DevToolbar } from '../components/DevToolbar';

export const InboxPage: React.FC = () => {
    const { init, conversations, selectedConversationId, selectConversation } = useInboxStore();
    const [searchParams, setSearchParams] = useSearchParams();

    // Flag: já processou a URL inicial?
    const hasInitializedFromUrl = useRef(false);
    // Flag: está criando conversa?
    const isCreatingConversation = useRef(false);

    // Inicializa conversas
    useEffect(() => {
        init();
    }, [init]);

    // Normaliza telefone para comparação (remove caracteres não-numéricos)
    const normalizePhone = (phone: string): string => {
        return phone?.replace(/\D/g, '') || '';
    };

    // Telefones já processados (para evitar duplicatas)
    const processedPhones = useRef<Set<string>>(new Set());

    // Processa phone da URL (SEMPRE - para navegação do Kanban/Lead360)
    useEffect(() => {
        const phone = searchParams.get('phone');
        if (!phone) return;
        if (isCreatingConversation.current) return;

        // Normaliza telefone
        const normalizedPhone = normalizePhone(phone);

        // Evita reprocessar o mesmo telefone
        if (processedPhones.current.has(normalizedPhone)) {
            console.log('[InboxPage] Phone already processed, skipping:', normalizedPhone);
            return;
        }

        console.log('[InboxPage] Processing phone:', phone);

        // Busca conversa pelo telefone normalizado
        const conversation = conversations.find(c =>
            normalizePhone(c.leadPhone) === normalizedPhone
        );

        console.log('[InboxPage] Phone from URL:', phone, '- Found:', !!conversation, '- Conversations loaded:', conversations.length);

        if (conversation) {
            // Marca como processado
            processedPhones.current.add(normalizedPhone);
            selectConversation(conversation.id);
            setSearchParams({ id: conversation.id }, { replace: true });
        } else if (conversations.length > 0) {
            // IMPORTANTE: Marca como processado ANTES de criar para evitar duplicatas
            processedPhones.current.add(normalizedPhone);

            // Captura todos os params ANTES de mudar a URL
            const name = searchParams.get('name') || 'Novo Contato';
            const email = searchParams.get('email') || undefined;
            const company = searchParams.get('company') || undefined;
            const leadId = searchParams.get('leadId') || undefined;

            console.log('[InboxPage] Creating new conversation for:', { name, phone, email, company, leadId });

            isCreatingConversation.current = true;

            InboxService.createConversation({
                leadId,
                leadName: name,
                leadPhone: phone,
                leadEmail: email,
                leadCompany: company,
            }).then((newConversationId) => {
                console.log('[InboxPage] ✅ Created conversation:', newConversationId);
                selectConversation(newConversationId);
                setSearchParams({ id: newConversationId }, { replace: true });
                isCreatingConversation.current = false;
            }).catch((error) => {
                console.error('[InboxPage] ❌ Error creating conversation:', error);
                // Remove do processados para permitir retry
                processedPhones.current.delete(normalizedPhone);
                setSearchParams({}, { replace: true });
                isCreatingConversation.current = false;
            });
        } else {
            console.log('[InboxPage] Waiting for conversations to load...');
        }
    }, [searchParams, conversations, selectConversation, setSearchParams]);

    // Processa id da URL (apenas no primeiro load ou quando navegar diretamente)
    useEffect(() => {
        if (hasInitializedFromUrl.current) return;
        if (conversations.length === 0) return;

        const urlConversationId = searchParams.get('id');
        const phone = searchParams.get('phone');

        // Se tem phone, o outro useEffect já cuida
        if (phone) {
            hasInitializedFromUrl.current = true;
            return;
        }

        // Se não tem nenhum param, marca como inicializado
        if (!urlConversationId) {
            hasInitializedFromUrl.current = true;
            return;
        }

        // Seleciona pelo id
        selectConversation(urlConversationId);
        hasInitializedFromUrl.current = true;
    }, [searchParams, conversations, selectConversation]);

    // Sync: State → URL (quando clicar numa conversa na lista)
    useEffect(() => {
        // Não sincroniza se ainda não inicializou
        if (!hasInitializedFromUrl.current) return;
        // Não sincroniza se tem phone pendente
        if (searchParams.get('phone')) return;

        const currentUrlId = searchParams.get('id');

        if (selectedConversationId && currentUrlId !== selectedConversationId) {
            setSearchParams({ id: selectedConversationId }, { replace: true });
        } else if (!selectedConversationId && currentUrlId) {
            setSearchParams({}, { replace: true });
        }
    }, [selectedConversationId, searchParams, setSearchParams]);

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
            <DevToolbar />
        </>
    );
};

