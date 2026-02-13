/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TEST SETUP — Supabase Local Client + Helpers
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Uses the Supabase Local Development instance (Docker).
 * Default local credentials from `supabase start`.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ─── Supabase Local defaults (from `supabase start`) ─────────────────────────
const SUPABASE_LOCAL_URL = 'http://127.0.0.1:54321';
const SUPABASE_LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

/**
 * Anon client — same as what the app uses
 */
export const supabaseAnon: SupabaseClient = createClient(
    SUPABASE_LOCAL_URL,
    SUPABASE_LOCAL_ANON_KEY,
    {
        realtime: {
            params: { eventsPerSecond: 100 },
        },
    }
);

/**
 * Service role client — bypasses RLS for seeding/cleanup
 */
export const supabaseAdmin: SupabaseClient = createClient(
    SUPABASE_LOCAL_URL,
    SUPABASE_LOCAL_SERVICE_KEY
);

// ─── Test Data IDs (deterministic for assertions) ────────────────────────────
export const TEST_IDS = {
    USER_A: '00000000-0000-0000-0000-000000000001',
    USER_B: '00000000-0000-0000-0000-000000000002',
    SECTOR_PRODUCAO: '00000000-0000-0000-0000-000000000010',
    SECTOR_VENDAS: '00000000-0000-0000-0000-000000000011',
    LEAD_1: '00000000-0000-0000-0000-000000000020',
    CONVERSATION_1: '00000000-0000-0000-0000-000000000030',
    PROJECT_1: '00000000-0000-0000-0000-000000000040',
    CHANNEL_1: '00000000-0000-0000-0000-000000000050',
    STRATEGIC_PROJECT_1: '00000000-0000-0000-0000-000000000060',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wait for a given number of milliseconds
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wait for a Supabase channel to reach SUBSCRIBED status.
 * Returns a promise that resolves when the subscription is ready.
 */
export function waitForSubscription(
    channel: ReturnType<SupabaseClient['channel']>,
    timeoutMs = 10_000
): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Channel did not reach SUBSCRIBED within ${timeoutMs}ms`)),
            timeoutMs
        );

        channel.subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
                clearTimeout(timer);
                // Small extra delay so Postgres replication slot is ready
                setTimeout(resolve, 500);
            }
        });
    });
}

/**
 * Create a promise that resolves when the callback is called
 * Useful for testing subscription callbacks
 */
export function createCallbackPromise<T>(timeoutMs = 10_000): {
    promise: Promise<T>;
    callback: (data: T) => void;
    reject: (err: Error) => void;
} {
    let callback: (data: T) => void;
    let reject: (err: Error) => void;
    const promise = new Promise<T>((res, rej) => {
        callback = res;
        reject = rej;
        setTimeout(() => rej(new Error(`Callback not called within ${timeoutMs}ms`)), timeoutMs);
    });
    return { promise, callback: callback!, reject: reject! };
}

/**
 * Seed test data using the service role client (bypasses RLS)
 */
export async function seedTestData() {
    const { USER_A, USER_B, SECTOR_PRODUCAO, SECTOR_VENDAS, LEAD_1, CONVERSATION_1, PROJECT_1, CHANNEL_1 } = TEST_IDS;

    // Sectors
    await supabaseAdmin.from('sectors').upsert([
        { id: SECTOR_PRODUCAO, name: 'Produção', active: true, display_order: 0 },
        { id: SECTOR_VENDAS, name: 'Vendas', active: true, display_order: 1 },
    ], { onConflict: 'id' });

    // Users
    await supabaseAdmin.from('users').upsert([
        { id: USER_A, name: 'Test User A', email: 'test-a@test.com', sector_id: SECTOR_PRODUCAO, active: true },
        { id: USER_B, name: 'Test User B', email: 'test-b@test.com', sector_id: SECTOR_VENDAS, active: true },
    ], { onConflict: 'id' });

    // Lead
    await supabaseAdmin.from('leads').upsert([
        { id: LEAD_1, name: 'Test Lead', phone: '+5511999999999', pipeline: 'default', responsible_id: USER_B, deal_status: 'open' },
    ], { onConflict: 'id' });

    // Conversation
    await supabaseAdmin.from('conversations').upsert([
        { id: CONVERSATION_1, lead_id: LEAD_1, phone: '+5511999999999', name: 'Test Lead', status: 'open' },
    ], { onConflict: 'id' });

    // Project
    await supabaseAdmin.from('projects').upsert([
        { id: PROJECT_1, name: 'Test Project', producer_id: USER_A, lead_id: LEAD_1, status: 'em-andamento', total_points: 10 },
    ], { onConflict: 'id' });

    // Team Chat Channel
    await supabaseAdmin.from('team_chat_channels').upsert([
        { id: CHANNEL_1, type: 'private', member_ids: [USER_A, USER_B], name: 'Test Chat' },
    ], { onConflict: 'id' });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
    const ids = TEST_IDS;

    // Delete in reverse dependency order
    await supabaseAdmin.from('team_chat_messages').delete().eq('channel_id', ids.CHANNEL_1);
    await supabaseAdmin.from('team_chat_channels').delete().eq('id', ids.CHANNEL_1);
    await supabaseAdmin.from('messages').delete().eq('conversation_id', ids.CONVERSATION_1);
    await supabaseAdmin.from('projects').delete().eq('id', ids.PROJECT_1);
    await supabaseAdmin.from('conversations').delete().eq('id', ids.CONVERSATION_1);
    await supabaseAdmin.from('leads').delete().eq('id', ids.LEAD_1);
    await supabaseAdmin.from('users').delete().in('id', [ids.USER_A, ids.USER_B]);
    await supabaseAdmin.from('sectors').delete().in('id', [ids.SECTOR_PRODUCAO, ids.SECTOR_VENDAS]);
}

/**
 * Remove all Supabase realtime channels
 */
export function removeAllChannels(client: SupabaseClient) {
    client.removeAllChannels();
}
