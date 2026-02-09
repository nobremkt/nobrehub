
import {
    collection,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config';
import { Project } from '@/types/project.types';
import { ProjectStatusPageService } from './ProjectStatusPageService';

const COLLECTION_NAME = COLLECTIONS.PRODUCTION_PROJECTS;

const mapProjectDoc = (docSnap: any): Project => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        deliveredAt: data.deliveredAt instanceof Timestamp ? data.deliveredAt.toDate() : undefined,
        assignedAt: data.assignedAt instanceof Timestamp ? data.assignedAt.toDate() : undefined,
        postSalesAssignedAt: data.postSalesAssignedAt instanceof Timestamp ? data.postSalesAssignedAt.toDate() : undefined,
        deliveredToClientAt: data.deliveredToClientAt instanceof Timestamp ? data.deliveredToClientAt.toDate() : undefined,
        clientApprovedAt: data.clientApprovedAt instanceof Timestamp ? data.clientApprovedAt.toDate() : undefined,
        paymentReceivedAt: data.paymentReceivedAt instanceof Timestamp ? data.paymentReceivedAt.toDate() : undefined,
        lastRevisionRequestedAt: data.lastRevisionRequestedAt instanceof Timestamp ? data.lastRevisionRequestedAt.toDate() : undefined,
    } as Project;
};

export const ProductionService = {
    /**
     * Busca projetos de um produtor específico
     */
    getProjectsByProducer: async (producerId: string): Promise<Project[]> => {
        try {
            const projectsRef = collection(db, COLLECTION_NAME);
            const q = query(
                projectsRef,
                where('producerId', '==', producerId),
                orderBy('dueDate', 'asc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(mapProjectDoc);
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    },

    /**
     * Busca projetos globalmente (pelo nome)
     */
    searchAllProjects: async (term: string): Promise<Project[]> => {
        try {
            // Firestore doesn't support full-text search natively.
            // We use 'startAt' simulation for prefix search or just fetch active projects and filter (if small).
            // For now, we will fetch recent projects and filter for better UX (ignoring huge scale for MVP).
            // A better production approach is using a dedicated index or 'name' >= term query.

            const projectsRef = collection(db, COLLECTION_NAME);
            // Limit to last 100 or so for performance if no index, but let's try prefix query first.
            // Note: Case sensitivity is an issue in Firestore.

            // Simple approach: Get all active projects (not finished long ago) and filter in JS.
            // This is safer for UX (case insensitive, partial match) until dataset > 1000.

            const q = query(projectsRef,
                orderBy('updatedAt', 'desc'), // Get most recent
                // limit(500) // Optional limit
            );

            const snapshot = await getDocs(q);
            const allProjects = snapshot.docs.map(mapProjectDoc);

            const lowerTerm = term.toLowerCase();
            return allProjects.filter(p =>
                p.name.toLowerCase().includes(lowerTerm) ||
                p.leadName.toLowerCase().includes(lowerTerm)
            ).slice(0, 10); // Limit results

        } catch (error) {
            console.error('Error searching projects:', error);
            return [];
        }
    },

    /**
     * Cria um novo projeto
     */
    createProject: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const projectsRef = collection(db, COLLECTION_NAME);
            const projectDocRef = doc(projectsRef);
            const projectId = projectDocRef.id;

            const statusPageToken = project.statusPageToken || ProjectStatusPageService.generateToken();
            const statusPageUrl = project.statusPageUrl || ProjectStatusPageService.buildStatusPageUrl(statusPageToken);

            const batch = writeBatch(db);

            batch.set(projectDocRef, {
                ...project,
                statusPageToken,
                statusPageUrl,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            const publicPayload = {
                id: projectId,
                name: project.name,
                leadName: project.leadName,
                producerName: project.producerName,
                status: project.status,
                dueDate: project.dueDate,
                deliveredToClientAt: project.deliveredToClientAt,
                statusPageToken,
                statusPageUrl
            };

            const statusDocRef = doc(db, 'project_status_pages', statusPageToken);
            batch.set(statusDocRef, {
                token: statusPageToken,
                projectId,
                statusPageUrl,
                projectName: publicPayload.name,
                leadName: publicPayload.leadName,
                producerName: publicPayload.producerName || '',
                status: publicPayload.status,
                dueDate: publicPayload.dueDate || null,
                deliveredToClientAt: publicPayload.deliveredToClientAt || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await batch.commit();
            return projectId;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    /**
     * Atualiza um projeto existente
     */
    updateProject: async (id: string, updates: Partial<Project>) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            await ProjectStatusPageService.syncFromProjectId(id);
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    },

    /**
     * Exclui um projeto
     */
    deleteProject: async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    },

    /**
     * Inscreve-se para atualizações em tempo real dos projetos de um produtor
     */
    subscribeProjectsByProducer: (producerId: string, callback: (projects: Project[]) => void) => {
        const projectsRef = collection(db, COLLECTION_NAME);
        const q = query(
            projectsRef,
            where('producerId', '==', producerId),
            orderBy('dueDate', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(mapProjectDoc);
            callback(projects);
        }, (error) => {
            console.error('Error listening to projects:', error);
        });
    },

    /**
     * Busca todos os projetos vinculados a um lead
     * Ordena por criação (mais recente primeiro)
     */
    getProjectsByLeadId: async (leadId: string): Promise<Project[]> => {
        try {
            const projectsRef = collection(db, COLLECTION_NAME);
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

    /**
     * Busca projeto vinculado a um lead específico
     * Retorna o projeto mais recente se houver múltiplos
     */
    getProjectByLeadId: async (leadId: string): Promise<Project | null> => {
        const projects = await ProductionService.getProjectsByLeadId(leadId);
        return projects[0] || null;
    },

    /**
     * Inscreve-se para atualizações em tempo real de todos os projetos vinculados a um lead
     */
    subscribeToProjectsByLeadId: (leadId: string, callback: (projects: Project[]) => void) => {
        const projectsRef = collection(db, COLLECTION_NAME);
        const q = query(
            projectsRef,
            where('leadId', '==', leadId),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(mapProjectDoc));
        }, (error) => {
            console.error('Error listening to projects by leadId:', error);
        });
    },

    /**
     * Inscreve-se para atualizações em tempo real do projeto vinculado a um lead
     */
    subscribeToProjectByLeadId: (leadId: string, callback: (project: Project | null) => void) => {
        return ProductionService.subscribeToProjectsByLeadId(leadId, (projects) => {
            callback(projects[0] || null);
        });
    },

    /**
     * Sincroniza os dados públicos da página de status de um projeto.
     */
    syncPublicStatusPage: async (projectId: string) => {
        await ProjectStatusPageService.syncFromProjectId(projectId);
    },

    /**
     * Busca um projeto por ID.
     */
    getProjectById: async (projectId: string): Promise<Project | null> => {
        try {
            const projectDocRef = doc(db, COLLECTION_NAME, projectId);
            const snapshot = await getDoc(projectDocRef);
            if (!snapshot.exists()) return null;
            return mapProjectDoc(snapshot);
        } catch (error) {
            console.error('Error fetching project by id:', error);
            return null;
        }
    }
};
