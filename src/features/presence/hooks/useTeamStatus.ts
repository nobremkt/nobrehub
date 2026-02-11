import { useEffect, useState } from 'react';
import { RealtimePresenceState } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';

export interface UserStatus {
    state: 'online' | 'idle' | 'offline';
    last_changed: number;
}

export function useTeamStatus() {
    const [teamStatus, setTeamStatus] = useState<Record<string, UserStatus>>({});

    useEffect(() => {
        const channel = supabase.channel('presence');

        const normalizePresence = (state: RealtimePresenceState<Record<string, unknown>>): Record<string, UserStatus> => {
            const normalized: Record<string, UserStatus> = {};

            Object.entries(state).forEach(([key, presences]) => {
                const latest = presences[presences.length - 1] as { state?: string; last_changed?: number } | undefined;
                const rawState = latest?.state;
                const rawLastChanged = latest?.last_changed;

                const safeState: UserStatus['state'] =
                    rawState === 'online' || rawState === 'idle' || rawState === 'offline'
                        ? rawState
                        : 'offline';

                normalized[key] = {
                    state: safeState,
                    last_changed: typeof rawLastChanged === 'number' ? rawLastChanged : Date.now(),
                };
            });

            return normalized;
        };

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<Record<string, unknown>>();
                setTeamStatus(normalizePresence(state));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return teamStatus;
}
