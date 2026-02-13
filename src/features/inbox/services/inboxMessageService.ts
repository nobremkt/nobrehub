/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INBOX MESSAGE SERVICE — send, schedule, and media message operations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { getCurrentUserId } from './inboxMappers';
import type { TemplateComponent } from '../types';
import { sendVia360Dialog } from './whatsappHelper';

export const InboxMessageService = {
    /**
     * Send a new text message.
     */
    sendMessage: async (conversationId: string, text: string, senderId?: string) => {
        const now = new Date().toISOString();
        const resolvedSenderId = senderId || getCurrentUserId();

        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select('phone')
            .eq('id', conversationId)
            .single();

        if (convError || !convData) throw new Error('Conversation not found');

        const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                content: text,
                sender_id: resolvedSenderId,
                sender_type: 'agent',
                status: 'pending',
                type: 'text',
                created_at: now,
            })
            .select('id')
            .single();

        if (msgError) throw msgError;
        const messageId = msgData.id;

        await supabase
            .from('conversations')
            .update({
                last_message_preview: text,
                last_message_at: now,
                unread_count: 0,
                updated_at: now,
            })
            .eq('id', conversationId);

        await sendVia360Dialog({
            phone: convData.phone,
            messageId,
            endpoint: '/api/send-message',
            payload: { text },
        });

        return messageId;
    },

    /**
     * Send a template message via WhatsApp.
     */
    sendTemplateMessage: async (
        conversationId: string,
        templateName: string,
        language: string,
        components: TemplateComponent[],
        previewText: string,
        senderId?: string
    ) => {
        const now = new Date().toISOString();
        const resolvedSenderId = senderId || getCurrentUserId();

        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select('phone')
            .eq('id', conversationId)
            .single();

        if (convError || !convData) throw new Error('Conversation not found');

        const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                content: previewText,
                sender_id: resolvedSenderId,
                sender_type: 'agent',
                status: 'pending',
                type: 'template',
                metadata: { templateName },
                created_at: now,
            })
            .select('id')
            .single();

        if (msgError) throw msgError;
        const messageId = msgData.id;

        await supabase
            .from('conversations')
            .update({
                last_message_preview: previewText,
                last_message_at: now,
                unread_count: 0,
                updated_at: now,
            })
            .eq('id', conversationId);

        await sendVia360Dialog({
            phone: convData.phone,
            messageId,
            endpoint: '/api/send-template',
            payload: { templateName, language, components },
        });

        return messageId;
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
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                content,
                sender_id: senderId,
                sender_type: 'agent',
                status: 'scheduled',
                type: 'text',
                metadata: { scheduledFor: scheduledFor.toISOString() },
                created_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Send a media message (image, video, audio, document).
     */
    sendMediaMessage: async (
        conversationId: string,
        mediaUrl: string,
        mediaType: 'image' | 'video' | 'audio' | 'document',
        mediaName?: string,
        senderId?: string,
        viewOnce?: boolean
    ) => {
        const now = new Date().toISOString();
        const resolvedSenderId = senderId || getCurrentUserId();

        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select('phone')
            .eq('id', conversationId)
            .single();

        if (convError || !convData) throw new Error('Conversation not found');

        const contentMap = {
            image: '[Imagem]',
            video: '[Vídeo]',
            audio: '[Áudio]',
            document: mediaName || '[Documento]'
        };

        const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                content: contentMap[mediaType],
                sender_id: resolvedSenderId,
                sender_type: 'agent',
                status: 'pending',
                type: mediaType,
                media_url: mediaUrl,
                metadata: { mediaName, viewOnce: viewOnce || false },
                created_at: now,
            })
            .select('id')
            .single();

        if (msgError) throw msgError;
        const messageId = msgData.id;

        await supabase
            .from('conversations')
            .update({
                last_message_preview: contentMap[mediaType],
                last_message_at: now,
                unread_count: 0,
                updated_at: now,
            })
            .eq('id', conversationId);

        await sendVia360Dialog({
            phone: convData.phone,
            messageId,
            endpoint: '/api/send-media',
            payload: { mediaType, mediaUrl, caption: mediaName, viewOnce },
        });

        return messageId;
    },

    /**
     * Helper to update lead phone.
     */
    updateLeadPhone: async (conversationId: string, newPhone: string) => {
        await supabase
            .from('conversations')
            .update({ phone: newPhone })
            .eq('id', conversationId);
    },
};
