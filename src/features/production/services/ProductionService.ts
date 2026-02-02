
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
    Timestamp
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
    }
};
