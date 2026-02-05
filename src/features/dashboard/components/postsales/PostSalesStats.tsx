/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST-SALES STATS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Dashboard section for post-sales metrics - includes ranking of post-sellers
 */

import { useEffect } from 'react';
import { Spinner, Card, CardBody } from '@/design-system';
import { Headphones, CheckCircle, DollarSign, TrendingUp, Trophy, Star, Users } from 'lucide-react';
import styles from './PostSalesStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

// Color palette for ranking positions
const RANK_COLORS = [
    '#fbbf24', // Gold - 1st place
    '#9ca3af', // Silver - 2nd place  
    '#cd7f32', // Bronze - 3rd place
    '#4b5563', // 4th
    '#6b7280', // 5th
];

const AVATAR_COLORS = [
    '#dc2626', // Red
    '#ea580c', // Orange
    '#059669', // Green
    '#0891b2', // Cyan
    '#7c3aed', // Purple
];

function getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function PostSalesStats() {
    const { unifiedMetrics, isLoading, fetchMetrics } = useDashboardStore();

    // Fetch metrics on mount if not already loaded
    useEffect(() => {
        if (!unifiedMetrics) {
            fetchMetrics();
        }
    }, [unifiedMetrics, fetchMetrics]);

    const data = unifiedMetrics?.postSales;

    if (isLoading && !data) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainGrid}>
                {/* Left Column: Ranking */}
                <div className={styles.leftColumn}>
                    {/* Post-Sellers Ranking */}
                    <Card className={styles.card}>
                        <CardBody>
                            <div className={styles.cardTitle}>
                                <Trophy size={16} color="var(--color-warning-400)" />
                                RANKING DE PÓS-VENDEDORAS
                            </div>
                            {data.topPostSellers.length > 0 ? (
                                <div className={styles.rankingList}>
                                    {data.topPostSellers.map((seller, index) => (
                                        <div key={seller.id} className={styles.rankingItem}>
                                            <div
                                                className={styles.rankingRank}
                                                style={{
                                                    backgroundColor: index < 3 ? RANK_COLORS[index] : 'var(--color-surface)',
                                                    color: index < 3 ? '#000' : 'var(--color-text-muted)'
                                                }}
                                            >
                                                {index + 1}º
                                            </div>
                                            {seller.photoUrl ? (
                                                <div className={styles.rankingAvatar}>
                                                    <img
                                                        src={seller.photoUrl}
                                                        alt={seller.name}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className={styles.rankingAvatar}
                                                    style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                                                >
                                                    {getInitials(seller.name)}
                                                </div>
                                            )}
                                            <div className={styles.rankingInfo}>
                                                <div className={styles.rankingName}>{seller.name}</div>
                                                <div className={styles.rankingStats}>
                                                    {seller.ticketsResolved} tickets • {seller.avgRating > 0 ? `⭐ ${seller.avgRating.toFixed(1)}` : 'Sem avaliações'}
                                                </div>
                                            </div>
                                            <div className={styles.rankingValue}>
                                                {formatCurrency(seller.paymentsReceived)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
                                    <Users size={48} strokeWidth={1} style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }} />
                                    <p>Nenhuma pós-vendedora cadastrada</p>
                                    <p style={{ fontSize: '0.75rem' }}>
                                        Adicione colaboradoras do setor Pós-vendas para ver o ranking
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Payments Summary */}
                    <Card className={styles.card}>
                        <CardBody>
                            <div className={styles.cardTitle}>
                                <DollarSign size={16} color="var(--color-success-500)" />
                                PAGAMENTOS RECEBIDOS
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                                        {formatCurrency(data.totalPaymentsReceived)}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                                        Total recebido no período
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column: Summary Cards */}
                <div className={styles.rightColumn}>
                    {/* Open Tickets */}
                    <Card className={styles.card}>
                        <CardBody className={styles.summaryCard}>
                            <div className={styles.summaryIcon}>
                                <Headphones size={18} />
                                TICKETS ABERTOS
                            </div>
                            <div className={styles.summaryValue} style={{ color: data.openTickets > 0 ? 'var(--color-warning-400)' : 'var(--color-success-500)' }}>
                                {data.openTickets}
                            </div>
                            <div className={styles.summarySubtext}>
                                Aguardando atendimento
                            </div>
                        </CardBody>
                    </Card>

                    {/* Resolved Tickets */}
                    <Card className={styles.card}>
                        <CardBody className={styles.summaryCard}>
                            <div className={styles.summaryIcon}>
                                <CheckCircle size={18} />
                                TICKETS RESOLVIDOS
                            </div>
                            <div className={styles.summaryValue} style={{ color: 'var(--color-success-500)' }}>
                                {data.resolvedTickets}
                            </div>
                            <div className={styles.summarySubtext}>
                                No período selecionado
                            </div>
                        </CardBody>
                    </Card>

                    {/* Customer Satisfaction */}
                    <Card className={styles.card}>
                        <CardBody className={styles.summaryCard}>
                            <div className={styles.summaryIcon}>
                                <Star size={18} />
                                SATISFAÇÃO
                            </div>
                            <div className={styles.summaryValue} style={{ color: data.customerSatisfaction >= 80 ? 'var(--color-success-500)' : data.customerSatisfaction >= 60 ? 'var(--color-warning-400)' : 'var(--color-error-500)' }}>
                                {data.customerSatisfaction}%
                            </div>
                            <div className={styles.summarySubtext}>
                                Taxa de aprovação
                            </div>
                        </CardBody>
                    </Card>

                    {/* Retention Rate */}
                    <Card className={styles.card}>
                        <CardBody className={styles.summaryCard}>
                            <div className={styles.summaryIcon}>
                                <TrendingUp size={18} />
                                RETENÇÃO
                            </div>
                            <div className={styles.summaryValue} style={{ color: data.retentionRate >= 85 ? 'var(--color-success-500)' : data.retentionRate >= 70 ? 'var(--color-warning-400)' : 'var(--color-error-500)' }}>
                                {data.retentionRate}%
                            </div>
                            <div className={styles.summarySubtext}>
                                Clientes que voltam
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
