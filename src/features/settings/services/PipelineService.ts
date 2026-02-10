import { getFirestoreDb } from '@/config/firebase';
import {
    collection,
    doc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    setDoc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { PipelineStage } from '../types';

const COLLECTION_NAME = 'pipeline_stages';

// Stages padrão para seed inicial
const DEFAULT_STAGES: Omit<PipelineStage, 'createdAt' | 'updatedAt'>[] = [
    // High Ticket Pipeline
    { id: 'ht-novo', name: 'Novo Lead', color: '#6366F1', order: 0, pipeline: 'high-ticket', active: true },
    { id: 'ht-qualificacao', name: 'Qualificação', color: '#F59E0B', order: 1, pipeline: 'high-ticket', active: true },
    { id: 'ht-proposta', name: 'Proposta Enviada', color: '#8B5CF6', order: 2, pipeline: 'high-ticket', active: true },
    { id: 'ht-negociacao', name: 'Em Negociação', color: '#EC4899', order: 3, pipeline: 'high-ticket', active: true },
    { id: 'ht-ganho', name: 'Ganho', color: '#22C55E', order: 4, pipeline: 'high-ticket', isSystemStage: true, active: true },
    { id: 'ht-perdido', name: 'Perdido', color: '#EF4444', order: 5, pipeline: 'high-ticket', isSystemStage: true, active: true },

    // Low Ticket Pipeline
    { id: 'lt-entrada', name: 'Entrada', color: '#3B82F6', order: 0, pipeline: 'low-ticket', active: true },
    { id: 'lt-interesse', name: 'Demonstrou Interesse', color: '#F59E0B', order: 1, pipeline: 'low-ticket', active: true },
    { id: 'lt-carrinho', name: 'Carrinho', color: '#8B5CF6', order: 2, pipeline: 'low-ticket', active: true },
    { id: 'lt-ganho', name: 'Ganho', color: '#22C55E', order: 3, pipeline: 'low-ticket', isSystemStage: true, active: true },
    { id: 'lt-perdido', name: 'Perdido', color: '#EF4444', order: 4, pipeline: 'low-ticket', isSystemStage: true, active: true },
];

export const PipelineService = {
    /**
     * Lista todos os stages de pipeline
     */
    getStages: async (): Promise<PipelineStage[]> => {
        const db = getFirestoreDb();
        const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        })) as PipelineStage[];
    },

    /**
     * Cria um novo stage com ID personalizado
     */
    createStage: async (stage: Omit<PipelineStage, 'createdAt' | 'updatedAt'>): Promise<string> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, stage.id);
        await setDoc(docRef, {
            ...stage,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        return stage.id;
    },

    /**
     * Atualiza um stage existente
     */
    updateStage: async (id: string, updates: Partial<Omit<PipelineStage, 'id' | 'createdAt'>>): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Date.now()
        });
    },

    /**
     * Remove um stage (apenas se não for isSystemStage)
     */
    deleteStage: async (id: string): Promise<void> => {
        const db = getFirestoreDb();
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    /**
     * Seed com stages padrão — só executa se a collection estiver vazia
     */
    seedDefaultStages: async (): Promise<PipelineStage[]> => {
        const db = getFirestoreDb();
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));

        if (snapshot.size > 0) {
            // Já tem stages, retorna os existentes
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as PipelineStage[];
        }

        // Cria stages padrão em batch
        const batch = writeBatch(db);
        const now = Date.now();
        const seededStages: PipelineStage[] = [];

        for (const stage of DEFAULT_STAGES) {
            const docRef = doc(db, COLLECTION_NAME, stage.id);
            const fullStage: PipelineStage = {
                ...stage,
                createdAt: now,
                updatedAt: now
            };
            batch.set(docRef, fullStage);
            seededStages.push(fullStage);
        }

        await batch.commit();
        return seededStages;
    }
};
