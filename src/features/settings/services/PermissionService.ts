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
import { Permission } from '../types';

const COLLECTION_NAME = 'permissions';

export const PermissionService = {
    /**
     * Lista todas as permissões
     */
    getPermissions: async (): Promise<Permission[]> => {
        const db = getFirestoreDb();
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Permission[];
    },

    /**
     * Cria uma nova permissão
     */
    createPermission: async (permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const db = getFirestoreDb();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...permission,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        return docRef.id;
    },

    /**
     * Atualiza uma permissão existente
     */
    updatePermission: async (id: string, updates: Partial<Omit<Permission, 'id' | 'createdAt'>>): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Date.now()
        });
    },

    /**
     * Remove uma permissão
     */
    deletePermission: async (id: string): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
