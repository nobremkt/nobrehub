import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { get, ref, update as updateRealtime } from 'firebase/database';
import { db, getRealtimeDb } from '@/config/firebase';
import { COLLECTIONS } from '@/config';
import { Lead, ClientStatus } from '@/types/lead.types';
import { Project } from '@/types/project.types';
import { ProjectStatusPageService } from '@/features/production/services/ProjectStatusPageService';

const LEADS_COLLECTION = COLLECTIONS.LEADS;
const PROJECTS_COLLECTION = COLLECTIONS.PRODUCTION_PROJECTS;

interface PostSalesWorkload {
    postSalesId: string;
    postSalesName: string;
    activeClients: number;
}

interface DistributionClient extends Lead {
    previousAttendant?: string;
}

const ACTIVE_CLIENT_STATUSES: ClientStatus[] = [
    'aguardando_projeto',
    'aguardando_alteracao',
    'entregue',
    'aguardando_pagamento'
];

const getLeadClientStatusFromProjects = (projects: Project[]): ClientStatus => {
    if (projects.length === 0) return 'aguardando_projeto';

    const hasAlteration = projects.some(
        project => project.status === 'alteracao' || project.status === 'alteracao_interna' || project.status === 'alteracao_cliente' || project.clientApprovalStatus === 'changes_requested'
    );
    if (hasAlteration) return 'aguardando_alteracao';

    const hasPendingPayment = projects.some(
        project => project.clientApprovalStatus === 'approved' && project.paymentStatus !== 'paid'
    );
    if (hasPendingPayment) return 'aguardando_pagamento';

    const hasDeliveredAwaitingApproval = projects.some(
        project => project.status === 'entregue' && project.clientApprovalStatus !== 'approved'
    );
    if (hasDeliveredAwaitingApproval) return 'entregue';

    return 'aguardando_projeto';
};

const mapLeadDoc = (docSnap: any): DistributionClient => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        dealClosedAt: data.dealClosedAt instanceof Timestamp ? data.dealClosedAt.toDate() : undefined,
        previousAttendant: data.previousPostSalesIds?.length > 0
            ? data.previousPostSalesIds[data.previousPostSalesIds.length - 1]
            : undefined
    } as DistributionClient;
};

const mapProjectDoc = (docSnap: any): Project => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        assignedAt: data.assignedAt instanceof Timestamp ? data.assignedAt.toDate() : undefined,
        postSalesAssignedAt: data.postSalesAssignedAt instanceof Timestamp ? data.postSalesAssignedAt.toDate() : undefined,
        deliveredToClientAt: data.deliveredToClientAt instanceof Timestamp ? data.deliveredToClientAt.toDate() : undefined,
        clientApprovedAt: data.clientApprovedAt instanceof Timestamp ? data.clientApprovedAt.toDate() : undefined,
        paymentReceivedAt: data.paymentReceivedAt instanceof Timestamp ? data.paymentReceivedAt.toDate() : undefined,
        lastRevisionRequestedAt: data.lastRevisionRequestedAt instanceof Timestamp ? data.lastRevisionRequestedAt.toDate() : undefined,
    } as Project;
};

