/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE VISIBILITY PAUSE HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Pauses Supabase Realtime subscriptions when the browser tab is hidden
 * to save bandwidth and DB connections. Resumes when the tab becomes visible.
 *
 * Usage: call `useVisibilityPause()` once in the Inbox page component.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef } from 'react';
import { useInboxStore } from '../stores/useInboxStore';

export const useVisibilityPause = () => {
    const wasPausedRef = useRef(false);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const store = useInboxStore.getState();

            if (document.hidden) {
                // Tab hidden → unsubscribe to save resources
                store.unsubConversations();
                store.unsubMessages();
                wasPausedRef.current = true;
            } else if (wasPausedRef.current) {
                // Tab visible again → re-subscribe
                store.init();

                const selectedId = store.selectedConversationId;
                if (selectedId) {
                    store.selectConversation(selectedId);
                }

                wasPausedRef.current = false;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);
};
