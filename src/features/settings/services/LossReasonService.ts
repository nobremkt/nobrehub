import { getFirestoreDb } from '@/config/firebase';
import {
    collection,
    doc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    addDoc,
    updateDoc
} from 'firebase/firestore';
import { LossReason } from '../types';

const COLLECTION_NAME = 'loss_reasons';

export const LossReasonService = {
    /**
     * Lista todos os motivos de perda
     */
    getLossReasons: async (): Promise<LossReason[]> => {
        const db = getFirestoreDb();
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as LossReason[];
    },

    /**
     * Cria um novo motivo
     */
    createLossReason: async (reason: Omit<LossReason, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const db = getFirestoreDb();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...reason,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        return docRef.id;
    },

    /**
     * Atualiza um motivo existente
     */
    updateLossReason: async (id: string, updates: Partial<Omit<LossReason, 'id' | 'createdAt'>>): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Date.now()
        });
    },

    /**
     * Remove um motivo
     */
    deleteLossReason: async (id: string): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
