/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CLIENT DISTRIBUTION MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * Modal de dois painéis: detalhes do cliente + atribuição a atendente pós-vendas
 */

import { useState, useMemo } from 'react';
import { Lead } from '@/types/lead.types';
import { Modal, Button, Dropdown } from '@/design-system';
import {
    UserCheck,
    Clock, User, Phone, Mail, DollarSign,
    Thermometer, RefreshCw, Building2, Calendar, Tag
} from 'lucide-react';
import styles from './ClientDistributionModal.module.css';

interface Props {
    client: Lead | null;
    isOpen: boolean;
    onClose: () => void;
    postSalesTeam: { id: string; name: string }[];
    collaborators: { id: string; name: string }[];
    onAssign: (leadId: string, postSalesId: string) => Promise<void>;
    isAssigning: boolean;
}

export const ClientDistributionModal = ({
    client,
    isOpen,
    onClose,
    postSalesTeam,
    collaborators,
    onAssign,
    isAssigning,
}: Props) => {
    const [selectedPostSalesId, setSelectedPostSalesId] = useState('');

    const postSalesOptions = useMemo(() =>
        postSalesTeam.map(p => ({ value: p.id, label: p.name })),
        [postSalesTeam]
    );

    const handleAssign = async () => {
        if (!client || !selectedPostSalesId) return;
        await onAssign(client.id, selectedPostSalesId);
        setSelectedPostSalesId('');
        onClose();
    };

    const getPreviousAttendantName = () => {
        if (!client?.previousPostSalesIds?.length) return null;
        const prevId = client.previousPostSalesIds[client.previousPostSalesIds.length - 1];
        return collaborators.find(c => c.id === prevId)?.name || 'Atendente anterior';
    };

    const formatCurrency = (value?: number) => {
        if (!value) return '—';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (date?: Date | string) => {
        if (!date) return '—';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('pt-BR');
    };

    const getTemperatureLabel = (temp?: string) => {
        if (!temp) return null;
        const labels: Record<string, string> = {
            hot: '🔥 Quente',
            warm: '🌡️ Morno',
            cold: '❄️ Frio'
        };
        return labels[temp] || temp;
    };

    if (!client) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={client.name} size="lg">
            <div className={styles.panels}>
                {/* ── Left Panel: Client Details ───────────────────────── */}
                <div className={styles.detailsPanel}>
                    {/* Returning Client Banner */}
                    {(client.previousPostSalesIds?.length ?? 0) > 0 && (
                        <div className={styles.returningBanner}>
                            <RefreshCw size={16} />
                            Cliente Retorno — Atendido por: {getPreviousAttendantName()}
                        </div>
                    )}

                    {/* Basic Info */}
                    <h5 className={styles.sectionTitle}>Informações do Cliente</h5>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><User size={12} /> Nome</span>
                            <span className={styles.infoValue}>{client.name}</span>
                        </div>
                        {client.phone && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}><Phone size={12} /> Telefone</span>
                                <span className={styles.infoValue}>{client.phone}</span>
                            </div>
                        )}
                        {client.email && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}><Mail size={12} /> Email</span>
                                <span className={styles.infoValue}>{client.email}</span>
                            </div>
                        )}
                        {client.company && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}><Building2 size={12} /> Empresa</span>
                                <span className={styles.infoValue}>{client.company}</span>
                            </div>
                        )}
                    </div>

                    {/* Deal Info */}
                    <h5 className={styles.sectionTitle}>Informações do Negócio</h5>
                    <div className={styles.infoGrid}>
                        {client.dealValue && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}><DollarSign size={12} /> Valor</span>
                                <span className={styles.infoValue} style={{ color: 'var(--color-success-500)' }}>
                                    {formatCurrency(client.dealValue)}
                                </span>
                            </div>
                        )}
                        {client.dealClosedAt && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}><Calendar size={12} /> Fechou em</span>
                                <span className={styles.infoValue}>{formatDate(client.dealClosedAt)}</span>
                            </div>
                        )}
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><Tag size={12} /> Pipeline</span>
                            <span className={styles.infoValue}>
                                {client.pipeline === 'high-ticket' ? 'High Ticket' : 'Low Ticket'}
                            </span>
                        </div>
                        {client.temperature && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}><Thermometer size={12} /> Temperatura</span>
                                <span className={styles.infoValue}>{getTemperatureLabel(client.temperature)}</span>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {client.tags && client.tags.length > 0 && (
                        <>
                            <h5 className={styles.sectionTitle}>Tags</h5>
                            <div className={styles.tagList}>
                                {client.tags.map(tag => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    {(client.notes || client.dealNotes) && (
                        <>
                            <h5 className={styles.sectionTitle}>Observações</h5>
                            {client.dealNotes && (
                                <div className={styles.notesBox}>{client.dealNotes}</div>
                            )}
                            {client.notes && (
                                <div className={styles.notesBox} style={{ marginTop: 'var(--spacing-2)' }}>
                                    {client.notes}
                                </div>
                            )}
                        </>
                    )}

                    {/* Dates */}
                    <h5 className={styles.sectionTitle}>Datas</h5>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><Clock size={12} /> Criado em</span>
                            <span className={styles.infoValue}>{formatDate(client.createdAt)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}><Clock size={12} /> Atualizado em</span>
                            <span className={styles.infoValue}>{formatDate(client.updatedAt)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel: Assignment ─────────────────────────── */}
                <div className={styles.assignPanel}>
                    <h4 className={styles.assignTitle}>
                        <UserCheck size={18} />
                        Atribuir Atendente
                    </h4>

                    <p className={styles.assignDescription}>
                        Selecione um atendente de pós-vendas para este cliente.
                    </p>

                    <div className={styles.dropdownWrapper}>
                        <Dropdown
                            options={postSalesOptions}
                            value={selectedPostSalesId}
                            onChange={(value) => setSelectedPostSalesId(String(value))}
                            placeholder="Selecionar atendente..."
                        />
                    </div>

                    <div className={styles.assignActions}>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAssign}
                            disabled={!selectedPostSalesId || isAssigning}
                            leftIcon={<UserCheck size={14} />}
                            fullWidth
                        >
                            {isAssigning ? 'Atribuindo...' : 'Atribuir Manualmente'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ClientDistributionModal;
