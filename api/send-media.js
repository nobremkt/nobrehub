import { getIntegrationConfig, setCorsHeaders } from './_lib/integrationHelper.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { to, mediaType, mediaUrl, caption, viewOnce } = req.body;

    if (!to || !mediaType || !mediaUrl) {
        return res.status(400).json({
            error: 'Missing required parameters',
            received: { hasTo: !!to, hasMediaType: !!mediaType, hasMediaUrl: !!mediaUrl }
        });
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

    const fullUrl = `${config.baseUrl}/messages`;

    let payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: mediaType,
    };

    switch (mediaType) {
        case 'image':
            payload.image = { link: mediaUrl };
            if (caption) payload.image.caption = caption;
            if (viewOnce) payload.image.view_once = true;
            break;
        case 'video':
            payload.video = { link: mediaUrl };
            if (caption) payload.video.caption = caption;
            if (viewOnce) payload.video.view_once = true;
            break;
        case 'audio':
            payload.audio = { link: mediaUrl };
            break;
        case 'document':
            payload.document = {
                link: mediaUrl,
                filename: caption || 'document'
            };
            break;
        default:
            return res.status(400).json({ error: 'Invalid media type' });
    }

    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'D360-API-KEY': config.apiKey,
                'Content-Type': 'application/json'
            },
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
                details: data
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}
