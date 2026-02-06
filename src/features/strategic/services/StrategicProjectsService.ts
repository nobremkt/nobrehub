/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - PROJECTS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service para gerenciamento de projetos estratégicos no Firestore.
 * Realtime sync com subtarefas.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    Timestamp,
    or,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/config/firebase';
import { useAuthStore } from '@/stores';
import { StrategicProject, ProjectTask, TaskPriority, TaskComment } from '../types';

const COLLECTION_NAME = 'strategic_projects';
const TASKS_SUBCOLLECTION = 'tasks';
const COMMENTS_SUBCOLLECTION = 'comments';

// Strategic Sector ID
export const STRATEGIC_SECTOR_ID = 'zeekJ4iY9voX3AURpar5';

/**
 * Converte documento Firestore para StrategicProject
 */
function mapDocToProject(docSnap: any): StrategicProject {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        title: data.title || 'Sem título',
        description: data.description || '',
        isShared: data.isShared || false,
        ownerId: data.ownerId || '',
        memberIds: data.memberIds || [],
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    };
}

/**
 * Converte documento Firestore para ProjectTask
 */
function mapDocToTask(docSnap: any, projectId: string): ProjectTask {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        projectId,
        parentTaskId: data.parentTaskId || undefined,
        title: data.title || '',
        completed: data.completed || false,
        order: data.order || 0,
        priority: data.priority || 'medium',
        assigneeId: data.assigneeId || undefined,
        assigneeIds: data.assigneeIds || [],
        tags: data.tags || [],
        dueDate: data.dueDate?.toDate() || undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
    };
}

export const StrategicProjectsService = {
    /**
     * Subscribe to user's projects (personal + shared with them)
     */
    subscribeToProjects(callback: (projects: StrategicProject[]) => void): () => void {
        const db = getFirestoreDb();
        const user = useAuthStore.getState().user;
        const userId = user?.id || '';

        if (!userId) {
            callback([]);
            return () => { };
        }

        // Query: projects where user is owner OR user is in memberIds
        const q = query(
            collection(db, COLLECTION_NAME),
            or(
                where('ownerId', '==', userId),
                where('memberIds', 'array-contains', userId)
            ),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(mapDocToProject);
            callback(projects);
        }, (error) => {
            console.error('Error subscribing to projects:', error);
            callback([]);
        });

        return unsubscribe;
    },

    /**
     * Subscribe to tasks for a specific project
     */
    subscribeToTasks(projectId: string, callback: (tasks: ProjectTask[]) => void): () => void {
        const db = getFirestoreDb();

        const q = query(
            collection(db, COLLECTION_NAME, projectId, TASKS_SUBCOLLECTION),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map(doc => mapDocToTask(doc, projectId));
            callback(tasks);
        }, (error) => {
            console.error('Error subscribing to tasks:', error);
            callback([]);
        });

        return unsubscribe;
    },

    /**
     * Create a new project
     */
    async createProject(data: {
        title: string;
        description?: string;
        isShared: boolean;
        memberIds?: string[];
    }): Promise<string> {
        const db = getFirestoreDb();
        const user = useAuthStore.getState().user;

        const now = Timestamp.now();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            title: data.title,
            description: data.description || '',
            isShared: data.isShared,
            ownerId: user?.id || '',
            memberIds: data.memberIds || [],
            status: 'active',
            createdAt: now,
            updatedAt: now,
        });

        return docRef.id;
    },

    /**
     * Update project
     */
    async updateProject(projectId: string, data: Partial<Pick<StrategicProject, 'title' | 'description' | 'status' | 'memberIds'>>): Promise<void> {
        const db = getFirestoreDb();

        await updateDoc(doc(db, COLLECTION_NAME, projectId), {
            ...data,
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Delete project and all its tasks
     */
    async deleteProject(projectId: string): Promise<void> {
        const db = getFirestoreDb();

        // Delete all tasks first
        const tasksSnapshot = await getDocs(
            collection(db, COLLECTION_NAME, projectId, TASKS_SUBCOLLECTION)
        );
        const deletePromises = tasksSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete project
        await deleteDoc(doc(db, COLLECTION_NAME, projectId));
    },

    /**
     * Create a new task in a project
     */
    async createTask(projectId: string, data: {
        title: string;
        order?: number;
        priority?: TaskPriority;
        assigneeId?: string;
        parentTaskId?: string;
        dueDate?: Date;
        tags?: string[];
    }): Promise<string> {
        const db = getFirestoreDb();

        const docRef = await addDoc(
            collection(db, COLLECTION_NAME, projectId, TASKS_SUBCOLLECTION),
            {
                title: data.title,
                completed: false,
                order: data.order || 0,
                priority: data.priority || 'medium',
                assigneeId: data.assigneeId || null,
                parentTaskId: data.parentTaskId || null,
                dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
                tags: data.tags || [],
                createdAt: Timestamp.now(),
            }
        );

        // Update project's updatedAt
        await updateDoc(doc(db, COLLECTION_NAME, projectId), {
            updatedAt: Timestamp.now(),
        });

        return docRef.id;
    },

    /**
     * Update task
     */
    async updateTask(projectId: string, taskId: string, data: Partial<Pick<ProjectTask, 'title' | 'completed' | 'order' | 'priority' | 'assigneeId' | 'assigneeIds' | 'parentTaskId' | 'dueDate' | 'tags'>>): Promise<void> {
        const db = getFirestoreDb();

        await updateDoc(
            doc(db, COLLECTION_NAME, projectId, TASKS_SUBCOLLECTION, taskId),
            data
        );

        // Update project's updatedAt
        await updateDoc(doc(db, COLLECTION_NAME, projectId), {
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Delete task
     */
    async deleteTask(projectId: string, taskId: string): Promise<void> {
        const db = getFirestoreDb();

        await deleteDoc(
            doc(db, COLLECTION_NAME, projectId, TASKS_SUBCOLLECTION, taskId)
        );

        // Update project's updatedAt
        await updateDoc(doc(db, COLLECTION_NAME, projectId), {
            updatedAt: Timestamp.now(),
        });
    },

    /**
     * Add comment to a task
     */
    async addComment(projectId: string, taskId: string, data: { content: string; authorId: string; authorName: string }): Promise<string> {
        const db = getFirestoreDb();
        const docRef = await addDoc(
            collection(db, COLLECTION_NAME, projectId, TASKS_SUBCOLLECTION, taskId, COMMENTS_SUBCOLLECTION),
            {
                ...data,
                projectId,
                taskId,
                createdAt: Timestamp.now(),
            }
        );
        return docRef.id;
    },

    /**
     * Subscribe to task comments
     */
    subscribeToComments(projectId: string, taskId: string, callback: (comments: TaskComment[]) => void): () => void {
        const db = getFirestoreDb();
        const q = query(
            collection(db, COLLECTION_NAME, projectId, TASKS_SUBCOLLECTION, taskId, COMMENTS_SUBCOLLECTION),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const comments: TaskComment[] = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    projectId,
                    taskId,
                    authorId: data.authorId || '',
                    authorName: data.authorName || 'Anônimo',
                    content: data.content || '',
                    createdAt: data.createdAt?.toDate() || new Date(),
                };
            });
            callback(comments);
        });
    },
};
