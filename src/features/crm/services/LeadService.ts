import { getFirestoreDb } from '@/config/firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { Lead } from '@/types/lead.types';

const COLLECTION_NAME = 'leads';

export const LeadService = {
    /**
     * Fetch all leads.
     */
    getLeads: async (): Promise<Lead[]> => {
        try {
            const db = getFirestoreDb();
            const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Handle Firestore timestamps converting to JS Dates
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    lostAt: data.lostAt instanceof Timestamp ? data.lostAt.toDate() : data.lostAt ? new Date(data.lostAt) : undefined,
                } as Lead;
            });
        } catch (error) {
            console.error('Error fetching leads:', error);
            throw error;
        }
    },

    /**
     * Create a new lead.
     */
    createLead: async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
        try {
            const db = getFirestoreDb();
            const now = new Date();

            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...lead,
                createdAt: Timestamp.fromDate(now),
                updatedAt: Timestamp.fromDate(now),
            });

            return {
                id: docRef.id,
                ...lead,
                createdAt: now,
                updatedAt: now,
            };
        } catch (error) {
            console.error('Error creating lead:', error);
            throw error;
        }
    },

    /**
     * Update an existing lead.
     */
    updateLead: async (id: string, updates: Partial<Lead>): Promise<void> => {
        try {
            const db = getFirestoreDb();
            const docRef = doc(db, COLLECTION_NAME, id);

            const dataToUpdate: any = { ...updates };
            // Update timestamp
            dataToUpdate.updatedAt = Timestamp.fromDate(new Date());

            // Clean up undefined fields
            if (updates.createdAt) delete dataToUpdate.createdAt; // Should not update creation date

            await updateDoc(docRef, dataToUpdate);
        } catch (error) {
            console.error('Error updating lead:', error);
            throw error;
        }
    },

    /**
     * Delete a lead.
     */
    deleteLead: async (id: string): Promise<void> => {
        try {
            const db = getFirestoreDb();
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error('Error deleting lead:', error);
            throw error;
        }
    }
};
