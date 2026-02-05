import { useState, useEffect } from 'react';
import { Users, Package, Clock, Calendar, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { StatCard } from './StatCard';
import styles from '../pages/DashboardPage.module.css';
import { useDashboardStore } from '../stores/useDashboardStore';
import { DashboardAnalyticsService } from '../services/DashboardAnalyticsService';

interface GeneralData {
    activeClients: number;
    newClientsThisMonth: number;
    projectsDelivered: number;
    projectsInProgress: number;
    upcomingDeadlines: number;
    overdueProjects: number;
    teamProductivity: number;
    avgDeliveryDays: number;
}

function useGeneralData() {
    const { dateFilter } = useDashboardStore();
    const [data, setData] = useState<GeneralData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const fetchData = async () => {
            try {
                // Fetch metrics from Firebase using the correct method
                const metrics = await DashboardAnalyticsService.getMetrics(dateFilter);

                if (isMounted) {
                    // Calculate average delivery days from MVP data
                    const avgDays = metrics.mvpProducer?.avgDays || 0;

                    setData({
                        // TODO: Implement clients module to get real client count
                        activeClients: 0, // Placeholder - needs clients collection
                        newClientsThisMonth: 0, // Placeholder - needs clients collection
                        projectsDelivered: metrics.deliveredProjects || 0,
                        projectsInProgress: metrics.totalActiveProjects || 0,
                        upcomingDeadlines: metrics.pendingRevisions || 0,
                        overdueProjects: 0, // TODO: Calculate from projects with deadline < now
                        teamProductivity: metrics.goalPercentage || 0,
                        avgDeliveryDays: avgDays,
                    });
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error fetching general metrics:', error);
                if (isMounted) {
                    // Set zeros on error instead of mock data
                    setData({
                        activeClients: 0,
                        newClientsThisMonth: 0,
                        projectsDelivered: 0,
                        projectsInProgress: 0,
                        upcomingDeadlines: 0,
                        overdueProjects: 0,
                        teamProductivity: 0,
                        avgDeliveryDays: 0,
                    });
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [dateFilter]);

    return { data, isLoading };
}

export function GeneralStats() {
    const { data, isLoading } = useGeneralData();

    if (isLoading && !data) {
        return (
            <div className={styles.statsGrid}>
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    Carregando...
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    // Determine productivity status
    const productivityStatus = data.teamProductivity >= 85
        ? 'Alta performance'
        : data.teamProductivity >= 70
            ? 'Normal'
            : 'Precisa atenção';
    const productivityType = data.teamProductivity >= 85
        ? 'positive'
        : data.teamProductivity >= 70
            ? 'neutral'
            : 'negative';

    // Determine deadline urgency
    const deadlineType = data.upcomingDeadlines > 5 ? 'negative' : data.upcomingDeadlines > 2 ? 'neutral' : 'positive';

    // Determine overdue status
    const overdueType = data.overdueProjects > 0 ? 'negative' : 'positive';

    return (
        <div className={styles.statsGrid}>
            <StatCard
                title="Clientes Ativos"
                value={data.activeClients}
                change={`+${data.newClientsThisMonth} este mês`}
                changeType="positive"
                icon={<Users size={20} />}
            />
            <StatCard
                title="Projetos Entregues"
                value={data.projectsDelivered}
                change={`${data.projectsInProgress} em andamento`}
                changeType="neutral"
                icon={<Package size={20} />}
            />
            <StatCard
                title="Tempo Médio Entrega"
                value={`${data.avgDeliveryDays} dias`}
                change="Por projeto"
                changeType="neutral"
                icon={<Clock size={20} />}
            />
            <StatCard
                title="Prazos Próximos"
                value={data.upcomingDeadlines}
                change="Esta semana"
                changeType={deadlineType as 'positive' | 'neutral' | 'negative'}
                icon={<Calendar size={20} />}
            />
            <StatCard
                title="Projetos Atrasados"
                value={data.overdueProjects}
                change={data.overdueProjects === 0 ? 'Tudo em dia! ✓' : 'Precisam atenção'}
                changeType={overdueType as 'positive' | 'neutral' | 'negative'}
                icon={data.overdueProjects === 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            />
            <StatCard
                title="Produtividade"
                value={`${Math.round(data.teamProductivity)}%`}
                change={productivityStatus}
                changeType={productivityType as 'positive' | 'neutral' | 'negative'}
                icon={<Zap size={20} />}
            />
        </div>
    );
}
