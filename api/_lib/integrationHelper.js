/**
 * Shared helper for Vercel API routes.
 * Reads integration settings from Supabase + env vars.
 */
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getServiceClient() {
    if (_client) return _client;

    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    }

    _client = createClient(url, key);
    return _client;
}

/**
 * Get the 360Dialog credentials from env vars + integration_settings table.
 * Returns { apiKey, baseUrl, enabled, provider } or throws.
 */
export async function getIntegrationConfig() {
    const supabase = getServiceClient();

    const { data, error } = await supabase
        .from('integration_settings')
        .select('provider, base_url, enabled')
        .limit(1)
        .single();

    if (error || !data) {
        throw new Error('Integration settings not found: ' + (error?.message || 'No data'));
    }

    const apiKey = process.env.D360_API_KEY;
    if (!apiKey) {
        throw new Error('Missing D360_API_KEY environment variable');
    }

    return {
        provider: data.provider,
        baseUrl: data.base_url,
        apiKey,
        enabled: data.enabled,
    };
}

/**
 * Set CORS headers. Restrict to known origins in production.
 */
export function setCorsHeaders(res) {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
}
