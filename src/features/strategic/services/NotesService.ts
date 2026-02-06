/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service para gerenciamento de notas.
 * 
 * Arquitetura Híbrida:
 * - Firestore: metadados (lista, título, timestamps, permissões)
 * - RTDB: conteúdo em tempo real (multiplayer)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/config/firebase';
import { useAuthStore } from '@/stores';
import { Note } from '../types';
import { NotesRealtimeService } from './NotesRealtimeService';

const COLLECTION_NAME = 'notes';

/**
 * Converte documento Firestore para Note (sem content - vem do RTDB)
 */
function mapDocToNote(docSnap: any): Note {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        title: data.title || 'Sem título',
        content: '', // Content agora vem do RTDB
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || '',
    };
}

export const NotesService = {
    /**
     * Subscribe to real-time notes list updates (metadata only)
     */
    subscribeToNotes(callback: (notes: Note[]) => void): () => void {
        const db = getFirestoreDb();

        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notes = snapshot.docs.map(mapDocToNote);
            callback(notes);
        }, (error) => {
            console.error('Error subscribing to notes:', error);
            callback([]);
        });

        return unsubscribe;
    },

    /**
     * Create a new note
     * - Cria metadados no Firestore
     * - Inicializa conteúdo no RTDB
     */
    async createNote(title: string = 'Nova Anotação'): Promise<string> {
        const db = getFirestoreDb();
        const user = useAuthStore.getState().user;

        const now = Timestamp.now();

        // 1. Criar metadados no Firestore
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            title,
            createdAt: now,
            updatedAt: now,
            createdBy: user?.id || 'anonymous',
        });

        // 2. Inicializar conteúdo no RTDB
        await NotesRealtimeService.initNoteContent(docRef.id, '');

        return docRef.id;
    },

    /**
     * Update note title (Firestore only)
     */
    async updateNoteTitle(noteId: string, title: string): Promise<void> {
        const db = getFirestoreDb();

        await updateDoc(doc(db, COLLECTION_NAME, noteId), {
            title,
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Update note content (RTDB) - delegates to RealtimeService
     */
    async updateNoteContent(noteId: string, content: string): Promise<void> {
        // Atualizar conteúdo no RTDB
        await NotesRealtimeService.updateContent(noteId, content);

        // Atualizar timestamp no Firestore para manter ordering
        const db = getFirestoreDb();
        await updateDoc(doc(db, COLLECTION_NAME, noteId), {
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Delete note
     * - Remove do Firestore
     * - Remove do RTDB
     */
    async deleteNote(noteId: string): Promise<void> {
        const db = getFirestoreDb();

        // 1. Deletar do RTDB
        await NotesRealtimeService.deleteNoteContent(noteId);

        // 2. Deletar do Firestore
        await deleteDoc(doc(db, COLLECTION_NAME, noteId));
    },

    /**
     * Migrate existing note content to RTDB
     * Chamado quando abre uma nota que ainda não tem content no RTDB
     */
    async ensureNoteInRTDB(noteId: string, fallbackContent: string = ''): Promise<void> {
        const exists = await NotesRealtimeService.noteExistsInRTDB(noteId);
        if (!exists) {
            await NotesRealtimeService.migrateContentToRTDB(noteId, fallbackContent);
        }
    },
};
