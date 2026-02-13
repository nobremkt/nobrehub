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

    // Normalize URL
    let cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');
    if (!cleanBaseUrl.includes('/v1')) {
        cleanBaseUrl = `${cleanBaseUrl}/v1`;
    }

    const url = `${cleanBaseUrl}/configs/templates`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'D360-API-KEY': config.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('360Dialog Error:', data);
            return res.status(response.status).json({
                error: 'Failed to fetch templates from 360Dialog',
                details: data
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('SERVER ERROR:', error);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}
