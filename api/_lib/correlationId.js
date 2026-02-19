/**
 * ═══════════════════════════════════════════════════════════════════════
 * CORRELATION ID — Lightweight request tracing for Vercel Functions
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Generates a short unique ID per request and returns a structured logger.
 *
 * Usage:
 *   import { createRequestLogger } from './_lib/correlationId.js';
 *
 *   export default async function handler(req, res) {
 *       const log = createRequestLogger('send-message', req);
 *       log.info('Processing request', { to, text });
 *       // ... on error:
 *       log.error('API call failed', { status: response.status });
 *       // Sets x-correlation-id header on response
 *       log.setHeader(res);
 *   }
 * ═══════════════════════════════════════════════════════════════════════
 */

// Short random hex ID (8 chars) — unique enough for request tracing
function generateCorrelationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${timestamp}-${random}`;
}

/**
 * Creates a scoped logger with a correlation ID for the given request.
 * @param {string} endpoint - The endpoint name (e.g. 'send-message', 'webhook')
 * @param {object} req - The incoming request object
 */
export function createRequestLogger(endpoint, req) {
    const correlationId = req?.headers?.['x-correlation-id'] || generateCorrelationId();

    const prefix = `[${endpoint}][${correlationId}]`;

    return {
        correlationId,

        info(message, data) {
            console.log(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
        },

        warn(message, data) {
            console.warn(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
        },

        error(message, data) {
            console.error(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
        },

        /** Sets the correlation ID on the response header for client-side debugging */
        setHeader(res) {
            if (res && typeof res.setHeader === 'function') {
                res.setHeader('x-correlation-id', correlationId);
            }
        },
    };
}
