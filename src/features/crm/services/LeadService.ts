import { getFirestoreDb, getRealtimeDb } from '@/config/firebase';
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
import { ref, get } from 'firebase/database';
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
    },

    /**
     * Sync leads from Inbox conversations.
     * Creates new leads for conversations that have a phone number but no corresponding lead in Firestore.
     */
    syncFromInbox: async (): Promise<number> => {
        try {
            const realtimeDb = getRealtimeDb();
            const firestoreDb = getFirestoreDb();

            // 1. Get all conversations
            const conversationsSnapshot = await get(ref(realtimeDb, 'conversations'));
            const conversationsData = conversationsSnapshot.val();

            if (!conversationsData) return 0;

            const conversations = Object.values(conversationsData) as any[];

            // 2. Get all existing leads (to check for duplicates and fix pipeline)
            const leadsQuery = await getDocs(collection(firestoreDb, COLLECTION_NAME));
            // Map phone -> { id, data }
            const existingCtx = new Map<string, { id: string, data: any }>();

            leadsQuery.docs.forEach(doc => {
                const data = doc.data();
                if (data.phone) {
                    // Normalize phone for comparison (remove non-digits)
                    existingCtx.set(data.phone.replace(/\D/g, ''), { id: doc.id, data });
                }
            });

            // 3. Filter candidates for sync or update
            const dataPromises: Promise<any>[] = [];
            const now = new Date();
            let count = 0;

            for (const conv of conversations) {
                if (!conv.leadPhone) continue;

                const normalizedPhone = conv.leadPhone.replace(/\D/g, '');
                const isWhatsApp = conv.channel === 'whatsapp' || conv.source === 'whatsapp';
                const correctPipeline = isWhatsApp ? 'low-ticket' : 'high-ticket';
                const correctStatus = isWhatsApp ? 'lt-entrada' : 'ht-novo';

                if (existingCtx.has(normalizedPhone)) {
                    // Lead exists - check if we need to fix the pipeline (Migration Fix)
                    const { id, data } = existingCtx.get(normalizedPhone)!;

                    // Only fix if it's currently in the default 'ht-novo' state and should be in Low Ticket
                    // This prevents moving leads that were manually worked on
                    if (isWhatsApp && data.pipeline === 'high-ticket' && data.status === 'ht-novo') {
                        dataPromises.push(updateDoc(doc(firestoreDb, COLLECTION_NAME, id), {
                            pipeline: correctPipeline,
                            status: correctStatus,
                            updatedAt: Timestamp.fromDate(now)
                        }));
                        count++;
                    }
                } else {
                    // Create new lead
                    // Mark as added to avoid duplicates in same run if multiple convs exist for same phone
                    existingCtx.set(normalizedPhone, { id: 'pending', data: {} });
                    count++;

                    dataPromises.push(addDoc(collection(firestoreDb, COLLECTION_NAME), {
                        name: conv.leadName || normalizedPhone,
                        phone: conv.leadPhone,
                        email: conv.leadEmail || null,
                        company: conv.leadCompany || null,
                        pipeline: correctPipeline,
                        status: correctStatus,
                        order: 0,
                        estimatedValue: 0,
                        tags: ['Importado Inbox'],
                        responsibleId: 'admin', // Default to admin for now
                        createdAt: Timestamp.fromDate(now),
                        updatedAt: Timestamp.fromDate(now),
                    }));
                }
            }

            // 4. Execute creations and updates
            await Promise.all(dataPromises);

            return count;
        } catch (error) {
            console.error('Error syncing from inbox:', error);
            throw error;
        }
    }
};
