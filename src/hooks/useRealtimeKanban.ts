// useRealtimeKanban - Firebase Realtime DB hook for Kanban sync
// Replaces Socket.io lead/deal update events

import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set } from '../lib/firebase';
import { realtimeDb } from '../lib/firebase';

export interface KanbanCardUpdate {
    cardId: string;
    stage: string;
    position: number;
    updatedBy: string;
    timestamp: number;
}

export interface LeadUpdate {
    id: string;
    type: 'created' | 'updated' | 'deleted' | 'stage_changed' | 'assigned';
    data?: any;
    timestamp: number;
}

/**
 * Hook to sync Kanban card positions in realtime
 */
export function useRealtimeKanban(pipelineId: string | null) {
    const [cardUpdates, setCardUpdates] = useState<Map<string, KanbanCardUpdate>>(new Map());
    const [lastUpdate, setLastUpdate] = useState<KanbanCardUpdate | null>(null);

    useEffect(() => {
        if (!pipelineId) return;

        console.log(`🔥 Firebase: Subscribing to kanban pipeline ${pipelineId}`);

        const kanbanRef = ref(realtimeDb, `kanban/${pipelineId}`);

        const unsubscribe = onValue(kanbanRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const updates = new Map<string, KanbanCardUpdate>();

                Object.entries(data).forEach(([cardId, update]: [string, any]) => {
                    updates.set(cardId, { cardId, ...update });
                });

                setCardUpdates(updates);

                // Find the most recent update
                const allUpdates = Array.from(updates.values());
                if (allUpdates.length > 0) {
                    const mostRecent = allUpdates.reduce((a, b) =>
                        (a.timestamp || 0) > (b.timestamp || 0) ? a : b
                    );
                    setLastUpdate(mostRecent);
                }
            }
        });

        return () => {
            console.log(`🔥 Firebase: Unsubscribing from kanban pipeline ${pipelineId}`);
            unsubscribe();
        };
    }, [pipelineId]);

    // Update a card's position (called when drag ends)
    const updateCardPosition = useCallback((
        cardId: string,
        stage: string,
        position: number,
        userId: string
    ) => {
        if (!pipelineId) return;

        const cardRef = ref(realtimeDb, `kanban/${pipelineId}/${cardId}`);
        set(cardRef, {
            stage,
            position,
            updatedBy: userId,
            timestamp: Date.now()
        });
    }, [pipelineId]);

    return { cardUpdates, lastUpdate, updateCardPosition };
}

/**
 * Hook to listen for lead updates (new leads, updates, deletions)
 */
export function useRealtimeLeads() {
    const [lastLeadUpdate, setLastLeadUpdate] = useState<LeadUpdate | null>(null);

    useEffect(() => {
        console.log(`🔥 Firebase: Subscribing to global lead updates`);

        const leadsRef = ref(realtimeDb, `leads/updates`);

        const unsubscribe = onValue(leadsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setLastLeadUpdate({
                    id: data.id,
                    type: data.type,
                    data: data.data,
                    timestamp: data.timestamp || Date.now()
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return { lastLeadUpdate };
}

/**
 * Hook to listen for conversation updates
 */
export function useRealtimeConversationUpdates() {
    const [lastUpdate, setLastUpdate] = useState<{
        conversationId: string;
        type: 'new' | 'updated' | 'assigned';
        data?: any;
        timestamp: number;
    } | null>(null);

    useEffect(() => {
        console.log(`🔥 Firebase: Subscribing to conversation updates`);

        const conversationsRef = ref(realtimeDb, `conversationsUpdates`);

        const unsubscribe = onValue(conversationsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setLastUpdate({
                    conversationId: data.conversationId,
                    type: data.type,
                    data: data.data,
                    timestamp: data.timestamp || Date.now()
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return { lastUpdate };
}
