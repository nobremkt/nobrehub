/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CLIENT DISTRIBUTION LIST COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Lista de distribuição de clientes para pós-vendas
 * Visível apenas para líderes de pós-vendas
 */

import { useEffect, useState, useMemo } from 'react';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { PostSalesDistributionService } from '../../services/PostSalesDistributionService';
import { Lead } from '@/types/lead.types';
import { Button, Spinner } from '@/design-system';
import {
    Inbox,
    Clock,
    Zap,
    RefreshCw,
    DollarSign,
    Thermometer
} from 'lucide-react';
import { ClientDistributionModal } from './ClientDistributionModal';
import styles from './ClientDistributionList.module.css';

interface DistributionClient extends Lead {
    previousAttendant?: string;
}

export const ClientDistributionList = () => {
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const { sectors, fetchSectors } = useSectorStore();

    const [clients, setClients] = useState<DistributionClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState<string | null>(null);

    // Modal state
    const [selectedClient, setSelectedClient] = useState<DistributionClient | null>(null);

    // Encontra o setor de pós-vendas (aceita variações do nome)
    const postSalesSectorId = useMemo(() => {
        const sector = sectors.find(s => {
            const name = s.name.toLowerCase();
            return name.includes('pós-venda') ||
                name.includes('pos-venda') ||
                name.includes('post-sales') ||
                name.includes('pos venda');
        });
        return sector?.id;
    }, [sectors]);

    // Lista de atendentes de pós-vendas
    const postSalesTeam = useMemo(() => {
        if (!postSalesSectorId) return [];
        return collaborators.filter(c => c.sectorId === postSalesSectorId && c.active);
    }, [collaborators, postSalesSectorId]);

    // Carrega dados iniciais
    useEffect(() => {
        if (collaborators.length === 0) fetchCollaborators();
        if (sectors.length === 0) fetchSectors();
    }, [fetchCollaborators, fetchSectors, collaborators.length, sectors.length]);

    // Inscreve na lista de distribuição em tempo real
    useEffect(() => {
        const unsubscribe = PostSalesDistributionService.subscribeToDistributionQueue((queue) => {
            setClients(queue);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Handler para atribuir manualmente (via modal)
    const handleAssign = async (leadId: string, postSalesId: string) => {
        const postSales = postSalesTeam.find(p => p.id === postSalesId);
        if (!postSales) return;

        setIsAssigning(leadId);
        try {
            await PostSalesDistributionService.assignToPostSales(
                leadId,
                postSalesId,
                postSales.name
            );
        } catch (error) {
            console.error('Error assigning client:', error);
        } finally {
            setIsAssigning(null);
        }
    };

    // Handler para distribuir automaticamente todos
    const handleAutoAssignAll = async () => {
        if (postSalesTeam.length === 0) return;

        setIsAssigning('all');
        try {
            const postSalesIds = postSalesTeam.map(p => p.id);
            const count = await PostSalesDistributionService.autoAssignAllPending(postSalesIds);
            console.log(`${count} clientes distribuídos automaticamente`);
        } catch (error) {
            console.error('Error auto-assigning all clients:', error);
        } finally {
            setIsAssigning(null);
        }
    };

    // Formata valor do deal
    const formatDealValue = (value?: number) => {
        if (!value) return null;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Retorna o nome de quem atendeu anteriormente
    const getPreviousAttendantName = (client: DistributionClient) => {
        if (!client.previousPostSalesIds?.length) return null;
        const prevId = client.previousPostSalesIds[client.previousPostSalesIds.length - 1];
        return collaborators.find(c => c.id === prevId)?.name || 'Atendente anterior';
    };

    if (isLoading) {
        return (
            <div className={styles.distributionList}>
                <div className={styles.emptyState}>
                    <Spinner size="md" />
                    <p>Carregando lista de distribuição...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.distributionList}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.title}>
                    <Inbox size={20} />
                    Clientes para Distribuir
                    {clients.length > 0 && (
                        <span className={styles.badge}>{clients.length}</span>
                    )}
                </div>

                {clients.length > 0 && (
                    <div className={styles.actions}>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAutoAssignAll}
                            disabled={isAssigning === 'all'}
                            leftIcon={<Zap size={14} />}
                        >
                            {isAssigning === 'all' ? 'Distribuindo...' : 'Distribuir Todos'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={styles.content}>
                {clients.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Inbox size={48} />
                        <p>Não há clientes aguardando distribuição</p>
                    </div>
                ) : (
                    clients.map(client => (
                        <div
                            key={client.id}
                            className={styles.clientCard}
                            onClick={() => setSelectedClient(client)}
                        >
                            {/* Returning Client Badge */}
                            {(client.previousPostSalesIds?.length ?? 0) > 0 && (
                                <div className={styles.returningBadge}>
                                    <RefreshCw size={12} />
                                    Retorno - Atendido por: {getPreviousAttendantName(client)}
                                </div>
                            )}

                            {/* Card Header */}
                            <div className={styles.cardHeader}>
                                <div>
                                    <h4 className={styles.clientName}>{client.name}</h4>
                                    {client.dealValue && (
                                        <p className={styles.dealValue}>
                                            <DollarSign size={12} style={{ display: 'inline' }} />
                                            {formatDealValue(client.dealValue)}
                                        </p>
                                    )}
                                </div>
                                {client.temperature && (
                                    <span className={`${styles.tempBadge} ${styles[client.temperature]}`}>
                                        <Thermometer size={10} style={{ display: 'inline', marginRight: 2 }} />
                                        {client.temperature === 'hot' ? 'Quente' :
                                            client.temperature === 'warm' ? 'Morno' : 'Frio'}
                                    </span>
                                )}
                            </div>

                            {/* Info Rows */}
                            {client.dealClosedAt && (
                                <div className={styles.infoRow}>
                                    <Clock size={12} />
                                    Fechou em: {new Date(client.dealClosedAt).toLocaleDateString('pt-BR')}
                                </div>
                            )}

                            {client.phone && (
                                <div className={styles.infoRow}>
                                    📱 {client.phone}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Assignment Modal */}
            <ClientDistributionModal
                client={selectedClient}
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)}
                postSalesTeam={postSalesTeam}
                collaborators={collaborators}
                onAssign={handleAssign}
                isAssigning={isAssigning === selectedClient?.id}
            />
        </div>
    );
};

export default ClientDistributionList;
