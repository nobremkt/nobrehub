/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTEGRATION TEST — Team Chat Subscriptions
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Tests team_chat_channels and team_chat_messages subscriptions.
 * Highlights: teamChatService currently listens to ALL changes on
 * team_chat_channels without a filter — this test documents that behavior.
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

describe('Team Chat Subscriptions', () => {
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

    // ─── subscribeToUserChats (currently unfiltered — E1 issue) ───────
    describe('subscribeToUserChats (table: team_chat_channels)', () => {
        it('should receive events when ANY channel changes (current behavior — unfiltered)', async () => {
            let events = 0;

            // This mirrors the current production code: NO filter
            const channel = supabaseAnon
                .channel('test-team-chats-unfiltered')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'team_chat_channels' },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Update our channel
            await supabaseAdmin
                .from('team_chat_channels')
                .update({ name: 'Updated Chat Name' })
                .eq('id', TEST_IDS.CHANNEL_1);

            await wait(2000);

            expect(events).toBeGreaterThanOrEqual(1);

            supabaseAnon.removeChannel(channel);

            // Reset
            await supabaseAdmin
                .from('team_chat_channels')
                .update({ name: 'Test Chat' })
                .eq('id', TEST_IDS.CHANNEL_1);
        });

        it('[E1 ISSUE] receives events from channels the user is NOT a member of', async () => {
            let events = 0;
            const OTHER_CHANNEL = '00000000-0000-0000-0000-000000000051';
            const OTHER_USER = '00000000-0000-0000-0000-000000000003';

            // Create a channel that USER_A is NOT part of
            await supabaseAdmin.from('users').upsert([
                { id: OTHER_USER, name: 'Other User', email: 'other@test.com', active: true },
            ], { onConflict: 'id' });

            await supabaseAdmin.from('team_chat_channels').upsert([
                { id: OTHER_CHANNEL, type: 'private', member_ids: [OTHER_USER, TEST_IDS.USER_B], name: 'Other Chat' },
            ], { onConflict: 'id' });

            // USER_A subscribes — NO filter, so they'll get everything
            const channel = supabaseAnon
                .channel('test-team-chats-leak')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'team_chat_channels' },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Update a channel USER_A is NOT in
            await supabaseAdmin
                .from('team_chat_channels')
                .update({ name: 'Secret Chat Updated' })
                .eq('id', OTHER_CHANNEL);

            await wait(2000);

            // This SHOULD be 0 in an ideal world, but current code receives it
            // This test documents the E1 issue
            expect(events).toBeGreaterThanOrEqual(1); // Currently leaks — expected

            supabaseAnon.removeChannel(channel);

            // Cleanup
            await supabaseAdmin.from('team_chat_channels').delete().eq('id', OTHER_CHANNEL);
            await supabaseAdmin.from('users').delete().eq('id', OTHER_USER);
        });
    });

    // ─── subscribeToMessages (filtered by channel_id) ─────────────────
    describe('subscribeToMessages (filtered by channel_id)', () => {
        it('should receive events only for the subscribed channel', async () => {
            let events = 0;

            const channel = supabaseAnon
                .channel('test-team-messages-filtered')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'team_chat_messages',
                        filter: `channel_id=eq.${TEST_IDS.CHANNEL_1}`,
                    },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Insert message in OUR channel
            await supabaseAdmin
                .from('team_chat_messages')
                .insert({
                    channel_id: TEST_IDS.CHANNEL_1,
                    sender_id: TEST_IDS.USER_A,
                    sender_name: 'Test User A',
                    content: 'Test message',
                    type: 'text',
                });

            await wait(2000);

            expect(events).toBe(1);

            supabaseAnon.removeChannel(channel);

            // Cleanup
            await supabaseAdmin
                .from('team_chat_messages')
                .delete()
                .eq('channel_id', TEST_IDS.CHANNEL_1);
        });
    });
});
