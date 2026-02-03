import { Card, CardBody } from '@/design-system';
import { Star, Trophy, Zap, CheckCircle } from 'lucide-react';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

function HighlightItem({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string | React.ReactNode, subtext?: string }) {
    return (
        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {icon}
                    {label}
                </div>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{value}</div>
                {subtext && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtext}</div>}
            </div>
        </div>
    );
}

export function ProductionHighlights() {
    const { metrics } = useDashboardStore();

    const mvpName = metrics?.mvpProducer?.name ?? '—';
    const mvpProjects = metrics?.mvpProducer?.projects ?? 0;
    const fastestName = metrics?.fastestProducer?.name ?? '—';
    const fastestDays = metrics?.fastestProducer?.avgDays ?? 0;
    const approvalRate = metrics?.deliveredProjects && metrics?.totalActiveProjects
        ? Math.round((metrics.deliveredProjects / (metrics.deliveredProjects + metrics.totalActiveProjects)) * 100)
        : 0;
    const efficiency = metrics?.activeProducers && metrics.totalPoints
        ? (metrics.totalPoints / metrics.activeProducers).toFixed(1)
        : '0';

    return (
        <Card variant="default" className={`${styles.card} ${styles.highlightsArea}`}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Star size={16} color="var(--color-warning-500)" />
                    DESTAQUES
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
                    <HighlightItem
                        icon={<Trophy size={14} color="#f59e0b" />}
                        label="MVP"
                        value={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'white' }}>{mvpName.charAt(0)}</div>
                                <span>{mvpName}</span>
                            </div>
                        }
                        subtext={`${mvpProjects} projetos`}
                    />
                    <HighlightItem
                        icon={<Zap size={14} color="#f59e0b" />}
                        label="MAIS RÁPIDO"
                        value={fastestName}
                        subtext={`${fastestDays} dias/proj`}
                    />
                    <HighlightItem
                        icon={<Zap size={14} color="#f59e0b" />}
                        label="EFICIÊNCIA"
                        value={efficiency}
                        subtext="pts/prod"
                    />
                    <HighlightItem
                        icon={<CheckCircle size={14} color="#22c55e" />}
                        label="APROVAÇÃO"
                        value={
                            <span style={{ color: 'var(--color-success-500)' }}>{approvalRate}%</span>
                        }
                    />
                </div>
            </CardBody>
        </Card>
    );
}

