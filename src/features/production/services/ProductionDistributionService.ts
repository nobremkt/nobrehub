/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PRODUCTION DISTRIBUTION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Gerencia a lista de distribuição de projetos para produtores
 * Só o líder de produção tem acesso a essas funções
 */

import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    updateDoc,
    doc,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config';
import { Project, DistributionStatus } from '@/types/project.types';
import { ProjectStatusPageService } from './ProjectStatusPageService';

const COLLECTION_NAME = COLLECTIONS.PRODUCTION_PROJECTS;

// Tipo para informações de carga de trabalho do produtor
interface ProducerWorkload {
    producerId: string;
    producerName: string;
    activeProjects: number;  // Projetos não finalizados
    totalPoints: number;     // Soma dos pontos dos projetos ativos
}

// Tipo para projeto na lista de distribuição
interface DistributionProject extends Project {
    isHighlighted?: boolean; // Se tem sugestão de produtor
}

export const ProductionDistributionService = {
    /**
     * Busca projetos na lista de distribuição (pending ou suggested)
     * Só retorna projetos que ainda não foram atribuídos
     */
    getDistributionQueue: async (): Promise<DistributionProject[]> => {
        try {
            const projectsRef = collection(db, COLLECTION_NAME);
            const q = query(
                projectsRef,
                where('distributionStatus', 'in', ['pending', 'suggested']),
                orderBy('createdAt', 'asc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    isHighlighted: data.distributionStatus === 'suggested'
                } as DistributionProject;
            });
        } catch (error) {
            console.error('Error fetching distribution queue:', error);
            throw error;
        }
    },

    /**
     * Inscreve-se para atualizações em tempo real da lista de distribuição
     */
    subscribeToDistributionQueue: (callback: (projects: DistributionProject[]) => void) => {
        const projectsRef = collection(db, COLLECTION_NAME);
        const q = query(
            projectsRef,
            where('distributionStatus', 'in', ['pending', 'suggested']),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    isHighlighted: data.distributionStatus === 'suggested'
                } as DistributionProject;
            });
            callback(projects);
        }, (error) => {
            console.error('Error listening to distribution queue:', error);
        });
    },

    /**
     * Calcula a carga de trabalho de um produtor
     * Considera projetos ativos (não finalizados) e seus pontos
     */
    calculateProducerWorkload: async (producerId: string): Promise<ProducerWorkload> => {
        try {
            const projectsRef = collection(db, COLLECTION_NAME);
            // Projetos ativos = não estão em 'entregue', 'concluido'
            const q = query(
                projectsRef,
                where('producerId', '==', producerId),
                where('status', 'not-in', ['entregue', 'concluido'])
            );

            const snapshot = await getDocs(q);
            let totalPoints = 0;

            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                totalPoints += data.totalPoints || data.basePoints || 1;
            });

            // Pega o nome do primeiro projeto (se existir)
            const producerName = snapshot.docs[0]?.data().producerName || '';

            return {
                producerId,
                producerName,
                activeProjects: snapshot.size,
                totalPoints
            };
        } catch (error) {
            console.error('Error calculating producer workload:', error);
            throw error;
        }
    },

    /**
     * Busca carga de trabalho de todos os produtores
     */
    getAllProducersWorkload: async (producerIds: string[]): Promise<ProducerWorkload[]> => {
        const workloads = await Promise.all(
            producerIds.map(id => ProductionDistributionService.calculateProducerWorkload(id))
        );
        return workloads;
    },

    /**
     * Atribui projeto manualmente para um produtor (líder decide)
     */
    assignToProducer: async (
        projectId: string,
        producerId: string,
        producerName: string,
        assignedByLeaderId: string
    ): Promise<void> => {
        try {
            const projectRef = doc(db, COLLECTION_NAME, projectId);
            await updateDoc(projectRef, {
                producerId,
                producerName,
                distributionStatus: 'assigned' as DistributionStatus,
                assignedByLeaderId,
                assignedAt: new Date(),
                status: 'aguardando', // Muda para aguardando início
                updatedAt: new Date()
            });
            await ProjectStatusPageService.syncFromProjectId(projectId);
        } catch (error) {
            console.error('Error assigning project:', error);
            throw error;
        }
    },

    /**
     * Distribui automaticamente para o produtor com menor carga
     * NÃO distribui projetos com sugestão (esses são manuais)
     */
    autoAssignProject: async (
        projectId: string,
        producerIds: string[],
        assignedByLeaderId: string
    ): Promise<{ producerId: string; producerName: string } | null> => {
        try {
            // Busca o projeto para verificar se tem sugestão
            const projectsRef = collection(db, COLLECTION_NAME);
            const projectSnapshot = await getDocs(
                query(projectsRef, where('__name__', '==', projectId))
            );

            if (projectSnapshot.empty) {
                throw new Error('Project not found');
            }

            const projectData = projectSnapshot.docs[0].data();

            // Se tem sugestão, não distribui automaticamente
            if (projectData.distributionStatus === 'suggested' && projectData.suggestedProducerId) {
                return null;
            }

            // Calcula carga de todos os produtores
            const workloads = await ProductionDistributionService.getAllProducersWorkload(producerIds);

            // Ordena por pontos totais (menor primeiro)
            workloads.sort((a, b) => a.totalPoints - b.totalPoints);

            // Pega o produtor com menor carga
            const selected = workloads[0];

            if (!selected) {
                throw new Error('No producers available');
            }

            // Atribui ao produtor
            await ProductionDistributionService.assignToProducer(
                projectId,
                selected.producerId,
                selected.producerName,
                assignedByLeaderId
            );

            return {
                producerId: selected.producerId,
                producerName: selected.producerName
            };
        } catch (error) {
            console.error('Error auto-assigning project:', error);
            throw error;
        }
    },

    /**
     * Distribui automaticamente todos os projetos pendentes (sem sugestão)
     */
    autoAssignAllPending: async (
        producerIds: string[],
        assignedByLeaderId: string
    ): Promise<number> => {
        try {
            const queue = await ProductionDistributionService.getDistributionQueue();

            // Filtra apenas projetos sem sugestão
            const pendingOnly = queue.filter(p => p.distributionStatus === 'pending');

            let assigned = 0;
            for (const project of pendingOnly) {
                const result = await ProductionDistributionService.autoAssignProject(
                    project.id,
                    producerIds,
                    assignedByLeaderId
                );
                if (result) assigned++;
            }

            return assigned;
        } catch (error) {
            console.error('Error auto-assigning all projects:', error);
            throw error;
        }
    }
};
