import { useEffect } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { getRealtimeDb, getFirebaseAuth } from '@/config/firebase';

// Tipos de estado
export type UserPresenceStatus = 'online' | 'idle' | 'offline';

export function usePresence() {
    // 1. Pegar usuário atual (vc pode usar seu hook de store/auth existente)
    // Vou usar direto do Firebase Auth p/ ser robusto
    const user = getFirebaseAuth().currentUser;
    const rtdb = getRealtimeDb();

    useEffect(() => {
        if (!user) return;

        const userId = user.uid;
        // Referências
        const userStatusRef = ref(rtdb, `/status/${userId}`);
        const connectedRef = ref(rtdb, '.info/connected');

        // Estado "Online"
        const isOnlineForDatabase = {
            state: 'online',
            last_changed: serverTimestamp(),
        };

        // Estado "Offline"
        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: serverTimestamp(),
        };

        // 2. Monitorar conexão REAL (nível socket do Firebase)
        const unsubscribe = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                // Se conectou:

                // A. Configura o que acontece se desconectar (cair net, fechar aba)
                onDisconnect(userStatusRef)
                    .set(isOfflineForDatabase)
                    .then(() => {
                        // B. Se a setagem do onDisconnect funcionou, então me marco como online AGORA
                        set(userStatusRef, isOnlineForDatabase);
                    });
            }
        });

        // 3. Monitorar IDLE state (Inatividade / Aba em segundo plano)
        // Isso é local, o browser detecta e atualiza o RTDB
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Usuário minimizou ou mudou de aba -> Estado "idle"
                set(userStatusRef, {
                    state: 'idle',
                    last_changed: serverTimestamp(),
                });
            } else {
                // Voltou pra aba -> Estado "online"
                set(userStatusRef, isOnlineForDatabase);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]); // Re-executa se usuario mudar
}
