import { getRealtimeDb } from '@/config/firebase';
import { ref, onValue, push, set, serverTimestamp, query, orderByChild, limitToLast, update, get } from 'firebase/database';
import { Conversation, Message } from '../types';
import { useSettingsStore } from '../../settings/stores/useSettingsStore';

const DB_PATHS = {
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
};

export const InboxService = {
    /**
     * Subscribe to the list of conversations.
     * In a real app, this should probably filter by assigned user or organization.
     */
    subscribeToConversations: (callback: (conversations: Conversation[]) => void) => {
        const db = getRealtimeDb();
        const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS);
        const q = query(conversationsRef, orderByChild('lastMessage/timestamp'), limitToLast(50));

        return onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }

            const conversations: Conversation[] = Object.keys(data).map((key) => ({
                id: key,
                ...data[key],
            })).sort((a, b) => {
                // Sort by newest first
                const timeA = a.lastMessage?.timestamp || 0;
                const timeB = b.lastMessage?.timestamp || 0;
                return timeB - timeA;
            });

            callback(conversations);
        });
    },

    /**
     * Subscribe to messages for a specific conversation.
     */
    subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void) => {
        const db = getRealtimeDb();
        const messagesRef = ref(db, `${DB_PATHS.MESSAGES}/${conversationId}`);
        // Limit to last 50 messages for performance
        const q = query(messagesRef, orderByChild('timestamp'), limitToLast(50));

        return onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }

            const messages: Message[] = Object.keys(data).map((key) => {
                const msg = data[key];
                return {
                    id: key,
                    ...msg,
                    // Map Firebase 'timestamp' to 'createdAt' that the Message type expects
                    createdAt: msg.timestamp ? new Date(msg.timestamp) : new Date(msg.createdAt || Date.now()),
                };
            });

            callback(messages);
        });
    },

    /**
     * Subscribe to a conversation by leadId.
     * Used by post-sales to find the conversation associated with a client.
     */
    subscribeToConversationByLeadId: (
        leadId: string,
        callback: (conversation: Conversation | null) => void
    ) => {
        const db = getRealtimeDb();
        const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS);

        return onValue(conversationsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback(null);
                return;
            }

            // Find conversation with matching leadId
            const found = Object.keys(data).find(key => data[key].leadId === leadId);

            if (found) {
                callback({
                    id: found,
                    ...data[found]
                } as Conversation);
            } else {
                callback(null);
            }
        });
    },

    /**
     * Create a new conversation for a lead.
     * Used when navigating from Kanban/Lead360 and no existing conversation exists.
     */
    createConversation: async (leadData: {
        leadId?: string;
        leadName: string;
        leadPhone: string;
        leadEmail?: string;
        leadCompany?: string;
        tags?: string[];
    }): Promise<string> => {
        const db = getRealtimeDb();
        const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS);
        const newConvRef = push(conversationsRef);
        const conversationId = newConvRef.key!;

        const now = Date.now();

        await set(newConvRef, {
            leadId: leadData.leadId || `lead_${now}`,
            leadName: leadData.leadName,
            leadPhone: leadData.leadPhone,
            leadEmail: leadData.leadEmail || '',
            leadCompany: leadData.leadCompany || '',
            tags: leadData.tags || [],
            notes: '',
            unreadCount: 0,
            channel: 'whatsapp',
            status: 'open',
            context: 'sales',
            lastMessage: null,
            createdAt: now,
            updatedAt: now,
        });

        return conversationId;
    },

    /**
     * Send a new message.
     */
    sendMessage: async (conversationId: string, text: string, senderId: string = 'agent') => {
        const db = getRealtimeDb();

        // 0. Get Conversation Details (to get phone number)
        const conversationRefSnapshot = await get(ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`));
        const conversation = conversationRefSnapshot.val() as Conversation;

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // 1. Create message in messages node IMMEDIATELY (Save-First)
        const messagesRef = ref(db, `${DB_PATHS.MESSAGES}/${conversationId}`);
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key!;

        const timestamp = serverTimestamp();

        const messageData = {
            id: messageId,
            content: text,
            senderId,
            timestamp: timestamp,
            direction: 'out',
            status: 'pending', // Initial status
            type: 'text',
        };

        // Batch updates for atomicity (Message + Conversation Last Message)
        const updates: Record<string, any> = {};
        updates[`${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`] = messageData;
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/lastMessage`] = messageData;
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/unreadCount`] = 0; // Reset unread since we are acting
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/updatedAt`] = timestamp;

        await update(ref(db), updates);

        // 2. Send to WhatsApp (if configured)
        const { whatsapp } = useSettingsStore.getState();

        if (whatsapp.provider === '360dialog' && whatsapp.apiKey && whatsapp.baseUrl && conversation.leadPhone) {
            try {
                // Determine destination phone
                const phone = conversation.leadPhone.replace(/\D/g, '');

                const response = await fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apiKey: whatsapp.apiKey,
                        baseUrl: whatsapp.baseUrl,
                        to: phone,
                        text: text
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('360Dialog Error:', errorData);
                    throw new Error('Failed to send message via WhatsApp');
                }

                const responseData = await response.json();
                const whatsappMessageId = responseData.messages?.[0]?.id;

                // 3. Update status to SENT on success
                await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                    status: 'sent',
                    whatsappMessageId: whatsappMessageId
                });

            } catch (error) {
                console.error('Failed to send WhatsApp message:', error);
                // 3. Update status to ERROR on failure
                await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                    status: 'error'
                });
                // We do NOT throw here to avoid crashing the UI, visual feedback is enough via 'error' status
            }
        } else {
            // If no WhatsApp config, we might want to mark as sent (simulated) or keep as pending
            // For now, let's mark as sent since it's "sent to system"
            await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                status: 'sent'
            });
        }

        return messageId;
    },

    /**
     * Helper to update lead phone (for testing/editing).
     */
    updateLeadPhone: async (conversationId: string, newPhone: string) => {
        const db = getRealtimeDb();
        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);
        await update(conversationRef, {
            leadPhone: newPhone
        });
    },

    /**
     * Send a template message via WhatsApp.
     */
    sendTemplateMessage: async (
        conversationId: string,
        templateName: string,
        language: string,
        components: any[],
        previewText: string,
        senderId: string = 'agent'
    ) => {
        const db = getRealtimeDb();

        // 0. Get Conversation
        const conversationRefSnapshot = await get(ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`));
        const conversation = conversationRefSnapshot.val() as Conversation;

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // 1. Create message in Firebase IMMEDIATELY
        const messagesRef = ref(db, `${DB_PATHS.MESSAGES}/${conversationId}`);
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key!;

        const timestamp = serverTimestamp();

        const messageData = {
            id: messageId,
            content: previewText,
            senderId,
            timestamp: timestamp,
            direction: 'out',
            status: 'pending',
            type: 'template',
            templateName: templateName
        };

        // Batch update
        const updates: Record<string, any> = {};
        updates[`${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`] = messageData;
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/lastMessage`] = messageData;
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/unreadCount`] = 0;
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/updatedAt`] = timestamp;

        await update(ref(db), updates);

        // 2. Send to WhatsApp
        const { whatsapp } = useSettingsStore.getState();

        if (whatsapp.provider === '360dialog' && whatsapp.apiKey && whatsapp.baseUrl && conversation.leadPhone) {
            try {
                const phone = conversation.leadPhone.replace(/\D/g, '');

                const response = await fetch('/api/send-template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apiKey: whatsapp.apiKey,
                        baseUrl: whatsapp.baseUrl,
                        to: phone,
                        templateName: templateName,
                        language: language,
                        components: components
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('360Dialog Template Error:', errorData);
                    throw new Error('Failed to send template via WhatsApp');
                }

                const responseData = await response.json();
                const whatsappMessageId = responseData.messages?.[0]?.id;

                // 3. Update success
                await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                    status: 'sent',
                    whatsappMessageId: whatsappMessageId
                });

            } catch (error) {
                console.error('Failed to send WhatsApp template:', error);
                await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                    status: 'error'
                });
            }
        } else {
            // If no WhatsApp config, mark as sent
            await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                status: 'sent'
            });
        }

        return messageId;
    },

    /**
     * Toggle favorite status for a conversation.
     */
    toggleFavorite: async (conversationId: string) => {
        const db = getRealtimeDb();
        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);

        const snapshot = await get(conversationRef);
        const conversation = snapshot.val() as Conversation;

        await update(conversationRef, {
            isFavorite: !conversation?.isFavorite
        });
    },

    /**
     * Toggle pinned status for a conversation.
     */
    togglePin: async (conversationId: string) => {
        const db = getRealtimeDb();
        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);

        const snapshot = await get(conversationRef);
        const conversation = snapshot.val() as Conversation;

        await update(conversationRef, {
            isPinned: !conversation?.isPinned
        });
    },

    /**
     * Schedule a message for future delivery.
     * The message is saved with status 'scheduled' and a scheduledFor timestamp.
     * A separate cron/cloud function should process and send scheduled messages.
     */
    scheduleMessage: async (
        conversationId: string,
        content: string,
        scheduledFor: Date,
        senderId: string = 'agent'
    ) => {
        const db = getRealtimeDb();
        const messagesRef = ref(db, `${DB_PATHS.MESSAGES}/${conversationId}`);
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key!;

        const messageData = {
            id: messageId,
            content,
            senderId,
            timestamp: serverTimestamp(),
            scheduledFor: scheduledFor.getTime(),
            direction: 'out',
            status: 'scheduled',
            type: 'text'
        };

        await set(newMessageRef, messageData);

        return messageId;
    },

    /**
     * Send a media message (image, video, audio, document).
     */
    sendMediaMessage: async (
        conversationId: string,
        mediaUrl: string,
        mediaType: 'image' | 'video' | 'audio' | 'document',
        mediaName?: string,
        senderId: string = 'agent',
        viewOnce?: boolean
    ) => {
        const db = getRealtimeDb();

        // 0. Get Conversation
        const conversationRefSnapshot = await get(ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`));
        const conversation = conversationRefSnapshot.val() as Conversation;

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // 1. Create message in Firebase IMMEDIATELY (Save-First)
        const messagesRef = ref(db, `${DB_PATHS.MESSAGES}/${conversationId}`);
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key!;

        const contentMap = {
            image: '[Imagem]',
            video: '[Vídeo]',
            audio: '[Áudio]',
            document: mediaName || '[Documento]'
        };

        const timestamp = serverTimestamp();

        const messageData = {
            id: messageId,
            content: contentMap[mediaType],
            senderId,
            timestamp: timestamp,
            direction: 'out',
            status: 'pending',
            type: mediaType,
            mediaUrl: mediaUrl,
            mediaName: mediaName,
            ...(viewOnce && { viewOnce: true }) // Only add if true
        };

        // Batch update
        const updates: Record<string, any> = {};
        updates[`${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`] = messageData;
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/lastMessage`] = messageData;
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/unreadCount`] = 0;
        updates[`${DB_PATHS.CONVERSATIONS}/${conversationId}/updatedAt`] = timestamp;

        await update(ref(db), updates);

        // 2. Send to WhatsApp
        const { whatsapp } = useSettingsStore.getState();

        if (whatsapp.provider === '360dialog' && whatsapp.apiKey && whatsapp.baseUrl && conversation.leadPhone) {
            try {
                const phone = conversation.leadPhone.replace(/\D/g, '');

                const response = await fetch('/api/send-media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apiKey: whatsapp.apiKey,
                        baseUrl: whatsapp.baseUrl,
                        to: phone,
                        mediaType: mediaType,
                        mediaUrl: mediaUrl,
                        caption: mediaName,
                        viewOnce: viewOnce // View Once support
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('360Dialog Media Error:', errorData);
                    throw new Error('Failed to send media via WhatsApp');
                }

                const responseData = await response.json();
                const whatsappMessageId = responseData.messages?.[0]?.id;

                // 3. Update success
                await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                    status: 'sent',
                    whatsappMessageId: whatsappMessageId
                });

            } catch (error) {
                console.error('Failed to send WhatsApp media:', error);
                await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                    status: 'error'
                });
            }
        } else {
            // If no WhatsApp config, mark as sent
            await update(ref(db, `${DB_PATHS.MESSAGES}/${conversationId}/${messageId}`), {
                status: 'sent'
            });
        }

        return messageId;
    },

    /**
     * Update diverse conversation details (lead info, tags, notes, etc).
     * Also syncs relevant fields to the corresponding Firestore Lead if leadId exists.
     */
    updateConversationDetails: async (conversationId: string, data: Partial<Conversation>) => {
        const db = getRealtimeDb();
        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);

        // 1. Update conversation in RTDB
        await update(conversationRef, {
            ...data
        });

        // 2. Get conversation to check for leadId
        const snapshot = await get(conversationRef);
        const conv = snapshot.val();

        // 3. If leadId exists, sync relevant fields to Firestore Lead
        if (conv?.leadId) {
            try {
                const { getFirestoreDb } = await import('@/config/firebase');
                const { doc, getDoc, updateDoc, Timestamp } = await import('firebase/firestore');

                const firestoreDb = getFirestoreDb();
                const leadRef = doc(firestoreDb, 'leads', conv.leadId);
                const leadSnap = await getDoc(leadRef);

                if (leadSnap.exists()) {
                    const leadUpdates: Record<string, any> = {};

                    // Map conversation fields to lead fields
                    if (data.leadName !== undefined) leadUpdates.name = data.leadName;
                    if (data.leadPhone !== undefined) leadUpdates.phone = data.leadPhone;
                    if (data.leadEmail !== undefined) leadUpdates.email = data.leadEmail;
                    if (data.leadCompany !== undefined) leadUpdates.company = data.leadCompany;
                    if (data.tags !== undefined) leadUpdates.tags = data.tags;
                    if (data.notes !== undefined) leadUpdates.notes = data.notes;

                    // Only update if there are changes
                    if (Object.keys(leadUpdates).length > 0) {
                        leadUpdates.updatedAt = Timestamp.fromDate(new Date());
                        await updateDoc(leadRef, leadUpdates);
                        console.log('[InboxService] Synced conversation changes to Lead:', conv.leadId);
                    }
                }
            } catch (error) {
                // Don't fail the conversation update if lead sync fails
                console.error('[InboxService] Failed to sync to Firestore Lead:', error);
            }
        }
    },

    /**
     * Assign conversation to a team member.
     */
    assignConversation: async (conversationId: string, userId: string | null) => {
        const db = getRealtimeDb();
        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);
        await update(conversationRef, {
            assignedTo: userId,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Close or reopen a conversation.
     */
    toggleConversationStatus: async (conversationId: string) => {
        const db = getRealtimeDb();
        const conversationRefSnapshot = await get(ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`));
        const conversation = conversationRefSnapshot.val() as Conversation;

        const newStatus = conversation.status === 'open' ? 'closed' : 'open';

        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);
        await update(conversationRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
        });

        return newStatus;
    },

    /**
     * Transfer conversation to post-sales sector.
     * Keeps conversation open but changes context to 'post_sales'.
     * Used when a sale is closed and project is created.
     */
    transferToPostSales: async (conversationId: string) => {
        const db = getRealtimeDb();
        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);

        await update(conversationRef, {
            context: 'post_sales',
            status: 'open',
            // Clear sales assignment, will be reassigned in post-sales
            assignedTo: null,
            transferredToPostSalesAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Mark conversation as read.
     */
    markAsRead: async (conversationId: string) => {
        const db = getRealtimeDb();
        const conversationRef = ref(db, `${DB_PATHS.CONVERSATIONS}/${conversationId}`);
        await update(conversationRef, {
            unreadCount: 0
        });
    },

    /**
     * Seeds the database with mock data for testing.
     */
    seedDatabase: async () => {
        const db = getRealtimeDb();

        // 1. Clear existing data to prevent duplicates
        console.log('Clearing database...');
        await set(ref(db, DB_PATHS.CONVERSATIONS), null);
        await set(ref(db, DB_PATHS.MESSAGES), null);

        // Mock Data
        const mocks = [
            {
                leadName: 'João Silva',
                leadPhone: '11999999999',
                leadEmail: 'joao.silva@empresaA.com',
                leadCompany: 'Empresa A',
                channel: 'whatsapp',
                unreadCount: 2,
                status: 'open',
                tags: ['Interessado', 'Quente', 'Novo Lead'],
                notes: 'Cliente interessado no plano anual. Entrar em contato na próxima semana para fechar contrato.',
                messages: [
                    { content: 'Olá, gostaria de saber mais sobre o serviço.', direction: 'in' },
                    { content: 'Claro, João! Como posso ajudar?', direction: 'out' },
                    { content: 'Vocês fazem desenvolvimento web?', direction: 'in' }
                ]
            },
            {
                leadName: 'Maria Oliveira',
                leadPhone: '11888888888',
                leadEmail: 'maria@techsolutions.com.br',
                leadCompany: 'Tech Solutions',
                channel: 'instagram',
                unreadCount: 0,
                status: 'closed',
                tags: ['Cliente Antigo', 'Suporte'],
                notes: 'Dúvida técnica resolvida. Cliente satisfeito com o atendimento.',
                messages: [
                    { content: 'Obrigado pelo atendimento!', direction: 'in' },
                    { content: 'Por nada! Conte conosco.', direction: 'out' }
                ]
            },
            {
                leadName: 'Carlos Pereira',
                leadPhone: '11777777777',
                leadEmail: 'contact@agenciaxyz.com',
                leadCompany: 'Agência XYZ',
                channel: 'whatsapp',
                unreadCount: 0,
                status: 'open',
                tags: ['Parceria', 'Frio'],
                notes: 'Agência buscando parceria para terceirização de demandas.',
                messages: [
                    { content: 'Quanto custa o plano mensal?', direction: 'in' }
                ]
            }
        ];

        for (const mock of mocks) {
            // Create Conversation
            const convRef = push(ref(db, DB_PATHS.CONVERSATIONS));
            const convId = convRef.key!;

            // Create Messages
            let lastMessageData = null;

            for (const [index, msg] of mock.messages.entries()) {
                const messagesRef = ref(db, `${DB_PATHS.MESSAGES}/${convId}`);
                const newMsgRef = push(messagesRef);

                // Stagger timestamps slightly
                const timestamp = Date.now() - (1000 * 60 * (mock.messages.length - index));

                const msgData = {
                    id: newMsgRef.key,
                    content: msg.content,
                    senderId: msg.direction === 'out' ? 'agent' : 'lead',
                    direction: msg.direction,
                    timestamp: timestamp,
                    status: 'read',
                    type: 'text',
                };

                await set(newMsgRef, msgData);
                lastMessageData = msgData;
            }

            // Save Conversation Metadata
            await set(convRef, {
                leadId: `mock_${Date.now()}_${Math.random()}`,
                leadName: mock.leadName,
                leadPhone: mock.leadPhone,
                leadEmail: mock.leadEmail,
                leadCompany: mock.leadCompany,
                tags: mock.tags || [],
                notes: mock.notes || '',
                unreadCount: mock.unreadCount,
                channel: mock.channel,
                status: mock.status,
                lastMessage: lastMessageData,
                updatedAt: lastMessageData?.timestamp || Date.now(),
            });
        }

        console.log('Database seeded successfully!');
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // LEAD DISTRIBUTION (Round Robin - Least Loaded)
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Get lead distribution settings.
     */
    getDistributionSettings: async (): Promise<{
        enabled: boolean;
        mode: 'auto' | 'manual';
        participants: string[];
    }> => {
        const db = getRealtimeDb();
        const settingsRef = ref(db, 'settings/leadDistribution');
        const snapshot = await get(settingsRef);

        if (!snapshot.exists()) {
            return {
                enabled: false,
                mode: 'manual',
                participants: []
            };
        }

        return snapshot.val();
    },

    /**
     * Save lead distribution settings.
     */
    saveDistributionSettings: async (settings: {
        enabled: boolean;
        mode: 'auto' | 'manual';
        participants: string[];
    }): Promise<void> => {
        const db = getRealtimeDb();
        const settingsRef = ref(db, 'settings/leadDistribution');
        await set(settingsRef, {
            ...settings,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Get count of active (open) leads per collaborator.
     */
    getActiveLeadsCount: async (): Promise<Record<string, number>> => {
        const db = getRealtimeDb();
        const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS);
        const snapshot = await get(conversationsRef);

        if (!snapshot.exists()) {
            return {};
        }

        const counts: Record<string, number> = {};
        const data = snapshot.val();

        Object.values(data).forEach((conv: any) => {
            if (conv.assignedTo && conv.status !== 'closed') {
                counts[conv.assignedTo] = (counts[conv.assignedTo] || 0) + 1;
            }
        });

        return counts;
    },

    /**
     * Get the next collaborator to assign based on "Least Loaded" strategy.
     * Returns the participant with the fewest active leads.
     */
    getNextCollaborator: async (participants: string[]): Promise<string | null> => {
        if (!participants || participants.length === 0) {
            return null;
        }

        const counts = await InboxService.getActiveLeadsCount();

        // Map participants to their lead counts
        const participantCounts = participants.map(id => ({
            id,
            count: counts[id] || 0
        }));

        // Sort by count ascending (least loaded first)
        participantCounts.sort((a, b) => a.count - b.count);

        return participantCounts[0]?.id || null;
    },

    /**
     * Distribute all unassigned leads to participants.
     * Returns the number of leads distributed.
     */
    distributeUnassignedLeads: async (): Promise<{ distributed: number; errors: number }> => {
        const db = getRealtimeDb();
        const settings = await InboxService.getDistributionSettings();

        if (!settings.enabled || settings.participants.length === 0) {
            return { distributed: 0, errors: 0 };
        }

        // Get all unassigned conversations
        const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS);
        const snapshot = await get(conversationsRef);

        if (!snapshot.exists()) {
            return { distributed: 0, errors: 0 };
        }

        const data = snapshot.val();
        const unassigned = Object.entries(data)
            .filter(([_, conv]: [string, any]) => !conv.assignedTo && conv.status !== 'closed')
            .map(([id]) => id);

        let distributed = 0;
        let errors = 0;

        for (const conversationId of unassigned) {
            try {
                const nextCollaborator = await InboxService.getNextCollaborator(settings.participants);
                if (nextCollaborator) {
                    await InboxService.assignConversation(conversationId, nextCollaborator);
                    distributed++;
                }
            } catch (error) {
                console.error(`Error distributing conversation ${conversationId}:`, error);
                errors++;
            }
        }

        return { distributed, errors };
    }
};
