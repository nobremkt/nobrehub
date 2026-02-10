import { getFirestoreDb } from '@/config/firebase';
import { COLLECTIONS } from '@/config';
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
import { Lead } from '@/types/lead.types';

const COLLECTION_NAME = COLLECTIONS.LEADS;

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

                // Preserve existing linked projects and append new ones (avoid overwrite)
                if (Array.isArray(updates.projectIds) && updates.projectIds.length > 0) {
                    const existing = docSnap.data();
                    const existingProjectIds = Array.isArray(existing.projectIds) ? existing.projectIds : [];
                    dataToUpdate.projectIds = Array.from(new Set([...existingProjectIds, ...updates.projectIds]));
                }

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
     * Uses leadId as primary identifier, falls back to phone matching.
     * Updates existing leads instead of creating duplicates.
     */
    syncFromInbox: async (): Promise<number> => {
        try {
            const firestoreDb = getFirestoreDb();

            // 1. Get all conversations from Firestore
            const conversationsSnapshot = await getDocs(collection(firestoreDb, 'conversations'));

            if (conversationsSnapshot.empty) return 0;

            // 2. Get all existing leads - build lookup maps
            const leadsQuery = await getDocs(collection(firestoreDb, COLLECTION_NAME));

            const existingById = new Map<string, { id: string, data: any }>();
            const existingByPhone = new Map<string, { id: string, data: any }>();

            leadsQuery.docs.forEach(docSnap => {
                const data = docSnap.data();
                existingById.set(docSnap.id, { id: docSnap.id, data });
                if (data.phone) {
                    existingByPhone.set(data.phone.replace(/\D/g, ''), { id: docSnap.id, data });
                }
            });

            const processedPhones = new Set<string>();
            const dataPromises: Promise<any>[] = [];
            const now = new Date();
            let count = 0;

            // 3. Process each conversation
            for (const convDoc of conversationsSnapshot.docs) {
                const conv = convDoc.data();
                const convId = convDoc.id;

                if (!conv.leadPhone) continue;

                const normalizedPhone = conv.leadPhone.replace(/\D/g, '');
                const isWhatsApp = conv.channel === 'whatsapp' || conv.source === 'whatsapp';
                const correctPipeline = isWhatsApp ? 'low-ticket' : 'high-ticket';
                const correctStatus = isWhatsApp ? 'lt-entrada' : 'ht-novo';

                let existingLead: { id: string, data: any } | undefined;

                // Priority 1: Match by leadId
                if (conv.leadId && existingById.has(conv.leadId)) {
                    existingLead = existingById.get(conv.leadId);
                }
                // Priority 2: Match by phone
                else if (existingByPhone.has(normalizedPhone)) {
                    existingLead = existingByPhone.get(normalizedPhone);
                }

                if (existingLead) {
                    const updates: any = {
                        updatedAt: Timestamp.fromDate(now)
                    };

                    if (conv.leadName && conv.leadName !== existingLead.data.name) {
                        updates.name = conv.leadName;
                    }
                    if (conv.leadEmail && conv.leadEmail !== existingLead.data.email) {
                        updates.email = conv.leadEmail;
                    }
                    if (conv.leadCompany && conv.leadCompany !== existingLead.data.company) {
                        updates.company = conv.leadCompany;
                    }
                    if (conv.leadPhone && conv.leadPhone !== existingLead.data.phone) {
                        updates.phone = conv.leadPhone;
                    }

                    if (isWhatsApp && existingLead.data.pipeline === 'high-ticket' && existingLead.data.status === 'ht-novo') {
                        updates.pipeline = correctPipeline;
                        updates.status = correctStatus;
                    }

                    if (Object.keys(updates).length > 1) {
                        dataPromises.push(updateDoc(doc(firestoreDb, COLLECTION_NAME, existingLead.id), updates));
                        count++;
                    }

                    // If conversation doesn't have leadId, link it
                    if (!conv.leadId && existingLead) {
                        dataPromises.push(updateDoc(doc(firestoreDb, 'conversations', convId), {
                            leadId: existingLead.id
                        }));
                    }
                } else {
                    if (processedPhones.has(normalizedPhone)) continue;
                    processedPhones.add(normalizedPhone);

                    count++;

                    const createAndLink = async () => {
                        const newDocRef = await addDoc(collection(firestoreDb, COLLECTION_NAME), {
                            name: conv.leadName || normalizedPhone,
                            phone: conv.leadPhone,
                            email: conv.leadEmail || null,
                            company: conv.leadCompany || null,
                            pipeline: correctPipeline,
                            status: correctStatus,
                            order: 0,
                            estimatedValue: 0,
                            tags: ['Importado Inbox'],
                            responsibleId: 'admin',
                            createdAt: Timestamp.fromDate(now),
                            updatedAt: Timestamp.fromDate(now),
                        });

                        // Update conversation with new leadId in Firestore
                        await updateDoc(doc(firestoreDb, 'conversations', convId), {
                            leadId: newDocRef.id
                        });

                        existingById.set(newDocRef.id, { id: newDocRef.id, data: { phone: conv.leadPhone } });
                        existingByPhone.set(normalizedPhone, { id: newDocRef.id, data: { phone: conv.leadPhone } });
                    };

                    dataPromises.push(createAndLink());
                }
            }

            await Promise.all(dataPromises);
            return count;
        } catch (error) {
            console.error('Error syncing from inbox:', error);
            throw error;
        }
    },

    /**
     * Assign responsible (vendedora or pós-venda) to multiple leads.
     */
    bulkAssignResponsible: async (
        leadIds: string[],
        responsibleId: string,
        field: 'responsibleId' | 'postSalesId'
    ): Promise<void> => {
        try {
            const db = getFirestoreDb();
            const now = new Date();

            const updatePromises = leadIds.map(id =>
                updateDoc(doc(db, COLLECTION_NAME, id), {
                    [field]: responsibleId,
                    updatedAt: Timestamp.fromDate(now)
                })
            );

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error bulk assigning responsible:', error);
            throw error;
        }
    },

    /**
     * Move multiple leads to a new pipeline/stage.
     */
    bulkMoveStage: async (
        leadIds: string[],
        pipeline: 'high-ticket' | 'low-ticket',
        status: string
    ): Promise<void> => {
        try {
            const db = getFirestoreDb();
            const now = new Date();

            const updatePromises = leadIds.map(id =>
                updateDoc(doc(db, COLLECTION_NAME, id), {
                    pipeline,
                    status,
                    updatedAt: Timestamp.fromDate(now)
                })
            );

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error bulk moving stage:', error);
            throw error;
        }
    },

    /**
     * Mark multiple leads as lost.
     */
    bulkMarkAsLost: async (leadIds: string[], lossReasonId: string): Promise<void> => {
        try {
            const db = getFirestoreDb();
            const now = new Date();

            const updatePromises = leadIds.map(id =>
                updateDoc(doc(db, COLLECTION_NAME, id), {
                    lostReason: lossReasonId,
                    lostAt: Timestamp.fromDate(now),
                    updatedAt: Timestamp.fromDate(now)
                })
            );

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error bulk marking as lost:', error);
            throw error;
        }
    },

    /**
     * Delete multiple leads.
     */
    bulkDelete: async (leadIds: string[]): Promise<void> => {
        try {
            const db = getFirestoreDb();

            const deletePromises = leadIds.map(id =>
                deleteDoc(doc(db, COLLECTION_NAME, id))
            );

            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Error bulk deleting leads:', error);
            throw error;
        }
    }
};

