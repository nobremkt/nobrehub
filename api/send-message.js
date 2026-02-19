import { getIntegrationConfig, setCorsHeaders } from './_lib/integrationHelper.js';
import { createRequestLogger } from './_lib/correlationId.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    const log = createRequestLogger('send-message', req);
    log.setHeader(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { to, text } = req.body;

    if (!to || !text) {
        return res.status(400).json({
            error: 'Missing required parameters',
            received: { hasTo: !!to, hasText: !!text }
        });
    }

    let config;
    try {
        config = await getIntegrationConfig();
    } catch (error) {
        log.error('Config error', { message: error.message });
        return res.status(500).json({ error: 'Integration not configured', message: error.message });
    }

    if (!config.enabled) {
        return res.status(400).json({ error: 'WhatsApp integration is disabled' });
    }

    const fullUrl = config.provider === 'meta_cloud'
        ? `${config.graphBaseUrl}/${config.graphApiVersion}/${config.phoneNumberId}/messages`
        : `${config.baseUrl}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: text }
    };

    try {
        const headers = config.provider === 'meta_cloud'
            ? {
                Authorization: `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
            : {
                'D360-API-KEY': config.apiKey,
                'Content-Type': 'application/json'
            };

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { rawResponse: responseText };
        }

        if (!response.ok) {
            return res.status(response.status).json({
                error: '360Dialog API Error',
                status: response.status,
                provider: config.provider,
                details: data
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        log.error('Proxy error', { message: error.message });
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}
