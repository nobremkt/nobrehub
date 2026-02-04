export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    /* 
       We expect body to contain { apiKey, baseUrl } 
       We use POST to keep apiKey out of query params (logs).
    */
    const { apiKey, baseUrl } = req.body;

    if (!apiKey || !baseUrl) {
        return res.status(400).json({ error: 'Missing apiKey or baseUrl' });
    }

    /*
       360Dialog Template Endpoint
       Commonly: /v1/configs/templates
       We assume baseUrl includes /v1 or is the root. 
       If baseUrl is like "https://waba.360dialog.io/v1", we probably want "https://waba.360dialog.io/v1/configs/templates"
    */

    // Normalize url: remove trailing slash
    let cleanBaseUrl = baseUrl.replace(/\/+$/, '');

    // Add /v1 if not present (360Dialog standard)
    if (!cleanBaseUrl.includes('/v1')) {
        cleanBaseUrl = `${cleanBaseUrl}/v1`;
    }

    // Construct URL. Note: Some APIs might differ, but this is standard for D360
    const url = `${cleanBaseUrl}/configs/templates`;

    console.log(`Fetching templates from: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'D360-API-KEY': apiKey,
                'Content-Type': 'application/json',
                // Some endpoints need Accept
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('360Dialog Error:', data);
            return res.status(response.status).json({ error: 'Failed to fetch templates from 360Dialog', details: data });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('SERVER ERROR:', error);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}