export const PostSalesDistributionService = {
    getDistributionQueue: async (): Promise<DistributionClient[]> => {
        try {
            const leadsRef = collection(db, LEADS_COLLECTION);
            const q = query(
                leadsRef,
                where('postSalesDistributionStatus', '==', 'pending'),
                where('currentSector', '==', 'distribution'),
                orderBy('dealClosedAt', 'asc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(mapLeadDoc);
        } catch (error) {
            console.error('Error fetching post-sales distribution queue:', error);
            throw error;
        }
    },

    subscribeToDistributionQueue: (callback: (clients: DistributionClient[]) => void) => {
        const leadsRef = collection(db, LEADS_COLLECTION);
        const q = query(
            leadsRef,
            where('postSalesDistributionStatus', '==', 'pending'),
            where('currentSector', '==', 'distribution'),
            orderBy('dealClosedAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(mapLeadDoc));
        }, (error) => {
            console.error('Error listening to post-sales distribution queue:', error);
        });
    },

    calculatePostSalesWorkload: async (postSalesId: string): Promise<PostSalesWorkload> => {
        try {
            const leadsRef = collection(db, LEADS_COLLECTION);
            const q = query(
                leadsRef,
                where('postSalesId', '==', postSalesId),
                where('clientStatus', 'in', ACTIVE_CLIENT_STATUSES)
            );

            const snapshot = await getDocs(q);
            return {
                postSalesId,
                postSalesName: '',
                activeClients: snapshot.size
            };
        } catch (error) {
            console.error('Error calculating post-sales workload:', error);
            throw error;
        }
    },

    getAllPostSalesWorkload: async (postSalesIds: string[]): Promise<PostSalesWorkload[]> => {
        return Promise.all(
            postSalesIds.map(id => PostSalesDistributionService.calculatePostSalesWorkload(id))
        );
    },

    syncConversationAssignment: async (leadId: string, postSalesId: string): Promise<void> => {
        try {
            const realtimeDb = getRealtimeDb();
            const conversationsRef = ref(realtimeDb, 'conversations');
            const snapshot = await get(conversationsRef);

            if (!snapshot.exists()) return;

            const data = snapshot.val() as Record<string, any>;
            const conversationId = Object.keys(data).find(id => data[id]?.leadId === leadId);
            if (!conversationId) return;

            await updateRealtime(ref(realtimeDb, `conversations/${conversationId}`), {
                assignedTo: postSalesId,
                postSalesId,
                context: 'post_sales',
                status: 'open',
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error('Error syncing post-sales conversation assignment:', error);
        }
    },

    assignToPostSales: async (
        leadId: string,
        postSalesId: string,
        _postSalesName: string
    ): Promise<void> => {
        try {
            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            const leadSnapshot = await getDoc(leadRef);
            const previousPostSalesId = leadSnapshot.exists() ? leadSnapshot.data().postSalesId : undefined;

            const updates: Record<string, unknown> = {
                postSalesId,
                postSalesDistributionStatus: 'assigned',
                postSalesAssignedAt: new Date(),
                currentSector: 'pos_vendas',
                clientStatus: 'aguardando_projeto' as ClientStatus,
                updatedAt: new Date()
            };

            if (previousPostSalesId && previousPostSalesId !== postSalesId) {
                updates.previousPostSalesIds = arrayUnion(previousPostSalesId);
            }

            await updateDoc(leadRef, updates);
            await PostSalesDistributionService.syncConversationAssignment(leadId, postSalesId);
        } catch (error) {
            console.error('Error assigning client to post-sales:', error);
            throw error;
        }
    },

    autoAssignClient: async (
        leadId: string,
        postSalesIds: string[]
    ): Promise<{ postSalesId: string; postSalesName: string } | null> => {
        try {
            if (postSalesIds.length === 0) return null;

            const workloads = await PostSalesDistributionService.getAllPostSalesWorkload(postSalesIds);
            workloads.sort((a, b) => a.activeClients - b.activeClients);

            const selected = workloads[0];
            if (!selected) return null;

            await PostSalesDistributionService.assignToPostSales(
                leadId,
                selected.postSalesId,
                selected.postSalesName
            );

            return {
                postSalesId: selected.postSalesId,
                postSalesName: selected.postSalesName
            };
        } catch (error) {
            console.error('Error auto-assigning client:', error);
            throw error;
        }
    },

    autoAssignAllPending: async (postSalesIds: string[]): Promise<number> => {
        try {
            const queue = await PostSalesDistributionService.getDistributionQueue();
            let assigned = 0;

            for (const client of queue) {
                const result = await PostSalesDistributionService.autoAssignClient(client.id, postSalesIds);
                if (result) assigned++;
            }

            return assigned;
        } catch (error) {
            console.error('Error auto-assigning all clients:', error);
            throw error;
        }
    },

    updateClientStatus: async (leadId: string, status: ClientStatus): Promise<void> => {
        try {
            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            await updateDoc(leadRef, {
                clientStatus: status,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating client status:', error);
            throw error;
        }
    },

    getProjectsByLeadId: async (leadId: string): Promise<Project[]> => {
        try {
            const projectsRef = collection(db, PROJECTS_COLLECTION);
            const q = query(
                projectsRef,
                where('leadId', '==', leadId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(mapProjectDoc);
        } catch (error) {
            console.error('Error fetching projects by leadId:', error);
            return [];
        }
    },

    syncLeadStatusFromProjects: async (leadId: string): Promise<void> => {
        const projects = await PostSalesDistributionService.getProjectsByLeadId(leadId);
        if (projects.length === 0) return;

        const allConcluded = projects.every(
            project => project.status === 'concluido' || project.paymentStatus === 'paid'
        );

        const leadRef = doc(db, LEADS_COLLECTION, leadId);

        if (allConcluded) {
            await updateDoc(leadRef, {
                clientStatus: 'concluido' as ClientStatus,
                currentSector: 'vendas',
                postSalesDistributionStatus: null,
                completedAt: new Date(),
                updatedAt: new Date(),
                tags: arrayUnion('cliente')
            });
            return;
        }

        await updateDoc(leadRef, {
            clientStatus: getLeadClientStatusFromProjects(projects),
            currentSector: 'pos_vendas',
            postSalesDistributionStatus: 'assigned',
            updatedAt: new Date()
        });
    },

    markProjectAsDelivered: async (
        leadId: string,
        projectId: string,
        deliveredByPostSalesId?: string
    ): Promise<void> => {
        try {
            const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
            await updateDoc(projectRef, {
                status: 'entregue',
                clientApprovalStatus: 'pending',
                deliveredToClientAt: new Date(),
                deliveredToClientBy: deliveredByPostSalesId || '',
                updatedAt: new Date()
            });
            await ProjectStatusPageService.syncFromProjectId(projectId);

            await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
        } catch (error) {
            console.error('Error marking project as delivered:', error);
            throw error;
        }
    },

    completeClient: async (leadId: string, projectId?: string, paymentReceivedBy?: string): Promise<void> => {
        try {
            if (projectId) {
                const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
                await updateDoc(projectRef, {
                    paymentStatus: 'paid',
                    paymentReceivedAt: new Date(),
                    paymentReceivedBy: paymentReceivedBy || '',
                    status: 'concluido',
                    updatedAt: new Date()
                });
                await ProjectStatusPageService.syncFromProjectId(projectId);

                await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
                return;
            }

            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            await updateDoc(leadRef, {
                clientStatus: 'concluido' as ClientStatus,
                currentSector: 'vendas',
                postSalesDistributionStatus: null,
                completedAt: new Date(),
                updatedAt: new Date(),
                tags: arrayUnion('cliente')
            });
        } catch (error) {
            console.error('Error completing client:', error);
            throw error;
        }
    },

    getClientsByAttendant: async (postSalesId: string): Promise<Lead[]> => {
        try {
            const leadsRef = collection(db, LEADS_COLLECTION);
            const q = query(
                leadsRef,
                where('postSalesId', '==', postSalesId),
                where('clientStatus', 'in', [...ACTIVE_CLIENT_STATUSES, 'concluido']),
                orderBy('updatedAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    dealClosedAt: data.dealClosedAt instanceof Timestamp ? data.dealClosedAt.toDate() : undefined
                } as Lead;
            });
        } catch (error) {
            console.error('Error fetching clients by attendant:', error);
            throw error;
        }
    },

    subscribeToClientsByAttendant: (postSalesId: string, callback: (clients: Lead[]) => void) => {
        const leadsRef = collection(db, LEADS_COLLECTION);
        const q = query(
            leadsRef,
            where('postSalesId', '==', postSalesId),
            where('clientStatus', 'in', [...ACTIVE_CLIENT_STATUSES, 'concluido']),
            orderBy('updatedAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const clients = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    dealClosedAt: data.dealClosedAt instanceof Timestamp ? data.dealClosedAt.toDate() : undefined
                } as Lead;
            });
            callback(clients);
        }, (error) => {
            console.error('Error in clients subscription:', error);
        });
    },

    requestRevision: async (leadId: string, projectId: string, reason?: string): Promise<void> => {
        try {
            if (!projectId) {
                throw new Error('Project ID is required to request revision');
            }

            // Atualiza o lead
            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            await updateDoc(leadRef, {
                clientStatus: 'aguardando_alteracao' as ClientStatus,
                lastRevisionRequestedAt: new Date(),
                updatedAt: new Date()
            });

            // Atualiza o projeto (status de alteração, NÃO muda producerId)
            const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists()) {
                throw new Error(`Project not found: ${projectId}`);
            }

            const projectData = projectSnap.data();
            const currentClientRevisionCount = Number(projectData?.clientRevisionCount || 0);
            const currentRevisionCount = Number(projectData?.revisionCount || 0);

            await updateDoc(projectRef, {
                status: 'alteracao_cliente',
                revisionCount: currentRevisionCount + 1,
                clientRevisionCount: currentClientRevisionCount + 1,
                revisionHistory: arrayUnion({
                    type: 'client',
                    reason: reason || '',
                    requestedBy: 'post-sales',
                    requestedByName: 'Pós-Vendas',
                    requestedAt: new Date()
                }),
                lastRevisionRequestedAt: new Date(),
                clientApprovalStatus: 'changes_requested',
                updatedAt: new Date()
            });
            await ProjectStatusPageService.syncFromProjectId(projectId);

            await PostSalesDistributionService.updateClientStatus(leadId, 'aguardando_alteracao');
        } catch (error) {
            console.error('Error requesting revision:', error);
            throw error;
        }
    },

    approveClient: async (leadId: string, projectId?: string): Promise<void> => {
        try {
            if (!projectId) {
                throw new Error('Project ID is required to approve client');
            }

            // Atualiza o lead
            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            await updateDoc(leadRef, {
                clientStatus: 'aguardando_pagamento' as ClientStatus,
                clientApprovedAt: new Date(),
                updatedAt: new Date()
            });

            // Atualiza o projeto
            const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
            await updateDoc(projectRef, {
                clientApprovalStatus: 'approved',
                clientApprovedAt: new Date(),
                updatedAt: new Date()
            });
            await ProjectStatusPageService.syncFromProjectId(projectId);

            await PostSalesDistributionService.syncLeadStatusFromProjects(leadId);
        } catch (error) {
            console.error('Error approving client:', error);
            throw error;
        }
    }
};
