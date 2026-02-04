export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { apiKey, baseUrl, to, templateName, language, components } = req.body;

    console.log('Send Template Request:', { baseUrl, to, templateName, language, hasApiKey: !!apiKey });

    if (!apiKey || !baseUrl || !to || !templateName) {
        return res.status(400).json({
            error: 'Missing required parameters',
            received: { hasApiKey: !!apiKey, hasBaseUrl: !!baseUrl, hasTo: !!to, hasTemplateName: !!templateName }
        });
    }

    // Build the full URL
    const fullUrl = `${baseUrl}/messages`;

    // Build the template payload per WhatsApp Cloud API spec
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: language || 'pt_BR'
            }
        }
    };

    // Add components if provided (for variables, header, buttons, etc.)
    if (components && components.length > 0) {
        payload.template.components = components;
    }

    console.log('Sending Template to 360Dialog:', { url: fullUrl, payload: JSON.stringify(payload, null, 2) });

    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'D360-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('360Dialog Template Response:', { status: response.status, body: responseText });

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
        console.error('Template Send Error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}
