import { Card, CardBody } from '@/design-system';
import { Star, Trophy, Zap, CheckCircle, Clock } from 'lucide-react';
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

    // All stats are for the MVP (top producer by points)
    const mvp = metrics?.mvpProducer;
    const mvpName = mvp?.name ?? '—';
    const mvpProjects = mvp?.projects ?? 0;
    const mvpPoints = mvp?.points ?? 0;
    const mvpAvgDays = mvp?.avgDays ?? 0;
    const mvpApprovalRate = mvp?.approvalRate ?? 0;
    const mvpPhotoUrl = mvp?.profilePhotoUrl;

    // Efficiency = points / projects (for the MVP)
    const efficiency = mvpProjects > 0 ? (mvpPoints / mvpProjects).toFixed(1) : '0';

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
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'white', overflow: 'hidden' }}>
                                    {mvpPhotoUrl ? (
                                        <img src={mvpPhotoUrl} alt={mvpName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        mvpName.charAt(0)
                                    )}
                                </div>
                                <span>{mvpName}</span>
                            </div>
                        }
                        subtext={`${mvpProjects} projetos`}
                    />
                    <HighlightItem
                        icon={<Clock size={14} color="#3b82f6" />}
                        label="MAIS RÁPIDO"
                        value={`${mvpAvgDays} dias`}
                        subtext="média/projeto"
                    />
                    <HighlightItem
                        icon={<Zap size={14} color="#f59e0b" />}
                        label="EFICIÊNCIA"
                        value={efficiency}
                        subtext="pts/projeto"
                    />
                    <HighlightItem
                        icon={<CheckCircle size={14} color="#22c55e" />}
                        label="APROVAÇÃO"
                        value={
                            <span style={{ color: mvpApprovalRate >= 80 ? 'var(--color-success-500)' : mvpApprovalRate >= 60 ? 'var(--color-warning-500)' : 'var(--color-error-500)' }}>{mvpApprovalRate}%</span>
                        }
                    />
                </div>
            </CardBody>
        </Card>
    );
}
