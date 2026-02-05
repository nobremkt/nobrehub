/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CLIENT INBOX
 * ═══════════════════════════════════════════════════════════════════════════════
 * Inbox de clientes do atendente selecionado
 * Similar ao ProjectBoard de Produção
 */

import { useEffect, useState, useMemo } from 'react';
import { usePostSalesStore } from '../stores/usePostSalesStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { PostSalesDistributionService } from '../services/PostSalesDistributionService';
import { ProductionService } from '@/features/production/services/ProductionService';
import { Lead, ClientStatus } from '@/types/lead.types';
import { Project, ProjectStatus } from '@/types/project.types';
import { Button, Spinner } from '@/design-system';
import {
    User,
    Clock,
    CheckCircle,
    AlertTriangle,
    CreditCard,
    Phone,
    Calendar,
    DollarSign,
    Hammer
} from 'lucide-react';
import styles from './ClientInbox.module.css';

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; icon: typeof Clock }> = {
    'aguardando_projeto': { label: 'Aguardando Vídeo', color: 'info', icon: Clock },
    'aguardando_alteracao': { label: 'Em Alteração', color: 'warning', icon: AlertTriangle },
    'entregue': { label: 'Entregue', color: 'success', icon: CheckCircle },
    'aguardando_pagamento': { label: 'Aguard. Pagamento', color: 'primary', icon: CreditCard },
    'concluido': { label: 'Concluído', color: 'muted', icon: CheckCircle }
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    'aguardando': 'Aguardando Início',
    'em-producao': 'Em Produção',
    'a-revisar': 'A Revisar',
    'revisado': 'Revisado',
    'alteracao': 'Em Alteração',
    'entregue': 'Entregue',
    'concluido': 'Concluído'
};

