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

    const { apiKey, baseUrl, to, text } = req.body;

    console.log('Received request:', { baseUrl, to, text, hasApiKey: !!apiKey });

    if (!apiKey || !baseUrl || !to || !text) {
        return res.status(400).json({
            error: 'Missing required parameters',
            received: { hasApiKey: !!apiKey, hasBaseUrl: !!baseUrl, hasTo: !!to, hasText: !!text }
        });
    }

    // Build the full URL
    const fullUrl = `${baseUrl}/v1/messages`;

    // Build the payload
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
            body: text
        }
    };

    console.log('Sending to 360Dialog:', { url: fullUrl, payload });

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
        console.log('360Dialog Response:', { status: response.status, body: responseText });

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
