// 360Dialog WhatsApp Service
// Handles communication with 360Dialog API for WhatsApp Business

// Cloud API v2 endpoint (not the old On-Premise v1)
const DIALOG360_API_URL = 'https://waba-v2.360dialog.io';

interface SendMessageParams {
    to: string; // Phone number with country code, no + or spaces (e.g., "5511999999999")
    text: string;
}

interface SendTemplateParams {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: any[];
}

interface MessageResponse {
    messages: Array<{ id: string }>;
}

interface TemplateMessage {
    id: string;
    name: string;
    status: string;
    language: string;
}

export class Dialog360Service {
    private apiKey: string;
    private wabaId: string;
    private phoneNumberId: string;
    private namespace: string;

    constructor() {
        this.apiKey = process.env.DIALOG360_API_KEY || '';
        this.wabaId = process.env.DIALOG360_WABA_ID || '';
        this.phoneNumberId = process.env.DIALOG360_PHONE_NUMBER_ID || '';
        this.namespace = process.env.DIALOG360_NAMESPACE || '';

        if (!this.apiKey) {
            console.warn('⚠️ DIALOG360_API_KEY not set - WhatsApp integration disabled');
        }
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${DIALOG360_API_URL}${endpoint}`;
        console.log('📤 360Dialog Request:', url, options.method || 'GET');

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'D360-API-KEY': this.apiKey,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ 360Dialog API Error:', response.status, JSON.stringify(error, null, 2));
            throw new Error(`360Dialog API Error: ${JSON.stringify(error)}`);
        }

        return response.json() as Promise<T>;
    }

    // Send a text message
    async sendMessage({ to, text }: SendMessageParams): Promise<MessageResponse> {
        // Format phone number - remove non-digits
        const formattedPhone = to.replace(/\D/g, '');

        return this.request<MessageResponse>('/messages', {
            method: 'POST',
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedPhone,
                type: 'text',
                text: { body: text }
            }),
        });
    }

    // Send a template message (HSM) - Cloud API format
    async sendTemplate({ to, templateName, languageCode = 'pt_BR', components = [] }: SendTemplateParams): Promise<MessageResponse> {
        const formattedPhone = to.replace(/\D/g, '');

        // Cloud API format (no namespace needed)
        const templatePayload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode }
            }
        };

        // Add components only if provided
        if (components.length > 0) {
            templatePayload.template.components = components;
        }

        return this.request<MessageResponse>('/messages', {
            method: 'POST',
            body: JSON.stringify(templatePayload),
        });
    }

    // Get available templates
    async getTemplates(): Promise<TemplateMessage[]> {
        try {
            const response = await this.request<{ waba_templates: TemplateMessage[] }>('/configs/templates');
            return response.waba_templates || [];
        } catch (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
    }

    // Validate webhook payload signature (for security)
    validateWebhookPayload(payload: any): boolean {
        // 360Dialog doesn't require signature validation in the same way Meta does
        // But we check for required fields
        return payload && (payload.messages || payload.statuses);
    }

    // Parse incoming webhook message (Support for both Flat and Meta Entry formats)
    parseIncomingMessage(payload: any): {
        from: string;
        text: string;
        messageId: string;
        timestamp: string;
        type: string;
    } | null {
        // Normalization: Extract 'messages' array from Meta "entry" format if present
        let messages = payload.messages;

        if (!messages && payload.entry?.[0]?.changes?.[0]?.value?.messages) {
            messages = payload.entry[0].changes[0].value.messages;
        }

        if (!messages || messages.length === 0) {
            return null;
        }

        const message = messages[0];

        // Safe extraction of body/caption
        const textBody = message.text?.body || message.caption || message.button?.text || '';

        return {
            from: message.from,
            text: textBody || `[${message.type}]`,
            messageId: message.id,
            timestamp: message.timestamp,
            type: message.type // 'text', 'image', 'audio', 'document', etc.
        };
    }

    // Parse status update (sent, delivered, read)
    parseStatusUpdate(payload: any): {
        messageId: string;
        status: string;
        timestamp: string;
    } | null {
        // Normalization: Extract 'statuses' array from Meta "entry" format if present
        let statuses = payload.statuses;

        if (!statuses && payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
            statuses = payload.entry[0].changes[0].value.statuses;
        }

        if (!statuses || statuses.length === 0) {
            return null;
        }

        const status = statuses[0];

        return {
            messageId: status.id,
            status: status.status, // 'sent', 'delivered', 'read', 'failed'
            timestamp: status.timestamp
        };
    }
}

// Singleton instance
export const dialog360 = new Dialog360Service();
