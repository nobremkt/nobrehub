/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTEGRATION TEST — Strategic Subscriptions
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Tests that StrategicProjectsService realtime subscriptions:
 * 1. Receive events on strategic_projects changes
 * 2. Filter tasks by project_id
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

describe('Strategic Subscriptions', () => {
    const STRATEGIC_PROJECT = TEST_IDS.STRATEGIC_PROJECT_1;
    const STRATEGIC_TASK = '00000000-0000-0000-0000-000000000061';

    beforeAll(async () => {
        await seedTestData();

        // Create strategic project + task
        // strategic_projects uses: title, owner_id, is_shared, status
        await supabaseAdmin.from('strategic_projects').upsert([
            { id: STRATEGIC_PROJECT, title: 'Test Strategic Project', owner_id: TEST_IDS.USER_A, status: 'active', is_shared: false },
        ], { onConflict: 'id' });

        await supabaseAdmin.from('strategic_tasks').upsert([
            { id: STRATEGIC_TASK, project_id: STRATEGIC_PROJECT, title: 'Test Task', completed: false },
        ], { onConflict: 'id' });

        await wait(1000);
    });

    afterAll(async () => {
        removeAllChannels(supabaseAnon);
        await supabaseAdmin.from('strategic_tasks').delete().eq('id', STRATEGIC_TASK);
        await supabaseAdmin.from('strategic_projects').delete().eq('id', STRATEGIC_PROJECT);
        await cleanupTestData();
    });

    afterEach(() => {
        removeAllChannels(supabaseAnon);
    });

    // ─── subscribeToProjects ─────────────────────────────────────────
    describe('subscribeToProjects (table: strategic_projects)', () => {
        it('should receive callback on INSERT', async () => {
            let events = 0;
            const NEW_PROJECT = '00000000-0000-0000-0000-000000000062';

            const channel = supabaseAnon
                .channel('test-strategic-projects')
                .on('postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'strategic_projects' },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            await supabaseAdmin.from('strategic_projects').insert({
                id: NEW_PROJECT,
                title: 'Another Strategic Project',
                owner_id: TEST_IDS.USER_A,
                status: 'active',
                is_shared: false,
            });

            await wait(2000);

            expect(events).toBe(1);

            supabaseAnon.removeChannel(channel);
            await supabaseAdmin.from('strategic_projects').delete().eq('id', NEW_PROJECT);
        });

        it('should receive callback on UPDATE', async () => {
            let events = 0;

            const channel = supabaseAnon
                .channel('test-strategic-projects-update')
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'strategic_projects' },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            await supabaseAdmin
                .from('strategic_projects')
                .update({ status: 'completed' })
                .eq('id', STRATEGIC_PROJECT);

            await wait(2000);

            expect(events).toBeGreaterThanOrEqual(1);

            supabaseAnon.removeChannel(channel);

            // Reset
            await supabaseAdmin
                .from('strategic_projects')
                .update({ status: 'active' })
                .eq('id', STRATEGIC_PROJECT);
        });
    });

    // ─── subscribeToTasks (filtered by project_id) ───────────────────
    describe('subscribeToTasks (filtered by project_id)', () => {
        it('should receive events for tasks in the matching project', async () => {
            let events = 0;

            const channel = supabaseAnon
                .channel('test-strategic-tasks')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'strategic_tasks',
                        filter: `project_id=eq.${STRATEGIC_PROJECT}`,
                    },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            await supabaseAdmin
                .from('strategic_tasks')
                .update({ completed: true, completed_at: new Date().toISOString() })
                .eq('id', STRATEGIC_TASK);

            await wait(2000);

            expect(events).toBeGreaterThanOrEqual(1);

            supabaseAnon.removeChannel(channel);

            // Reset
            await supabaseAdmin
                .from('strategic_tasks')
                .update({ completed: false, completed_at: null })
                .eq('id', STRATEGIC_TASK);
        });

        it('should NOT receive events for tasks in a different project', async () => {
            let events = 0;
            const OTHER_PROJECT = '00000000-0000-0000-0000-000000000063';
            const OTHER_TASK = '00000000-0000-0000-0000-000000000064';

            await supabaseAdmin.from('strategic_projects').upsert([
                { id: OTHER_PROJECT, title: 'Other Project', owner_id: TEST_IDS.USER_B, status: 'active', is_shared: false },
            ], { onConflict: 'id' });

            await supabaseAdmin.from('strategic_tasks').upsert([
                { id: OTHER_TASK, project_id: OTHER_PROJECT, title: 'Other Task', completed: false },
            ], { onConflict: 'id' });

            const channel = supabaseAnon
                .channel('test-strategic-tasks-isolation')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'strategic_tasks',
                        filter: `project_id=eq.${STRATEGIC_PROJECT}`,
                    },
                    () => { events++; }
                );

            await waitForSubscription(channel);

            // Update task in OTHER project
            await supabaseAdmin
                .from('strategic_tasks')
                .update({ completed: true })
                .eq('id', OTHER_TASK);

            await wait(2000);

            expect(events).toBe(0);

            supabaseAnon.removeChannel(channel);

            // Cleanup
            await supabaseAdmin.from('strategic_tasks').delete().eq('id', OTHER_TASK);
            await supabaseAdmin.from('strategic_projects').delete().eq('id', OTHER_PROJECT);
        });
    });
});