export const ClientInbox = () => {
    const { selectedPostSalesId, clientsByAttendant, setClientsForAttendant } = usePostSalesStore();
    const { collaborators } = useCollaboratorStore();

    const [isLoading, setIsLoading] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
    const [linkedProject, setLinkedProject] = useState<Project | null>(null);

    // Encontra o atendente selecionado
    const selectedAttendant = useMemo(() => {
        return collaborators.find(c => c.id === selectedPostSalesId);
    }, [collaborators, selectedPostSalesId]);

    // Clientes do atendente selecionado (sem concluídos)
    const allClients = useMemo(() => {
        if (!selectedPostSalesId) return [];
        return (clientsByAttendant[selectedPostSalesId] || []).filter(c => c.clientStatus !== 'concluido');
    }, [clientsByAttendant, selectedPostSalesId]);

    // Clientes filtrados por status
    const clients = useMemo(() => {
        if (statusFilter === 'all') return allClients;
        return allClients.filter(c => c.clientStatus === statusFilter);
    }, [allClients, statusFilter]);

    // Contagem por status
    const statusCounts = useMemo(() => ({
        all: allClients.length,
        aguardando_projeto: allClients.filter(c => c.clientStatus === 'aguardando_projeto').length,
        aguardando_alteracao: allClients.filter(c => c.clientStatus === 'aguardando_alteracao').length,
        entregue: allClients.filter(c => c.clientStatus === 'entregue').length,
        aguardando_pagamento: allClients.filter(c => c.clientStatus === 'aguardando_pagamento').length,
    }), [allClients]);

    // Cliente selecionado
    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId);
    }, [clients, selectedClientId]);

    // Inscreve-se para atualizações em tempo real dos clientes do atendente
    useEffect(() => {
        if (!selectedPostSalesId) return;

        setIsLoading(true);

        const unsubscribe = PostSalesDistributionService.subscribeToClientsByAttendant(
            selectedPostSalesId,
            (fetchedClients) => {
                setClientsForAttendant(selectedPostSalesId, fetchedClients);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [selectedPostSalesId, setClientsForAttendant]);

    // Inscreve-se para atualizações em tempo real do projeto vinculado ao cliente
    useEffect(() => {
        if (!selectedClientId) {
            setLinkedProject(null);
            return;
        }

        const unsubscribe = ProductionService.subscribeToProjectByLeadId(
            selectedClientId,
            (project) => {
                setLinkedProject(project);
            }
        );

        return () => unsubscribe();
    }, [selectedClientId]);

    // Atualiza status do cliente
    const handleUpdateStatus = async (clientId: string, newStatus: ClientStatus) => {
        if (!selectedPostSalesId) return;

        try {
            await PostSalesDistributionService.updateClientStatus(clientId, newStatus);
            // Atualiza localmente
            const updatedClients = clients.map(c =>
                c.id === clientId ? { ...c, clientStatus: newStatus } : c
            );
            setClientsForAttendant(selectedPostSalesId, updatedClients as Lead[]);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Marca cliente como concluído
    const handleCompleteClient = async (clientId: string) => {
        if (!selectedPostSalesId) return;

        try {
            await PostSalesDistributionService.completeClient(clientId);
            // Remove da lista local
            const updatedClients = clients.filter(c => c.id !== clientId);
            setClientsForAttendant(selectedPostSalesId, updatedClients);
            setSelectedClientId(null);
        } catch (error) {
            console.error('Error completing client:', error);
        }
    };

    // Solicita revisão - projeto volta pro MESMO produtor
    const handleRequestRevision = async (clientId: string, projectId?: string) => {
        if (!selectedPostSalesId) return;

        try {
            // Por enquanto usa um projectId mockado se não existir
            // TODO: Buscar projectId real vinculado ao lead
            const pid = projectId || clientId; // fallback
            await PostSalesDistributionService.requestRevision(clientId, pid, 'Alteração solicitada pelo cliente');
            // Atualização será feita pelo subscription
        } catch (error) {
            console.error('Error requesting revision:', error);
        }
    };

    // Cliente aprovou o projeto
    const handleApproveClient = async (clientId: string, projectId?: string) => {
        if (!selectedPostSalesId) return;

        try {
            await PostSalesDistributionService.approveClient(clientId, projectId);
            // Atualização será feita pelo subscription
        } catch (error) {
            console.error('Error approving client:', error);
        }
    };

    // Formata valor
    const formatCurrency = (value?: number) => {
        if (!value) return null;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Gera iniciais do nome
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    // Se nenhum atendente selecionado
    if (!selectedPostSalesId) {
        return (
            <div className={styles.emptyState}>
                <User size={64} />
                <h3>Selecione um atendente</h3>
                <p>Escolha um membro da equipe para ver os clientes</p>
            </div>
        );
    }

    // Loading
    if (isLoading) {
        return (
            <div className={styles.emptyState}>
                <Spinner size="lg" />
                <p>Carregando clientes...</p>
            </div>
        );
    }

    return (
        <div className={styles.inbox}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>
                    Clientes de {selectedAttendant?.name || 'Atendente'}
                </h2>
                <span className={styles.count}>{clients.length} ativos</span>
            </div>

            <div className={styles.content}>
                {/* Client List */}
                <div className={styles.clientList}>
                    {/* Status Filter Tabs */}
                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'all' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            Todos
                            <span className={styles.filterCount}>{statusCounts.all}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'aguardando_projeto' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('aguardando_projeto')}
                        >
                            <Clock size={12} />
                            Ag. Vídeo
                            <span className={styles.filterCount}>{statusCounts.aguardando_projeto}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'entregue' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('entregue')}
                        >
                            <CheckCircle size={12} />
                            Entregue
                            <span className={styles.filterCount}>{statusCounts.entregue}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'aguardando_alteracao' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('aguardando_alteracao')}
                        >
                            <AlertTriangle size={12} />
                            Alteração
                            <span className={styles.filterCount}>{statusCounts.aguardando_alteracao}</span>
                        </button>
                        <button
                            className={`${styles.filterTab} ${statusFilter === 'aguardando_pagamento' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('aguardando_pagamento')}
                        >
                            <CreditCard size={12} />
                            Pagamento
                            <span className={styles.filterCount}>{statusCounts.aguardando_pagamento}</span>
                        </button>
                    </div>

                    {/* Client Cards */}
                    <div className={styles.clientCards}>
                        {clients.length === 0 ? (
                            <div className={styles.emptyList}>
                                <User size={32} />
                                <p>Nenhum cliente encontrado</p>
                            </div>
                        ) : (
                            clients.map(client => {
                                const config = STATUS_CONFIG[client.clientStatus || 'aguardando_projeto'];
                                const isSelected = selectedClientId === client.id;

                                return (
                                    <div
                                        key={client.id}
                                        className={`${styles.clientCard} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => setSelectedClientId(client.id)}
                                    >
                                        <div className={styles.clientAvatar}>
                                            {getInitials(client.name)}
                                        </div>
                                        <div className={styles.clientInfo}>
                                            <h4 className={styles.clientName}>{client.name}</h4>
                                            <div className={`${styles.statusBadge} ${styles[config.color]}`}>
                                                <config.icon size={10} />
                                                {config.label}
                                            </div>
                                        </div>
                                        {client.dealValue && (
                                            <span className={styles.dealValue}>
                                                {formatCurrency(client.dealValue)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Client Details */}
                <div className={styles.detailsPanel}>
                    {selectedClient ? (
                        <div className={styles.details}>
                            <div className={styles.detailsHeader}>
                                <div className={styles.detailsAvatar}>
                                    {getInitials(selectedClient.name)}
                                </div>
                                <div>
                                    <h3 className={styles.detailsName}>{selectedClient.name}</h3>
                                    <div className={`${styles.statusBadge} ${styles[STATUS_CONFIG[selectedClient.clientStatus || 'aguardando_projeto'].color]}`}>
                                        {STATUS_CONFIG[selectedClient.clientStatus || 'aguardando_projeto'].label}
                                    </div>
                                </div>
                            </div>

                            {/* Info Items */}
                            <div className={styles.infoItems}>
                                {selectedClient.phone && (
                                    <div className={styles.infoItem}>
                                        <Phone size={14} />
                                        <span>{selectedClient.phone}</span>
                                    </div>
                                )}
                                {selectedClient.dealValue && (
                                    <div className={styles.infoItem}>
                                        <DollarSign size={14} />
                                        <span>{formatCurrency(selectedClient.dealValue)}</span>
                                    </div>
                                )}
                                {selectedClient.dealClosedAt && (
                                    <div className={styles.infoItem}>
                                        <Calendar size={14} />
                                        <span>Fechou em: {new Date(selectedClient.dealClosedAt).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Project Status - Real Time */}
                            {linkedProject && (
                                <div className={styles.projectStatus}>
                                    <div className={styles.projectStatusHeader}>
                                        <Hammer size={14} />
                                        <span>Projeto na Produção</span>
                                    </div>
                                    <div className={styles.projectStatusContent}>
                                        <div className={styles.projectStatusRow}>
                                            <span className={styles.projectStatusLabel}>Status:</span>
                                            <span className={`${styles.projectStatusValue} ${styles[linkedProject.status.replace('-', '')]}`}>
                                                {PROJECT_STATUS_LABELS[linkedProject.status]}
                                            </span>
                                        </div>
                                        <div className={styles.projectStatusRow}>
                                            <span className={styles.projectStatusLabel}>Produtor:</span>
                                            <span className={styles.projectStatusValue}>{linkedProject.producerName}</span>
                                        </div>
                                        {linkedProject.dueDate && (
                                            <div className={styles.projectStatusRow}>
                                                <span className={styles.projectStatusLabel}>Previsão:</span>
                                                <span className={styles.projectStatusValue}>
                                                    {new Date(linkedProject.dueDate).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className={styles.actions}>
                                {selectedClient.clientStatus === 'aguardando_projeto' && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleUpdateStatus(selectedClient.id, 'entregue')}
                                    >
                                        Marcar como Entregue
                                    </Button>
                                )}
                                {selectedClient.clientStatus === 'entregue' && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleRequestRevision(selectedClient.id)}
                                        >
                                            Solicitar Alteração
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={() => handleApproveClient(selectedClient.id)}
                                        >
                                            Cliente Aprovou ✓
                                        </Button>
                                    </>
                                )}
                                {selectedClient.clientStatus === 'aguardando_alteracao' && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleUpdateStatus(selectedClient.id, 'entregue')}
                                    >
                                        Alteração Entregue
                                    </Button>
                                )}
                                {selectedClient.clientStatus === 'aguardando_pagamento' && (
                                    <Button
                                        variant="primary"
                                        onClick={() => handleCompleteClient(selectedClient.id)}
                                    >
                                        Concluir (Pago)
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyDetails}>
                            <User size={48} />
                            <h4>Selecione um cliente</h4>
                            <p>Clique em um cliente para ver detalhes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientInbox;
