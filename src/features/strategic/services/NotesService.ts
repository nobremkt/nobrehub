/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service para gerenciamento de notas no Firestore.
 * Realtime sync com auto-save.
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

const COLLECTION_NAME = 'notes';

/**
 * Converte documento Firestore para Note
 */
function mapDocToNote(docSnap: any): Note {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        title: data.title || 'Sem título',
        content: data.content || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || '',
    };
}

export const NotesService = {
    /**
     * Subscribe to real-time notes updates
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
     * Subscribe to real-time updates for a single note
     * Used for collaborative editing
     */
    subscribeToNote(noteId: string, callback: (note: Note | null) => void): () => void {
        const db = getFirestoreDb();

        const unsubscribe = onSnapshot(
            doc(db, COLLECTION_NAME, noteId),
            (docSnap) => {
                if (docSnap.exists()) {
                    callback(mapDocToNote(docSnap));
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error('Error subscribing to note:', error);
                callback(null);
            }
        );

        return unsubscribe;
    },

    /**
     * Create a new note
     */
    async createNote(title: string = 'Nova Anotação'): Promise<string> {
        const db = getFirestoreDb();
        const user = useAuthStore.getState().user;

        const now = Timestamp.now();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            title,
            content: '',
            createdAt: now,
            updatedAt: now,
            createdBy: user?.id || 'anonymous',
        });

        return docRef.id;
    },

    /**
     * Update note (for auto-save)
     */
    async updateNote(noteId: string, data: Partial<Pick<Note, 'title' | 'content'>>): Promise<void> {
        const db = getFirestoreDb();

        await updateDoc(doc(db, COLLECTION_NAME, noteId), {
            ...data,
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Delete note
     */
    async deleteNote(noteId: string): Promise<void> {
        const db = getFirestoreDb();
        await deleteDoc(doc(db, COLLECTION_NAME, noteId));
    },
};
