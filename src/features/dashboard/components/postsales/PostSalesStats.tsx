/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST-SALES STATS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Dashboard section for post-sales metrics - real data from imported spreadsheets
 */

import { useEffect } from 'react';
import { Spinner, Card, CardBody } from '@/design-system';
import {
    DollarSign, TrendingUp, TrendingDown, Trophy, Users,
    UserMinus, UserCheck, AlertTriangle, Target
} from 'lucide-react';
import styles from './PostSalesStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

const RANK_COLORS = [
    '#fbbf24', // Gold - 1st
    '#9ca3af', // Silver - 2nd
    '#cd7f32', // Bronze - 3rd
    '#4b5563', // 4th
    '#6b7280', // 5th
];

const AVATAR_COLORS = [
    '#dc2626', '#ea580c', '#059669', '#0891b2', '#7c3aed',
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
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
}

export function PostSalesStats() {
    const { unifiedMetrics, isLoading, fetchMetrics } = useDashboardStore();

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

    // Color thresholds adjusted for repeat-client model
    // For a production agency, most clients buy once — 85%+ new is normal
    const churnColor = data.churnRate >= 95 ? 'var(--color-warning-400)' : data.churnRate >= 85 ? 'var(--color-text-secondary)' : 'var(--color-success-500)';
    const retentionColor = data.retentionRate >= 15 ? 'var(--color-success-500)' : data.retentionRate >= 5 ? 'var(--color-warning-400)' : 'var(--color-text-secondary)';

    return (
        <div className={styles.container}>
            {/* KPI Summary Row */}
            <div className={styles.kpiRow}>
                {/* Total Recebido */}
                <Card className={styles.kpiCard}>
                    <CardBody className={styles.kpiBody}>
                        <div className={styles.kpiHeader}>
                            <DollarSign size={16} />
                            <span>RECEBIMENTOS</span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: 'var(--color-success-500)' }}>
                            {formatCurrency(data.totalReceipts)}
                        </div>
                        <div className={styles.kpiSubtext}>
                            {formatNumber(data.uniqueClientsReceipts)} clientes no período
                        </div>
                    </CardBody>
                </Card>

                {/* Vendas do Pós */}
                <Card className={styles.kpiCard}>
                    <CardBody className={styles.kpiBody}>
                        <div className={styles.kpiHeader}>
                            <TrendingUp size={16} />
                            <span>VENDAS DO PÓS</span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: 'var(--color-info-500)' }}>
                            {formatCurrency(data.totalSales)}
                        </div>
                        <div className={styles.kpiSubtext}>
                            {formatNumber(data.uniqueClientsSales)} clientes no período
                        </div>
                    </CardBody>
                </Card>

                {/* Churn Rate — first-time buyers */}
                <Card className={styles.kpiCard}>
                    <CardBody className={styles.kpiBody}>
                        <div className={styles.kpiHeader}>
                            <UserMinus size={16} />
                            <span>CLIENTES NOVOS</span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: churnColor }}>
                            {data.churnRate}%
                        </div>
                        <div className={styles.kpiSubtext}>
                            {data.commercialClients > 0
                                ? `${formatNumber(data.commercialClients - data.clientsWithDebits)} de ${formatNumber(data.commercialClients)} primeira compra`
                                : 'Sem vendas comerciais no período'
                            }
                        </div>
                    </CardBody>
                </Card>

                {/* Retention Rate — returning clients */}
                <Card className={styles.kpiCard}>
                    <CardBody className={styles.kpiBody}>
                        <div className={styles.kpiHeader}>
                            <UserCheck size={16} />
                            <span>RECORRÊNCIA</span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: retentionColor }}>
                            {data.retentionRate}%
                        </div>
                        <div className={styles.kpiSubtext}>
                            {data.commercialClients > 0
                                ? `${formatNumber(data.clientsWithDebits)} clientes recorrentes`
                                : 'Sem vendas comerciais no período'
                            }
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Secondary KPI Row */}
            <div className={styles.kpiRow}>
                {/* LTV */}
                <Card className={styles.kpiCard}>
                    <CardBody className={styles.kpiBody}>
                        <div className={styles.kpiHeader}>
                            <Target size={16} />
                            <span>LTV</span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: 'var(--color-primary-500)' }}>
                            {formatCurrency(data.ltv)}
                        </div>
                        <div className={styles.kpiSubtext}>
                            Valor médio por cliente
                        </div>
                    </CardBody>
                </Card>

                {/* Ticket Médio */}
                <Card className={styles.kpiCard}>
                    <CardBody className={styles.kpiBody}>
                        <div className={styles.kpiHeader}>
                            <DollarSign size={16} />
                            <span>TICKET MÉDIO</span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: 'var(--color-text-primary)' }}>
                            {formatCurrency(data.avgReceiptValue)}
                        </div>
                        <div className={styles.kpiSubtext}>
                            Valor médio por recebimento
                        </div>
                    </CardBody>
                </Card>

                {/* Débitos Pendentes */}
                <Card className={styles.kpiCard}>
                    <CardBody className={styles.kpiBody}>
                        <div className={styles.kpiHeader}>
                            <AlertTriangle size={16} />
                            <span>DÉBITOS PENDENTES</span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: 'var(--color-warning-400)' }}>
                            {formatCurrency(data.debitosPending)}
                        </div>
                        <div className={styles.kpiSubtext}>
                            De {formatCurrency(data.debitosTotal)} total
                        </div>
                    </CardBody>
                </Card>

                {/* CAC */}
                <Card className={styles.kpiCard}>
                    <CardBody className={styles.kpiBody}>
                        <div className={styles.kpiHeader}>
                            <TrendingDown size={16} />
                            <span>CAC</span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: 'var(--color-warning-400)' }}>
                            {data.cac > 0 ? formatCurrency(data.cac) : '—'}
                        </div>
                        <div className={styles.kpiSubtext}>
                            {data.cac > 0
                                ? `Custo por cliente adquirido`
                                : 'Sem dados de marketing no período'
                            }
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Bottom: Ranking */}
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
                                    {seller.profilePhotoUrl ? (
                                        <div className={styles.rankingAvatar}>
                                            <img
                                                src={seller.profilePhotoUrl}
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
                                            {formatNumber(seller.receiptCount)} recebimentos • {formatNumber(seller.uniqueClients)} clientes
                                        </div>
                                    </div>
                                    <div className={styles.rankingValue}>
                                        {formatCurrency(seller.totalReceived)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
                            <Users size={48} strokeWidth={1} style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }} />
                            <p>Nenhum recebimento no período selecionado</p>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
