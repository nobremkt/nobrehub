import { getIntegrationConfig, setCorsHeaders } from './_lib/integrationHelper.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { to, body, header, buttons } = req.body;

    if (!to || !body || !buttons?.length) {
        return res.status(400).json({
            error: 'Missing required parameters',
            received: { hasTo: !!to, hasBody: !!body, hasButtons: !!buttons?.length }
        });
    }

    if (buttons.length > 3) {
        return res.status(400).json({ error: 'Maximum 3 buttons allowed' });
    }

    let config;
    try {
        config = await getIntegrationConfig();
    } catch (error) {
        console.error('Config error:', error.message);
        return res.status(500).json({ error: 'Integration not configured', message: error.message });
    }

    if (!config.enabled) {
        return res.status(400).json({ error: 'WhatsApp integration is disabled' });
    }

    const fullUrl = config.provider === 'meta_cloud'
        ? `${config.graphBaseUrl}/${config.graphApiVersion}/${config.phoneNumberId}/messages`
        : `${config.baseUrl}/messages`;

    const interactive = {
        type: 'button',
        body: { text: body },
        action: {
            buttons: buttons.map((btn, idx) => ({
                type: 'reply',
                reply: {
                    id: btn.id || `btn_${idx}`,
                    title: btn.title.slice(0, 20), // WhatsApp limit
                }
            }))
        }
    };

    // Optional header
    if (header) {
        interactive.header = { type: 'text', text: header };
    }

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive,
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
        console.error('Interactive send error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}
