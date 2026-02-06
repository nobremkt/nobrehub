/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - SOCIAL MEDIA SERVICE
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
import { SocialMediaClient, SocialMediaPost, SocialMediaClientFormData, PostStatus } from '../types/socialMedia';

const COLLECTION_NAME = 'social_media_clients';
const POSTS_SUBCOLLECTION = 'posts';

const mapDocToClient = (docSnap: { id: string; data: () => Record<string, unknown> }): SocialMediaClient => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        clientName: (data.clientName as string) || '',
        contact: (data.contact as string) || '',
        companyName: (data.companyName as string) || '',
        instagramUsername: (data.instagramUsername as string) || undefined,
        instagramUrl: (data.instagramUrl as string) || undefined,
        paymentDate: (data.paymentDate as { toDate: () => Date })?.toDate() || null,
        planDuration: (data.planDuration as number) || 1,
        planType: (data.planType as SocialMediaClient['planType']) || 'outro',
        postStartDate: (data.postStartDate as { toDate: () => Date })?.toDate() || new Date(),
        contractEndDate: (data.contractEndDate as { toDate: () => Date })?.toDate() || new Date(),
        value: (data.value as number) || null,
        status: (data.status as SocialMediaClient['status']) || 'active',
        createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
        updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
    };
};

const mapDocToPost = (docSnap: { id: string; data: () => Record<string, unknown> }, clientId: string): SocialMediaPost => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        clientId,
        scheduledDate: (data.scheduledDate as { toDate: () => Date })?.toDate() || new Date(),
        status: (data.status as PostStatus) || 'pending',
        notes: (data.notes as string) || '',
        createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    };
};

export const SocialMediaService = {
    /**
     * Subscribe to all clients
     */
    subscribeToClients(callback: (clients: SocialMediaClient[]) => void): () => void {
        const db = getFirestoreDb();
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('clientName', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            const clients = snapshot.docs.map(docSnap => mapDocToClient(docSnap));
            callback(clients);
        });
    },

    /**
     * Create a new client
     */
    async createClient(data: SocialMediaClientFormData): Promise<string> {
        const db = getFirestoreDb();
        const now = Timestamp.now();

        // Filter out undefined values (Firebase doesn't accept undefined)
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined)
        );

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...cleanData,
            paymentDate: data.paymentDate ? Timestamp.fromDate(data.paymentDate) : null,
            postStartDate: Timestamp.fromDate(data.postStartDate),
            contractEndDate: data.contractEndDate ? Timestamp.fromDate(data.contractEndDate) : null,
            status: 'active',
            createdAt: now,
            updatedAt: now,
        });
        return docRef.id;
    },

    /**
     * Update a client
     */
    async updateClient(clientId: string, data: Partial<SocialMediaClientFormData & { status: 'active' | 'inactive' }>): Promise<void> {
        const db = getFirestoreDb();

        // Filter out undefined values (Firebase doesn't accept undefined)
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined)
        );

        const updateData: Record<string, unknown> = { ...cleanData, updatedAt: Timestamp.now() };

        if (data.paymentDate !== undefined) {
            updateData.paymentDate = data.paymentDate ? Timestamp.fromDate(data.paymentDate) : null;
        }
        if (data.postStartDate) {
            updateData.postStartDate = Timestamp.fromDate(data.postStartDate);
        }
        if (data.contractEndDate) {
            updateData.contractEndDate = Timestamp.fromDate(data.contractEndDate);
        }

        await updateDoc(doc(db, COLLECTION_NAME, clientId), updateData);
    },

    /**
     * Delete a client
     */
    async deleteClient(clientId: string): Promise<void> {
        const db = getFirestoreDb();
        await deleteDoc(doc(db, COLLECTION_NAME, clientId));
    },

    /**
     * Subscribe to posts for a specific client
     */
    subscribeToClientPosts(clientId: string, callback: (posts: SocialMediaPost[]) => void): () => void {
        const db = getFirestoreDb();
        const q = query(
            collection(db, COLLECTION_NAME, clientId, POSTS_SUBCOLLECTION),
            orderBy('scheduledDate', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(docSnap => mapDocToPost(docSnap, clientId));
            callback(posts);
        });
    },

    /**
     * Create a post for a client
     */
    async createPost(clientId: string, scheduledDate: Date, notes?: string): Promise<string> {
        const db = getFirestoreDb();
        const docRef = await addDoc(
            collection(db, COLLECTION_NAME, clientId, POSTS_SUBCOLLECTION),
            {
                scheduledDate: Timestamp.fromDate(scheduledDate),
                status: 'pending',
                notes: notes || '',
                createdAt: Timestamp.now(),
            }
        );
        return docRef.id;
    },

    /**
     * Update post status
     */
    async updatePost(clientId: string, postId: string, data: { status?: PostStatus; notes?: string }): Promise<void> {
        const db = getFirestoreDb();
        await updateDoc(
            doc(db, COLLECTION_NAME, clientId, POSTS_SUBCOLLECTION, postId),
            data
        );
    },

    /**
     * Delete a post
     */
    async deletePost(clientId: string, postId: string): Promise<void> {
        const db = getFirestoreDb();
        await deleteDoc(doc(db, COLLECTION_NAME, clientId, POSTS_SUBCOLLECTION, postId));
    },
};
