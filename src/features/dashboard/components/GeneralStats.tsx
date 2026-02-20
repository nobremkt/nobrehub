/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GENERAL STATS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Dashboard overview section - consumes unified metrics from store
 */

import { useEffect } from 'react';
import { Package, Clock, Zap, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import styles from '../pages/DashboardPage.module.css';
import { useDashboardStore } from '../stores/useDashboardStore';

export function GeneralStats() {
    const { unifiedMetrics, isLoading, fetchMetrics } = useDashboardStore();

    // Fetch metrics on mount if not already loaded
    useEffect(() => {
        if (!unifiedMetrics) {
            fetchMetrics();
        }
    }, [unifiedMetrics, fetchMetrics]);

    const general = unifiedMetrics?.general;
    const production = unifiedMetrics?.production;

    if (isLoading && !general) {
        return (
            <div className={styles.statsGrid}>
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    Carregando...
                </div>
            </div>
        );
    }

    if (!general) {
        return null;
    }

    // Determine productivity status
    const productivity = production?.goalPercentage || 0;
    const productivityStatus = productivity >= 85
        ? 'Alta performance'
        : productivity >= 70
            ? 'Normal'
            : 'Precisa atenção';
    const productivityType = productivity >= 85
        ? 'positive'
        : productivity >= 70
            ? 'neutral'
            : 'negative';

    // Determine conversion rate quality
    const conversionType = general.conversionRate >= 30
        ? 'positive'
        : general.conversionRate >= 15
            ? 'neutral'
            : 'negative';

    return (
        <div className={styles.statsGrid}>
            <StatCard
                title="Projetos Entregues"
                value={general.totalDelivered}
                change={`${general.totalProjects - general.totalDelivered} em andamento`}
                changeType="neutral"
                icon={<Package size={20} />}
            />
            <StatCard
                title="Tempo Médio Entrega"
                value={`${general.avgDeliveryTime} dias`}
                change="Por projeto"
                changeType="neutral"
                icon={<Clock size={20} />}
            />
            <StatCard
                title="Conversão"
                value={`${general.conversionRate}%`}
                change={`${general.totalLeads} leads no período`}
                changeType={conversionType as 'positive' | 'neutral' | 'negative'}
                icon={<TrendingUp size={20} />}
            />
            <StatCard
                title="Produtividade"
                value={`${Math.round(productivity)}%`}
                change={productivityStatus}
                changeType={productivityType as 'positive' | 'neutral' | 'negative'}
                icon={<Zap size={20} />}
            />
        </div>
    );
}
