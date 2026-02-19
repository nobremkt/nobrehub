/**
 * Shared helper for Vercel API routes.
 * Reads integration settings from Supabase + env vars.
 */
import { createClient } from '@supabase/supabase-js';

let _client = null;

const DEFAULT_META_GRAPH_BASE_URL = 'https://graph.facebook.com';
const DEFAULT_META_API_VERSION = 'v23.0';

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
 * Get WhatsApp integration credentials from env vars + integration_settings table.
 * Supports provider: 360dialog | meta_cloud
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

    const provider = data.provider === 'meta_cloud' ? 'meta_cloud' : '360dialog';

    if (provider === '360dialog') {
        const apiKey = process.env.D360_API_KEY;
        if (!apiKey) {
            throw new Error('Missing D360_API_KEY environment variable');
        }

        // Normalize URL: ensure it ends with /v1 for 360Dialog v2 API
        let baseUrl = (data.base_url || '').replace(/\/+$/, '');
        if (!baseUrl) {
            throw new Error('Missing base_url for 360dialog in integration_settings');
        }
        if (!baseUrl.includes('/v1')) {
            baseUrl = `${baseUrl}/v1`;
        }

        return {
            provider,
            baseUrl,
            apiKey,
            enabled: data.enabled,
        };
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const businessAccountId = process.env.META_WABA_ID;

    if (!accessToken) {
        throw new Error('Missing META_ACCESS_TOKEN environment variable');
    }
    if (!phoneNumberId) {
        throw new Error('Missing META_PHONE_NUMBER_ID environment variable');
    }
    if (!businessAccountId) {
        throw new Error('Missing META_WABA_ID environment variable');
    }

    const graphBaseUrl = (process.env.META_GRAPH_BASE_URL || data.base_url || DEFAULT_META_GRAPH_BASE_URL)
        .replace(/\/+$/, '');
    const graphApiVersion = (process.env.META_API_VERSION || DEFAULT_META_API_VERSION).trim();

    return {
        provider,
        enabled: data.enabled,
        accessToken,
        phoneNumberId,
        businessAccountId,
        graphBaseUrl,
        graphApiVersion,
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
