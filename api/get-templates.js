import { getIntegrationConfig, setCorsHeaders } from './_lib/integrationHelper.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    let config;
    try {
        config = await getIntegrationConfig();
    } catch (error) {
        console.error('Config error:', error.message);
        return res.status(500).json({ error: 'Integration not configured', message: error.message });
    }

    const url = config.provider === 'meta_cloud'
        ? `${config.graphBaseUrl}/${config.graphApiVersion}/${config.businessAccountId}/message_templates?limit=100`
        : `${config.baseUrl}/configs/templates`;

    try {
        const headers = config.provider === 'meta_cloud'
            ? {
                Authorization: `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
            : {
                'D360-API-KEY': config.apiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            };

        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('360Dialog Error:', data);
            return res.status(response.status).json({
                error: 'Failed to fetch templates from WhatsApp provider',
                provider: config.provider,
                details: data
            });
        }

        // Normalize response shape for frontend compatibility.
        // 360dialog -> { waba_templates: [...] }
        // Meta Cloud -> { data: [...] }
        if (config.provider === 'meta_cloud') {
            return res.status(200).json({
                waba_templates: data?.data || [],
                paging: data?.paging || null,
                provider: 'meta_cloud',
            });
        }

        return res.status(200).json({
            ...data,
            provider: '360dialog',
        });
    } catch (error) {
        console.error('SERVER ERROR:', error);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}
