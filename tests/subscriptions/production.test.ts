/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTEGRATION TEST — Production Subscriptions
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Tests that ProductionService realtime subscriptions:
 * 1. Filter correctly by producer_id
 * 2. Filter correctly by lead_id
 * 3. Don't leak events from unrelated producers/leads
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

describe('Production Subscriptions', () => {
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

    // ─── subscribeProjectsByProducer ──────────────────────────────────
    describe('subscribeProjectsByProducer (filtered by producer_id)', () => {
        it('should receive events for the matching producer_id', async () => {
            let events = 0;

            const channel = supabaseAnon
                .channel('test-projects-producer')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'projects',
                        filter: `producer_id=eq.${TEST_IDS.USER_A}`,
                    },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Update OUR producer's project
            await supabaseAdmin
                .from('projects')
                .update({ status: 'entregue', delivered_at: new Date().toISOString() })
                .eq('id', TEST_IDS.PROJECT_1);

            await wait(2000);

            expect(events).toBeGreaterThanOrEqual(1);

            supabaseAnon.removeChannel(channel);

            // Reset
            await supabaseAdmin
                .from('projects')
                .update({ status: 'em-andamento', delivered_at: null })
                .eq('id', TEST_IDS.PROJECT_1);
        });

        it('should NOT receive events for a different producer', async () => {
            let events = 0;
            const OTHER_PROJECT = '00000000-0000-0000-0000-000000000041';

            // Create a project for USER_B
            await supabaseAdmin.from('projects').upsert([
                { id: OTHER_PROJECT, name: 'Other Project', producer_id: TEST_IDS.USER_B, lead_id: TEST_IDS.LEAD_1, status: 'em-andamento' },
            ], { onConflict: 'id' });

            const channel = supabaseAnon
                .channel('test-projects-producer-isolation')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'projects',
                        filter: `producer_id=eq.${TEST_IDS.USER_A}`,
                    },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Update OTHER producer's project
            await supabaseAdmin
                .from('projects')
                .update({ status: 'entregue' })
                .eq('id', OTHER_PROJECT);

            await wait(2000);

            expect(events).toBe(0);

            supabaseAnon.removeChannel(channel);

            // Cleanup
            await supabaseAdmin.from('projects').delete().eq('id', OTHER_PROJECT);
        });
    });

    // ─── subscribeToProjectsByLeadId ─────────────────────────────────
    describe('subscribeToProjectsByLeadId (filtered by lead_id)', () => {
        it('should receive events for the matching lead_id', async () => {
            let events = 0;

            const channel = supabaseAnon
                .channel('test-projects-lead')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'projects',
                        filter: `lead_id=eq.${TEST_IDS.LEAD_1}`,
                    },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Update project tied to OUR lead
            await supabaseAdmin
                .from('projects')
                .update({ total_points: 20 })
                .eq('id', TEST_IDS.PROJECT_1);

            await wait(2000);

            expect(events).toBeGreaterThanOrEqual(1);

            supabaseAnon.removeChannel(channel);

            // Reset
            await supabaseAdmin
                .from('projects')
                .update({ total_points: 10 })
                .eq('id', TEST_IDS.PROJECT_1);
        });
    });
});
