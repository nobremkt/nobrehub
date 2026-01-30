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
import { Sector } from '../types';

const COLLECTION_NAME = 'sectors';

export const SectorService = {
    /**
     * Lista todos os setores
     */
    getSectors: async (): Promise<Sector[]> => {
        const db = getFirestoreDb();
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Sector[];
    },

    /**
     * Cria um novo setor
     */
    createSector: async (sector: Omit<Sector, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const db = getFirestoreDb();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...sector,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        return docRef.id;
    },

    /**
     * Atualiza um setor existente
     */
    updateSector: async (id: string, updates: Partial<Omit<Sector, 'id' | 'createdAt'>>): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Date.now()
        });
    },

    /**
     * Remove um setor
     */
    deleteSector: async (id: string): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
