import { useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

// Tipos de estado
export type UserPresenceStatus = 'online' | 'idle' | 'offline';

export function usePresence() {
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (!user) return;

        const userId = user.authUid || user.id;
        const channel = supabase.channel('presence', {
            config: { presence: { key: userId } },
        });

        const trackOnline = () => channel.track({ state: 'online', last_changed: Date.now() });
        const trackIdle = () => channel.track({ state: 'idle', last_changed: Date.now() });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                trackOnline();
            }
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                trackIdle();
            } else {
                trackOnline();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            supabase.removeChannel(channel);
        };
    }, [user?.id, user?.authUid]);
}
