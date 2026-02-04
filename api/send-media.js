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

    const { apiKey, baseUrl, to, mediaType, mediaUrl, caption, viewOnce } = req.body;

    console.log('Received media request:', { baseUrl, to, mediaType, viewOnce, hasApiKey: !!apiKey });

    if (!apiKey || !baseUrl || !to || !mediaType || !mediaUrl) {
        return res.status(400).json({
            error: 'Missing required parameters',
            received: { hasApiKey: !!apiKey, hasBaseUrl: !!baseUrl, hasTo: !!to, hasMediaType: !!mediaType, hasMediaUrl: !!mediaUrl }
        });
    }

    // Build the full URL - v2 API uses /messages
    const fullUrl = `${baseUrl}/messages`;

    // Build the payload based on media type
    let payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: mediaType, // image, video, audio, document
    };

    // Add the media object based on type
    switch (mediaType) {
        case 'image':
            payload.image = { link: mediaUrl };
            if (caption) payload.image.caption = caption;
            if (viewOnce) payload.image.view_once = true; // View Once support
            break;
        case 'video':
            payload.video = { link: mediaUrl };
            if (caption) payload.video.caption = caption;
            if (viewOnce) payload.video.view_once = true; // View Once support
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

    console.log('Sending media to 360Dialog:', { url: fullUrl, payload });

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
