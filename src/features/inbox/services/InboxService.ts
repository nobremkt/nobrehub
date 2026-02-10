/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - INBOX SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * All data in Firestore:
 *   conversations/{conversationId}          → Conversation metadata
 *   conversations/{conversationId}/messages  → Messages subcollection
 *   settings/leadDistribution               → Distribution config
 *
 * RTDB is NOT used here — only Firestore with onSnapshot for real-time.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getFirestoreDb } from '@/config/firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    setDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
} from 'firebase/firestore';
import { Conversation, Message } from '../types';
import { useSettingsStore } from '../../settings/stores/useSettingsStore';

const COL_CONVERSATIONS = 'conversations';
const SUBCOL_MESSAGES = 'messages';

export const InboxService = {
    /**
     * Subscribe to the list of conversations.
     */
    subscribeToConversations: (callback: (conversations: Conversation[]) => void) => {
        const db = getFirestoreDb();
        const q = query(
            collection(db, COL_CONVERSATIONS),
            orderBy('updatedAt', 'desc'),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const conversations: Conversation[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    // Normalize timestamps for components that expect number
                    updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
                    createdAt: data.createdAt?.toMillis?.() || data.createdAt || 0,
                    lastMessage: data.lastMessage ? {
                        ...data.lastMessage,
                        timestamp: data.lastMessage.timestamp?.toMillis?.() || data.lastMessage.timestamp || 0,
                    } : null,
                } as Conversation;
            });

            callback(conversations);
        });
    },

    /**
     * Subscribe to messages for a specific conversation.
     */
    subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void) => {
        const db = getFirestoreDb();
        const q = query(
            collection(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES),
            orderBy('timestamp', 'asc'),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const messages: Message[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.timestamp?.toDate?.() || new Date(data.timestamp || data.createdAt || Date.now()),
                } as Message;
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
        const db = getFirestoreDb();
        const q = query(
            collection(db, COL_CONVERSATIONS),
            where('leadId', '==', leadId),
            limit(1)
        );

        return onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                callback(null);
                return;
            }

            const docSnap = snapshot.docs[0];
            const data = docSnap.data();
            callback({
                id: docSnap.id,
                ...data,
                updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
                createdAt: data.createdAt?.toMillis?.() || data.createdAt || 0,
            } as Conversation);
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
        const db = getFirestoreDb();
        const now = Timestamp.now();

        const conversationData = {
            leadId: leadData.leadId || `lead_${Date.now()}`,
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
        };

        const docRef = await addDoc(collection(db, COL_CONVERSATIONS), conversationData);
        return docRef.id;
    },

    /**
     * Send a new message.
     */
    sendMessage: async (conversationId: string, text: string, senderId: string = 'agent') => {
        const db = getFirestoreDb();

        // 0. Get Conversation Details (to get phone number)
        const conversationRef = doc(db, COL_CONVERSATIONS, conversationId);
        const convSnap = await getDoc(conversationRef);
        const conversation = convSnap.exists() ? { id: convSnap.id, ...convSnap.data() } as Conversation : null;

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // 1. Create message in messages subcollection
        const now = Timestamp.now();

        const messageData = {
            content: text,
            senderId,
            timestamp: now,
            direction: 'out',
            status: 'pending',
            type: 'text',
        };

        const msgRef = await addDoc(
            collection(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES),
            messageData
        );
        const messageId = msgRef.id;

        // 2. Update conversation lastMessage + unreadCount
        await updateDoc(conversationRef, {
            lastMessage: { ...messageData, id: messageId },
            unreadCount: 0,
            updatedAt: now,
        });

        // 3. Send to WhatsApp (if configured)
        const { whatsapp } = useSettingsStore.getState();

        if (whatsapp.provider === '360dialog' && whatsapp.apiKey && whatsapp.baseUrl && conversation.leadPhone) {
            try {
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

                // Update status to SENT on success
                await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
                    status: 'sent',
                    whatsappMessageId: whatsappMessageId
                });

            } catch (error) {
                console.error('Failed to send WhatsApp message:', error);
                await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
                    status: 'error'
                });
            }
        } else {
            await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
                status: 'sent'
            });
        }

        return messageId;
    },

    /**
     * Helper to update lead phone.
     */
    updateLeadPhone: async (conversationId: string, newPhone: string) => {
        const db = getFirestoreDb();
        await updateDoc(doc(db, COL_CONVERSATIONS, conversationId), {
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
        const db = getFirestoreDb();

        // 0. Get Conversation
        const convSnap = await getDoc(doc(db, COL_CONVERSATIONS, conversationId));
        const conversation = convSnap.exists() ? { id: convSnap.id, ...convSnap.data() } as Conversation : null;

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // 1. Create message in Firestore
        const now = Timestamp.now();

        const messageData = {
            content: previewText,
            senderId,
            timestamp: now,
            direction: 'out',
            status: 'pending',
            type: 'template',
            templateName: templateName,
        };

        const msgRef = await addDoc(
            collection(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES),
            messageData
        );
        const messageId = msgRef.id;

        // Update conversation
        await updateDoc(doc(db, COL_CONVERSATIONS, conversationId), {
            lastMessage: { ...messageData, id: messageId },
            unreadCount: 0,
            updatedAt: now,
        });

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

                await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
                    status: 'sent',
                    whatsappMessageId: whatsappMessageId
                });

            } catch (error) {
                console.error('Failed to send WhatsApp template:', error);
                await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
                    status: 'error'
                });
            }
        } else {
            await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
                status: 'sent'
            });
        }

        return messageId;
    },

    /**
     * Toggle favorite status for a conversation.
     */
    toggleFavorite: async (conversationId: string) => {
        const db = getFirestoreDb();
        const convRef = doc(db, COL_CONVERSATIONS, conversationId);
        const convSnap = await getDoc(convRef);

        if (!convSnap.exists()) return;
        const conversation = convSnap.data();

        await updateDoc(convRef, {
            isFavorite: !conversation?.isFavorite
        });
    },

    /**
     * Toggle pinned status for a conversation.
     */
    togglePin: async (conversationId: string) => {
        const db = getFirestoreDb();
        const convRef = doc(db, COL_CONVERSATIONS, conversationId);
        const convSnap = await getDoc(convRef);

        if (!convSnap.exists()) return;
        const conversation = convSnap.data();

        await updateDoc(convRef, {
            isPinned: !conversation?.isPinned
        });
    },

    /**
     * Schedule a message for future delivery.
     */
    scheduleMessage: async (
        conversationId: string,
        content: string,
        scheduledFor: Date,
        senderId: string = 'agent'
    ) => {
        const db = getFirestoreDb();

        const messageData = {
            content,
            senderId,
            timestamp: Timestamp.now(),
            scheduledFor: Timestamp.fromDate(scheduledFor),
            direction: 'out',
            status: 'scheduled',
            type: 'text',
        };

        const msgRef = await addDoc(
            collection(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES),
            messageData
        );

        return msgRef.id;
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
        const db = getFirestoreDb();

        // 0. Get Conversation
        const convSnap = await getDoc(doc(db, COL_CONVERSATIONS, conversationId));
        const conversation = convSnap.exists() ? { id: convSnap.id, ...convSnap.data() } as Conversation : null;

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // 1. Create message
        const contentMap = {
            image: '[Imagem]',
            video: '[Vídeo]',
            audio: '[Áudio]',
            document: mediaName || '[Documento]'
        };

        const now = Timestamp.now();

        const messageData: Record<string, any> = {
            content: contentMap[mediaType],
            senderId,
            timestamp: now,
            direction: 'out',
            status: 'pending',
            type: mediaType,
            mediaUrl: mediaUrl,
            mediaName: mediaName,
        };

        if (viewOnce) messageData.viewOnce = true;

        const msgRef = await addDoc(
            collection(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES),
            messageData
        );
        const messageId = msgRef.id;

        // Update conversation
        await updateDoc(doc(db, COL_CONVERSATIONS, conversationId), {
            lastMessage: { ...messageData, id: messageId },
            unreadCount: 0,
            updatedAt: now,
        });

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
                        viewOnce: viewOnce
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('360Dialog Media Error:', errorData);
                    throw new Error('Failed to send media via WhatsApp');
                }

                const responseData = await response.json();
                const whatsappMessageId = responseData.messages?.[0]?.id;

                await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
                    status: 'sent',
                    whatsappMessageId: whatsappMessageId
                });

            } catch (error) {
                console.error('Failed to send WhatsApp media:', error);
                await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
                    status: 'error'
                });
            }
        } else {
            await updateDoc(doc(db, COL_CONVERSATIONS, conversationId, SUBCOL_MESSAGES, messageId), {
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
        const db = getFirestoreDb();
        const conversationRef = doc(db, COL_CONVERSATIONS, conversationId);

        // 1. Update conversation in Firestore
        await updateDoc(conversationRef, {
            ...data
        });

        // 2. Get conversation to check for leadId
        const snapshot = await getDoc(conversationRef);
        const conv = snapshot.data();

        // 3. If leadId exists, sync relevant fields to Firestore Lead
        if (conv?.leadId) {
            try {
                const leadRef = doc(db, 'leads', conv.leadId);
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
                console.error('[InboxService] Failed to sync to Firestore Lead:', error);
            }
        }
    },

    /**
     * Assign conversation to a team member.
     */
    assignConversation: async (conversationId: string, userId: string | null) => {
        const db = getFirestoreDb();
        await updateDoc(doc(db, COL_CONVERSATIONS, conversationId), {
            assignedTo: userId,
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Close or reopen a conversation.
     */
    toggleConversationStatus: async (conversationId: string) => {
        const db = getFirestoreDb();
        const convRef = doc(db, COL_CONVERSATIONS, conversationId);
        const convSnap = await getDoc(convRef);
        const conversation = convSnap.data() as Conversation;

        const newStatus = conversation.status === 'open' ? 'closed' : 'open';

        await updateDoc(convRef, {
            status: newStatus,
            updatedAt: Timestamp.now(),
        });

        return newStatus;
    },

    /**
     * Transfer conversation to post-sales sector.
     */
    transferToPostSales: async (conversationId: string) => {
        const db = getFirestoreDb();
        await updateDoc(doc(db, COL_CONVERSATIONS, conversationId), {
            context: 'post_sales',
            status: 'open',
            assignedTo: null,
            transferredToPostSalesAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Mark conversation as read.
     */
    markAsRead: async (conversationId: string) => {
        const db = getFirestoreDb();
        await updateDoc(doc(db, COL_CONVERSATIONS, conversationId), {
            unreadCount: 0
        });
    },

    /**
     * Seeds the database with mock data for testing.
     */
    seedDatabase: async () => {
        const db = getFirestoreDb();

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
                notes: 'Cliente interessado no plano anual.',
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
                notes: 'Dúvida técnica resolvida.',
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
                notes: 'Agência buscando parceria.',
                messages: [
                    { content: 'Quanto custa o plano mensal?', direction: 'in' }
                ]
            }
        ];

        for (const mock of mocks) {
            const now = Timestamp.now();

            // Create Conversation
            const convRef = await addDoc(collection(db, COL_CONVERSATIONS), {
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
                context: 'sales',
                lastMessage: null,
                createdAt: now,
                updatedAt: now,
            });

            // Create Messages
            let lastMessageData = null;

            for (const [index, msg] of mock.messages.entries()) {
                const timestamp = Timestamp.fromMillis(
                    Date.now() - (1000 * 60 * (mock.messages.length - index))
                );

                const msgData = {
                    content: msg.content,
                    senderId: msg.direction === 'out' ? 'agent' : 'lead',
                    direction: msg.direction,
                    timestamp: timestamp,
                    status: 'read',
                    type: 'text',
                };

                await addDoc(
                    collection(db, COL_CONVERSATIONS, convRef.id, SUBCOL_MESSAGES),
                    msgData
                );
                lastMessageData = msgData;
            }

            // Update conversation with lastMessage
            if (lastMessageData) {
                await updateDoc(doc(db, COL_CONVERSATIONS, convRef.id), {
                    lastMessage: lastMessageData,
                    updatedAt: lastMessageData.timestamp,
                });
            }
        }

        console.log('Database seeded successfully!');
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // LEAD DISTRIBUTION (Round Robin - Least Loaded)
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Get lead distribution settings.
     * Reads from Firestore: settings/leadDistribution
     */
    getDistributionSettings: async (): Promise<{
        enabled: boolean;
        mode: 'auto' | 'manual';
        participants: string[];
    }> => {
        const db = getFirestoreDb();
        const settingsRef = doc(db, 'settings', 'leadDistribution');
        const snapshot = await getDoc(settingsRef);

        if (!snapshot.exists()) {
            return {
                enabled: false,
                mode: 'manual',
                participants: []
            };
        }

        return snapshot.data() as {
            enabled: boolean;
            mode: 'auto' | 'manual';
            participants: string[];
        };
    },

    /**
     * Save lead distribution settings.
     * Writes to Firestore: settings/leadDistribution
     */
    saveDistributionSettings: async (settings: {
        enabled: boolean;
        mode: 'auto' | 'manual';
        participants: string[];
    }): Promise<void> => {
        const db = getFirestoreDb();
        const settingsRef = doc(db, 'settings', 'leadDistribution');
        await setDoc(settingsRef, {
            ...settings,
            updatedAt: Timestamp.fromDate(new Date())
        }, { merge: true });
    },

    /**
     * Get count of active (open) leads per collaborator.
     */
    getActiveLeadsCount: async (): Promise<Record<string, number>> => {
        const db = getFirestoreDb();
        const q = query(
            collection(db, COL_CONVERSATIONS),
            where('status', '!=', 'closed')
        );
        const snapshot = await getDocs(q);

        const counts: Record<string, number> = {};

        snapshot.docs.forEach((docSnap) => {
            const conv = docSnap.data();
            if (conv.assignedTo) {
                counts[conv.assignedTo] = (counts[conv.assignedTo] || 0) + 1;
            }
        });

        return counts;
    },

    /**
     * Get the next collaborator to assign based on "Least Loaded" strategy.
     */
    getNextCollaborator: async (participants: string[]): Promise<string | null> => {
        if (!participants || participants.length === 0) {
            return null;
        }

        const counts = await InboxService.getActiveLeadsCount();

        const participantCounts = participants.map(id => ({
            id,
            count: counts[id] || 0
        }));

        participantCounts.sort((a, b) => a.count - b.count);

        return participantCounts[0]?.id || null;
    },

    /**
     * Distribute all unassigned leads to participants.
     */
    distributeUnassignedLeads: async (): Promise<{ distributed: number; errors: number }> => {
        const db = getFirestoreDb();
        const settings = await InboxService.getDistributionSettings();

        if (!settings.enabled || settings.participants.length === 0) {
            return { distributed: 0, errors: 0 };
        }

        // Get all unassigned open conversations
        const q = query(
            collection(db, COL_CONVERSATIONS),
            where('status', '!=', 'closed')
        );
        const snapshot = await getDocs(q);

        const unassigned = snapshot.docs
            .filter(docSnap => !docSnap.data().assignedTo)
            .map(docSnap => docSnap.id);

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
