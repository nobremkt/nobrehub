/**
 * Client Table Component
 */

import { useState } from 'react';
import { Trash2, Phone, Building2, Calendar, DollarSign, Pencil } from 'lucide-react';
import { ConfirmModal, Spinner } from '@/design-system';
import { SocialMediaClient } from '../../types/socialMedia';
import { useSocialMediaStore } from '../../stores/useSocialMediaStore';
import styles from './ClientTable.module.css';

interface ClientTableProps {
    clients: SocialMediaClient[];
    isLoading: boolean;
    selectedClientId?: string | null;
    onSelectClient?: (id: string | null) => void;
    onEditClient?: (client: SocialMediaClient) => void;
}

const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getPlanTypeLabel = (type: string): string => {
    switch (type) {
        case 'expansao': return 'Expansão';
        case 'presenca': return 'Presença';
        default: return type;
    }
};

const getContractStatus = (endDate: Date): 'active' | 'warning' | 'expired' => {
    const today = new Date();
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilEnd < 0) return 'expired';
    if (daysUntilEnd <= 30) return 'warning';
    return 'active';
};

export const ClientTable = ({ clients, isLoading, selectedClientId, onSelectClient, onEditClient }: ClientTableProps) => {
    const { deleteClient } = useSocialMediaStore();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleDelete = async () => {
        if (deleteConfirmId) {
            await deleteClient(deleteConfirmId);
            setDeleteConfirmId(null);
            if (selectedClientId === deleteConfirmId) {
                onSelectClient?.(null);
            }
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <Spinner size="md" />
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className={styles.empty}>
                <p>Nenhum cliente cadastrado</p>
            </div>
        );
    }

    return (
        <>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th><Phone size={14} /> Contato</th>
                            <th><Building2 size={14} /> Empresa</th>
                            <th>Instagram</th>
                            <th>Prazo</th>
                            <th>Plano</th>
                            <th><Calendar size={14} /> Início</th>
                            <th><Calendar size={14} /> Vencimento</th>
                            <th><DollarSign size={14} /> Valor</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => {
                            const contractStatus = client.contractEndDate ? getContractStatus(client.contractEndDate) : 'active';
                            return (
                                <tr
                                    key={client.id}
                                    className={`${styles.row} ${styles[contractStatus]}`}
                                >
                                    <td className={styles.clientName}>{client.clientName}</td>
                                    <td>{client.contact || '-'}</td>
                                    <td>{client.companyName || '-'}</td>
                                    <td>
                                        {client.instagramUsername && client.instagramUrl ? (
                                            <a
                                                href={client.instagramUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.instagramBtn}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {client.instagramUsername.startsWith('@') ? client.instagramUsername : `@${client.instagramUsername}`}
                                            </a>
                                        ) : client.instagramUsername || '-'}
                                    </td>
                                    <td>{client.planDuration} {client.planDuration === 1 ? 'mês' : 'meses'}</td>
                                    <td>
                                        <span className={`${styles.planBadge} ${styles[client.planType]}`}>
                                            {getPlanTypeLabel(client.planType)}
                                        </span>
                                    </td>
                                    <td>{formatDate(client.postStartDate)}</td>
                                    <td className={styles[contractStatus]}>{formatDate(client.contractEndDate)}</td>
                                    <td>{formatCurrency(client.value)}</td>
                                    <td className={styles.actions}>
                                        {onEditClient && (
                                            <button
                                                className={styles.editBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditClient(client);
                                                }}
                                                title="Editar cliente"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmId(client.id);
                                            }}
                                            title="Excluir cliente"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {deleteConfirmId && (
                <ConfirmModal
                    isOpen={true}
                    title="Excluir Cliente"
                    description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    cancelLabel="Cancelar"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteConfirmId(null)}
                    variant="danger"
                />
            )}
        </>
    );
};
