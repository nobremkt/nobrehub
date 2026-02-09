/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES REALTIME SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service para edição colaborativa em tempo real usando Firebase Realtime Database.
 * 
 * Arquitetura:
 * - RTDB: conteúdo das notas (sync instantâneo, multiplayer)
 * - Firestore: metadados (lista, título, timestamps)
 * 
 * Estrutura RTDB:
 * /notes/{noteId}/content - string HTML do conteúdo
 * /notes/{noteId}/editors/{oderId} - presença de editores ativos
 * /notes/{noteId}/lastEdit - { userId, timestamp, cursorPosition }
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    ref,
    set,
    get,
    onValue,
    onDisconnect,
    update,
    remove,
    DataSnapshot,
} from 'firebase/database';
import { getRealtimeDb } from '@/config/firebase';
import { useAuthStore } from '@/stores';

// Types
export interface EditorPresence {
    oderId: string;
    displayName: string;
    photoURL?: string;
    lastSeen: number;
    cursorPosition?: number;
}

export interface NoteRealtimeData {
    content: string;
    lastEditBy: string;
    lastEditAt: number;
}

export interface ContentUpdate {
    content: string;
    version: number;
    timestamp: number;
    userId: string;
}

const NOTES_PATH = 'strategic/notes';

/**
 * NotesRealtimeService - Serviço para sincronização multiplayer
 */
export const NotesRealtimeService = {
    /**
     * Inicializa o conteúdo de uma nota no RTDB (chamado ao criar nota no Firestore)
     */
    async initNoteContent(noteId: string, content: string = ''): Promise<void> {
        const rtdb = getRealtimeDb();
        const user = useAuthStore.getState().user;

        const noteRef = ref(rtdb, `${NOTES_PATH}/${noteId}`);
        await set(noteRef, {
            content,
            version: 1,
            lastEditBy: user?.id || 'anonymous',
            lastEditAt: Date.now(),
            createdAt: Date.now(),
        });
    },

    /**
     * Subscribe ao conteúdo de uma nota em tempo real
     * Retorna unsubscribe function
     */
    subscribeToContent(
        noteId: string,
        callback: (data: NoteRealtimeData | null) => void
    ): () => void {
        const rtdb = getRealtimeDb();
        const contentRef = ref(rtdb, `${NOTES_PATH}/${noteId}`);

        const unsubscribe = onValue(contentRef, (snapshot: DataSnapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                callback({
                    content: data.content || '',
                    lastEditBy: data.lastEditBy || '',
                    lastEditAt: data.lastEditAt || Date.now(),
                });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Error subscribing to note content:', error);
            callback(null);
        });

        return unsubscribe;
    },

    /**
     * Atualiza conteúdo com merge otimista
     * Usa update() para operação atômica parcial
     */
    async updateContent(noteId: string, content: string): Promise<void> {
        const rtdb = getRealtimeDb();
        const user = useAuthStore.getState().user;

        const noteRef = ref(rtdb, `${NOTES_PATH}/${noteId}`);

        // Atualização atômica - apenas os campos especificados
        await update(noteRef, {
            content,
            lastEditBy: user?.id || 'anonymous',
            lastEditAt: Date.now(),
        });
    },

    /**
     * Marca presença do editor na nota
     * Configura auto-cleanup quando desconectar
     */
    async joinAsEditor(noteId: string): Promise<() => void> {
        const rtdb = getRealtimeDb();
        const user = useAuthStore.getState().user;
        if (!user) return () => { };

        const editorRef = ref(rtdb, `${NOTES_PATH}/${noteId}/editors/${user.id}`);

        // Define presença
        await set(editorRef, {
            oderId: user.id,
            displayName: user.name || user.email || 'Anônimo',
            photoURL: user.profilePhotoUrl || null,
            lastSeen: Date.now(),
        });

        // Auto-remove ao desconectar
        onDisconnect(editorRef).remove();

        // Retorna função para sair manualmente
        return async () => {
            await remove(editorRef);
        };
    },

    /**
     * Atualiza heartbeat de presença
     */
    async updatePresence(noteId: string): Promise<void> {
        const rtdb = getRealtimeDb();
        const user = useAuthStore.getState().user;
        if (!user) return;

        const editorRef = ref(rtdb, `${NOTES_PATH}/${noteId}/editors/${user.id}`);
        await update(editorRef, {
            lastSeen: Date.now(),
        });
    },

    /**
     * Subscribe aos editores ativos de uma nota
     */
    subscribeToEditors(
        noteId: string,
        callback: (editors: EditorPresence[]) => void
    ): () => void {
        const rtdb = getRealtimeDb();
        const editorsRef = ref(rtdb, `${NOTES_PATH}/${noteId}/editors`);

        const unsubscribe = onValue(editorsRef, (snapshot: DataSnapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const editors = Object.values(data || {}) as EditorPresence[];

                // Filtrar editores inativos (mais de 30 segundos sem heartbeat)
                const activeEditors = editors.filter(
                    e => Date.now() - e.lastSeen < 30000
                );

                callback(activeEditors);
            } else {
                callback([]);
            }
        });

        return unsubscribe;
    },

    /**
     * Deleta o conteúdo de uma nota do RTDB
     */
    async deleteNoteContent(noteId: string): Promise<void> {
        const rtdb = getRealtimeDb();
        const noteRef = ref(rtdb, `${NOTES_PATH}/${noteId}`);
        await remove(noteRef);
    },

    /**
     * Migra conteúdo do Firestore para RTDB (uma única vez)
     * Útil para notes existentes
     */
    async migrateContentToRTDB(noteId: string, content: string): Promise<void> {
        const rtdb = getRealtimeDb();
        const noteRef = ref(rtdb, `${NOTES_PATH}/${noteId}`);

        // Verifica se já existe no RTDB
        const snapshot = await get(noteRef);
        if (!snapshot.exists()) {
            await this.initNoteContent(noteId, content);
        }
    },

    /**
     * Verifica se nota existe no RTDB
     */
    async noteExistsInRTDB(noteId: string): Promise<boolean> {
        const rtdb = getRealtimeDb();
        const noteRef = ref(rtdb, `${NOTES_PATH}/${noteId}`);
        const snapshot = await get(noteRef);
        return snapshot.exists();
    },

    /**
     * Busca conteúdo atual (one-time read)
     */
    async getContent(noteId: string): Promise<string | null> {
        const rtdb = getRealtimeDb();
        const noteRef = ref(rtdb, `${NOTES_PATH}/${noteId}`);
        const snapshot = await get(noteRef);

        if (snapshot.exists()) {
            return snapshot.val().content || '';
        }
        return null;
    },
};
