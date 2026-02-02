import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { getRealtimeDb } from '@/config/firebase';

export interface UserStatus {
    state: 'online' | 'idle' | 'offline';
    last_changed: number;
}

export function useTeamStatus() {
    const [teamStatus, setTeamStatus] = useState<Record<string, UserStatus>>({});
    const rtdb = getRealtimeDb();

    useEffect(() => {
        const allStatusRef = ref(rtdb, '/status');

        const handleUpdate = (snapshot: any) => {
            const data = snapshot.val() || {};
            setTeamStatus(data);
        };

        // Escuta TUDO de /status (Cuidado se tiver MILHARES de users, mas pra CRM é de boa)
        onValue(allStatusRef, handleUpdate);

        return () => {
            off(allStatusRef, 'value', handleUpdate);
        };
    }, []);

    return teamStatus;
}
