/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTEGRATION TEST — Inbox Subscriptions
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Tests that InboxService realtime subscriptions:
 * 1. Receive callbacks on data changes
 * 2. Properly filter by conversation_id / lead_id
 * 3. Don't leak events from unrelated records
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
    supabaseAnon,
    supabaseAdmin,
    TEST_IDS,
    seedTestData,
    cleanupTestData,
    removeAllChannels,
    wait,
    waitForSubscription,
} from '../setup';

describe('Inbox Subscriptions', () => {
    beforeAll(async () => {
        await seedTestData();
        await wait(1000);
    });

    afterAll(async () => {
        removeAllChannels(supabaseAnon);
        await cleanupTestData();
    });

    afterEach(() => {
        removeAllChannels(supabaseAnon);
    });

    // ─── subscribeToConversations ─────────────────────────────────────
    describe('subscribeToConversations (table: conversations)', () => {
        it('should receive a callback when a conversation is updated', async () => {
            let callbackFired = false;

            const channel = supabaseAnon
                .channel('test-inbox-conversations')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'conversations' },
                    () => { callbackFired = true; }
                );

            await waitForSubscription(channel);

            // Trigger a change
            await supabaseAdmin
                .from('conversations')
                .update({ status: 'closed' })
                .eq('id', TEST_IDS.CONVERSATION_1);

            await wait(2000);

            expect(callbackFired).toBe(true);

            supabaseAnon.removeChannel(channel);

            // Reset
            await supabaseAdmin
                .from('conversations')
                .update({ status: 'open' })
                .eq('id', TEST_IDS.CONVERSATION_1);
        });
    });

    // ─── subscribeToMessages (filtered by conversation_id) ────────────
    describe('subscribeToMessages (filtered by conversation_id)', () => {
        it('should receive events only for the subscribed conversation', async () => {
            let matchingEvents = 0;

            const channel = supabaseAnon
                .channel('test-inbox-messages-filtered')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${TEST_IDS.CONVERSATION_1}`,
                    },
                    () => { matchingEvents++; }
                );

            await waitForSubscription(channel);

            // Insert message in OUR conversation
            await supabaseAdmin
                .from('messages')
                .insert({
                    conversation_id: TEST_IDS.CONVERSATION_1,
                    content: 'Test message 1',
                    sender_type: 'agent',
                    type: 'text',
                });

            await wait(2000);

            expect(matchingEvents).toBe(1);

            supabaseAnon.removeChannel(channel);

            // Cleanup
            await supabaseAdmin
                .from('messages')
                .delete()
                .eq('conversation_id', TEST_IDS.CONVERSATION_1);
        });

        it('should NOT receive events for a different conversation', async () => {
            let events = 0;
            const OTHER_CONV_ID = '00000000-0000-0000-0000-000000000099';

            // Create another conversation for isolation test
            await supabaseAdmin.from('conversations').upsert([
                { id: OTHER_CONV_ID, lead_id: TEST_IDS.LEAD_1, phone: '+5511888888888', name: 'Other Lead', status: 'open' },
            ], { onConflict: 'id' });

            const channel = supabaseAnon
                .channel('test-inbox-messages-isolation')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${TEST_IDS.CONVERSATION_1}`,
                    },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Insert message in OTHER conversation
            await supabaseAdmin
                .from('messages')
                .insert({
                    conversation_id: OTHER_CONV_ID,
                    content: 'Message for different conversation',
                    sender_type: 'agent',
                    type: 'text',
                });

            await wait(2000);

            // Should NOT have received the event
            expect(events).toBe(0);

            supabaseAnon.removeChannel(channel);

            // Cleanup
            await supabaseAdmin.from('messages').delete().eq('conversation_id', OTHER_CONV_ID);
            await supabaseAdmin.from('conversations').delete().eq('id', OTHER_CONV_ID);
        });
    });

    // ─── subscribeToConversationByLeadId (filtered) ───────────────────
    describe('subscribeToConversationByLeadId (filtered by lead_id)', () => {
        it('should receive events only for the matching lead_id', async () => {
            let events = 0;

            const channel = supabaseAnon
                .channel('test-inbox-conv-lead')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'conversations',
                        filter: `lead_id=eq.${TEST_IDS.LEAD_1}`,
                    },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Update the conversation for OUR lead
            await supabaseAdmin
                .from('conversations')
                .update({ status: 'closed' })
                .eq('id', TEST_IDS.CONVERSATION_1);

            await wait(2000);

            expect(events).toBeGreaterThanOrEqual(1);

            supabaseAnon.removeChannel(channel);

            // Reset
            await supabaseAdmin
                .from('conversations')
                .update({ status: 'open' })
                .eq('id', TEST_IDS.CONVERSATION_1);
        });
    });
});
