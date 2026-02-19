/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WhatsApp Provider Helper
 * Shared logic for sending messages via configured WhatsApp provider.
 * Credentials are resolved on the backend — the client only sends the payload.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { buildApiUrl } from '@/config/api';
import { useSettingsStore } from '../../settings/stores/useSettingsStore';

interface WhatsAppSendParams {
    phone: string;
    messageId: string;
    endpoint: '/api/send-message' | '/api/send-template' | '/api/send-media' | '/api/send-interactive';
    payload: Record<string, any>;
}

/**
 * Check if WhatsApp sending is enabled and configured.
 * Reads from the Supabase-backed settings store.
 */
export function isWhatsAppEnabled(): boolean {
    return useSettingsStore.getState().isWhatsAppEnabled();
}

/**
 * Send a message via the configured WhatsApp provider API.
 * The API routes handle credential resolution — we only send the message payload.
 *
 * @returns true if sent successfully, false if failed/skipped
 */
export async function sendViaWhatsAppProvider({
    phone,
    messageId,
    endpoint,
    payload,
}: WhatsAppSendParams): Promise<boolean> {
    if (!isWhatsAppEnabled()) {
        // Integration disabled — mark as "sent" locally
        await supabase
            .from('messages')
            .update({ status: 'sent' })
            .eq('id', messageId);
        return true;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    try {
        const response = await fetch(buildApiUrl(endpoint), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: cleanPhone,
                ...payload,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`[WhatsApp Provider] Error on ${endpoint}:`, errorData);
            throw new Error(`Failed to send via WhatsApp (${endpoint})`);
        }

        const responseData = await response.json();
        const whatsappMessageId = responseData.messages?.[0]?.id;

        await supabase
            .from('messages')
            .update({ status: 'sent', whatsapp_message_id: whatsappMessageId })
            .eq('id', messageId);

        return true;
    } catch (error) {
        console.error(`[WhatsApp Provider] Failed on ${endpoint}:`, error);
        await supabase
            .from('messages')
            .update({ status: 'failed' })
            .eq('id', messageId);
        return false;
    }
}

// Backward-compatible alias during migration period.
export const sendVia360Dialog = sendViaWhatsAppProvider;
