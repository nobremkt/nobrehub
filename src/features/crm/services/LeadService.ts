import { getFirestoreDb, getRealtimeDb } from '@/config/firebase';
import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
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
     * Update or create a lead. If the lead doesn't exist, creates it with the provided data.
     * Used when transitioning from Inbox conversations (RTDB) to CRM leads (Firestore).
     */
    updateOrCreateLead: async (
        id: string,
        updates: Partial<Lead>,
        createData?: { name: string; phone?: string; email?: string }
    ): Promise<void> => {
        try {
            const db = getFirestoreDb();
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // Lead exists - just update it
                const dataToUpdate: any = { ...updates };
                dataToUpdate.updatedAt = Timestamp.fromDate(new Date());
                delete dataToUpdate.createdAt;
                await updateDoc(docRef, dataToUpdate);
            } else if (createData) {
                // Lead doesn't exist - create it with ID and initial data
                const now = new Date();
                await setDoc(docRef, {
                    name: createData.name,
                    phone: createData.phone || null,
                    email: createData.email || null,
                    company: null,
                    pipeline: 'low-ticket',
                    status: 'lt-entrada',
                    order: 0,
                    estimatedValue: 0,
                    tags: ['Pós-Venda'],
                    responsibleId: 'admin',
                    ...updates,
                    createdAt: Timestamp.fromDate(now),
                    updatedAt: Timestamp.fromDate(now),
                });
            } else {
                // No create data provided - skip silently
                console.warn('[LeadService] Lead not found and no createData provided:', id);
            }
        } catch (error) {
            console.error('Error in updateOrCreateLead:', error);
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
     * Remove tags from multiple leads.
     */
    bulkRemoveTags: async (leadIds: string[], tagsToRemove: string[], currentContacts: Lead[]): Promise<void> => {
        try {
            const db = getFirestoreDb();
            const tagsSet = new Set(tagsToRemove);

            console.log('[bulkRemoveTags] Starting removal:', {
                leadIds,
                tagsToRemove,
                contactsCount: currentContacts.length
            });

            const updatePromises = leadIds.map(id => {
                const contact = currentContacts.find(c => c.id === id);
                if (!contact) {
                    console.warn('[bulkRemoveTags] Contact not found:', id);
                    return Promise.resolve();
                }

                const oldTags = contact.tags || [];
                const newTags = oldTags.filter(t => !tagsSet.has(t));

                console.log('[bulkRemoveTags] Updating contact:', {
                    id,
                    oldTags,
                    newTags,
                    tagsRemoved: oldTags.length - newTags.length
                });

                return updateDoc(doc(db, COLLECTION_NAME, id), {
                    tags: newTags,
                    updatedAt: Timestamp.fromDate(new Date())
                });
            });

            await Promise.all(updatePromises);
            console.log('[bulkRemoveTags] Completed successfully');
        } catch (error) {
            console.error('Error bulk removing tags:', error);
            throw error;
        }
    },

    /**
     * Add a tag to multiple leads.
     */
    bulkAddTag: async (leadIds: string[], tagToAdd: string, currentContacts: Lead[]): Promise<void> => {
        try {
            const db = getFirestoreDb();

            const updatePromises = leadIds.map(id => {
                const contact = currentContacts.find(c => c.id === id);
                if (!contact) return Promise.resolve();

                const currentTags = contact.tags || [];
                if (currentTags.includes(tagToAdd)) return Promise.resolve(); // Already has tag

                return updateDoc(doc(db, COLLECTION_NAME, id), {
                    tags: [...currentTags, tagToAdd],
                    updatedAt: Timestamp.fromDate(new Date())
                });
            });

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error bulk adding tag:', error);
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
