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
import { Product } from '../types';

const COLLECTION_NAME = 'products';

export const ProductService = {
    /**
     * Lista todos os produtos
     */
    getProducts: async (): Promise<Product[]> => {
        const db = getFirestoreDb();
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Product[];
    },

    /**
     * Cria um novo produto
     */
    createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const db = getFirestoreDb();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...product,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        return docRef.id;
    },

    /**
     * Atualiza um produto existente
     */
    updateProduct: async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Date.now()
        });
    },

    /**
     * Remove (ou arquiva) um produto
     */
    deleteProduct: async (id: string): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
