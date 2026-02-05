
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Project } from '@/types/project.types';

const COLLECTION_NAME = 'production_projects';

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
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Converte Timestamps para Dates
                    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    deliveredAt: data.deliveredAt instanceof Timestamp ? data.deliveredAt.toDate() : undefined,
                } as Project;
            });
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
            const allProjects = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    deliveredAt: data.deliveredAt instanceof Timestamp ? data.deliveredAt.toDate() : undefined,
                } as Project;
            });

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
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...project,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return docRef.id;
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
            const projects = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    deliveredAt: data.deliveredAt instanceof Timestamp ? data.deliveredAt.toDate() : undefined,
                } as Project;
            });
            callback(projects);
        }, (error) => {
            console.error('Error listening to projects:', error);
        });
    },

    /**
     * Busca projeto vinculado a um lead específico
     * Retorna o projeto mais recente se houver múltiplos
     */
    getProjectByLeadId: async (leadId: string): Promise<Project | null> => {
        try {
            const projectsRef = collection(db, COLLECTION_NAME);
            const q = query(
                projectsRef,
                where('leadId', '==', leadId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                deliveredAt: data.deliveredAt instanceof Timestamp ? data.deliveredAt.toDate() : undefined,
            } as Project;
        } catch (error) {
            console.error('Error fetching project by leadId:', error);
            return null;
        }
    },

    /**
     * Inscreve-se para atualizações em tempo real do projeto vinculado a um lead
     */
    subscribeToProjectByLeadId: (leadId: string, callback: (project: Project | null) => void) => {
        const projectsRef = collection(db, COLLECTION_NAME);
        const q = query(
            projectsRef,
            where('leadId', '==', leadId),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                callback(null);
                return;
            }

            const doc = snapshot.docs[0];
            const data = doc.data();
            callback({
                id: doc.id,
                ...data,
                dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                deliveredAt: data.deliveredAt instanceof Timestamp ? data.deliveredAt.toDate() : undefined,
            } as Project);
        }, (error) => {
            console.error('Error listening to project by leadId:', error);
        });
    }
};
