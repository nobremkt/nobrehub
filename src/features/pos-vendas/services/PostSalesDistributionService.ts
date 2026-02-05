/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES DISTRIBUTION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Gerencia a lista de distribuição de clientes para pós-vendas
 * Clientes são distribuídos quando o projeto é criado
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
import { Lead, ClientStatus } from '@/types/lead.types';

const LEADS_COLLECTION = 'leads';

// Tipo para carga de trabalho do pós-venda
interface PostSalesWorkload {
    postSalesId: string;
    postSalesName: string;
    activeClients: number;  // Clientes com status aguardando_projeto ou aguardando_alteracao
}

// Tipo para cliente na lista de distribuição
interface DistributionClient extends Lead {
    previousAttendant?: string; // Quem atendeu antes (se retornando)
}

export const PostSalesDistributionService = {
    /**
     * Busca clientes na lista de distribuição (pendentes)
     * Só retorna clientes que ainda não foram atribuídos a um pós-venda
     */
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
            return snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                    dealClosedAt: data.dealClosedAt instanceof Timestamp ? data.dealClosedAt.toDate() : undefined,
                    // Mostra quem atendeu antes se existir
                    previousAttendant: data.previousPostSalesIds?.length > 0
                        ? data.previousPostSalesIds[data.previousPostSalesIds.length - 1]
                        : undefined
                } as DistributionClient;
            });
        } catch (error) {
            console.error('Error fetching post-sales distribution queue:', error);
            throw error;
        }
    },

    /**
     * Inscreve-se para atualizações em tempo real da lista de distribuição
     */
    subscribeToDistributionQueue: (callback: (clients: DistributionClient[]) => void) => {
        const leadsRef = collection(db, LEADS_COLLECTION);
        const q = query(
            leadsRef,
            where('postSalesDistributionStatus', '==', 'pending'),
            where('currentSector', '==', 'distribution'),
            orderBy('dealClosedAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const clients = snapshot.docs.map(docSnap => {
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
            });
            callback(clients);
        }, (error) => {
            console.error('Error listening to post-sales distribution queue:', error);
        });
    },

    /**
     * Calcula a carga de trabalho de um pós-venda
     * Considera clientes ATIVOS (aguardando_projeto ou aguardando_alteracao)
     */
    calculatePostSalesWorkload: async (postSalesId: string): Promise<PostSalesWorkload> => {
        try {
            const leadsRef = collection(db, LEADS_COLLECTION);
            // Clientes ativos = aguardando_projeto ou aguardando_alteracao
            const activeStatuses: ClientStatus[] = ['aguardando_projeto', 'aguardando_alteracao'];

            const q = query(
                leadsRef,
                where('postSalesId', '==', postSalesId),
                where('clientStatus', 'in', activeStatuses)
            );

            const snapshot = await getDocs(q);

            return {
                postSalesId,
                postSalesName: '', // Será preenchido pelo componente
                activeClients: snapshot.size
            };
        } catch (error) {
            console.error('Error calculating post-sales workload:', error);
            throw error;
        }
    },

    /**
     * Busca carga de trabalho de todos os pós-vendas
     */
    getAllPostSalesWorkload: async (postSalesIds: string[]): Promise<PostSalesWorkload[]> => {
        const workloads = await Promise.all(
            postSalesIds.map(id => PostSalesDistributionService.calculatePostSalesWorkload(id))
        );
        return workloads;
    },

    /**
     * Atribui cliente manualmente para um pós-venda (líder decide)
     */
    assignToPostSales: async (
        leadId: string,
        postSalesId: string,
        _postSalesName: string  // Usado para consistência de API
    ): Promise<void> => {
        try {
            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            await updateDoc(leadRef, {
                postSalesId,
                postSalesDistributionStatus: 'assigned',
                postSalesAssignedAt: new Date(),
                currentSector: 'pos_vendas',
                clientStatus: 'aguardando_projeto' as ClientStatus
            });
        } catch (error) {
            console.error('Error assigning client to post-sales:', error);
            throw error;
        }
    },

    /**
     * Distribui automaticamente para o pós-venda com menor carga
     */
    autoAssignClient: async (
        leadId: string,
        postSalesIds: string[]
    ): Promise<{ postSalesId: string; postSalesName: string } | null> => {
        try {
            if (postSalesIds.length === 0) {
                return null; // Nenhum pós-venda disponível
            }

            // Calcula carga de todos os pós-vendas
            const workloads = await PostSalesDistributionService.getAllPostSalesWorkload(postSalesIds);

            // Ordena por clientes ativos (menor primeiro)
            workloads.sort((a, b) => a.activeClients - b.activeClients);

            // Pega o pós-venda com menor carga
            const selected = workloads[0];

            if (!selected) {
                return null;
            }

            // Atribui ao pós-venda
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

    /**
     * Distribui automaticamente todos os clientes pendentes
     */
    autoAssignAllPending: async (postSalesIds: string[]): Promise<number> => {
        try {
            const queue = await PostSalesDistributionService.getDistributionQueue();

            let assigned = 0;
            for (const client of queue) {
                const result = await PostSalesDistributionService.autoAssignClient(
                    client.id,
                    postSalesIds
                );
                if (result) assigned++;
            }

            return assigned;
        } catch (error) {
            console.error('Error auto-assigning all clients:', error);
            throw error;
        }
    },

    /**
     * Atualiza o status do cliente no pós-vendas
     */
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

    /**
     * Marca cliente como concluído (sai do inbox pós-venda)
     */
    completeClient: async (leadId: string): Promise<void> => {
        try {
            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            await updateDoc(leadRef, {
                clientStatus: 'concluido' as ClientStatus,
                currentSector: 'vendas', // Volta pra base de contatos
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error completing client:', error);
            throw error;
        }
    }
};
