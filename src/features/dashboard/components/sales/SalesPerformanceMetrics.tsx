import { Card, CardBody } from '@/design-system';
import { Clock, Timer, Zap, Target } from 'lucide-react';
import styles from './SalesStats.module.css';

interface SalesMetricsData {
    avgResponseTime: number; // hours
    avgCycleTime: number; // days
    contactRate: number; // percentage
    followUpRate: number; // percentage
}

interface SalesPerformanceMetricsProps {
    data: SalesMetricsData;
}

export function SalesPerformanceMetrics({ data }: SalesPerformanceMetricsProps) {
    const formatTime = (hours: number) => {
        if (hours < 1) return `${Math.round(hours * 60)}min`;
        if (hours < 24) return `${Math.round(hours)}h`;
        return `${Math.round(hours / 24)}d`;
    };

    const getResponseColor = (hours: number) => {
        if (hours <= 2) return 'var(--color-success-500)';
        if (hours <= 8) return 'var(--color-warning-500)';
        return 'var(--color-error-500)';
    };

    const getCycleColor = (days: number) => {
        if (days <= 7) return 'var(--color-success-500)';
        if (days <= 21) return 'var(--color-warning-500)';
        return 'var(--color-error-500)';
    };

    const getRateColor = (rate: number) => {
        if (rate >= 80) return 'var(--color-success-500)';
        if (rate >= 50) return 'var(--color-warning-500)';
        return 'var(--color-error-500)';
    };

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Zap size={16} color="var(--color-warning-500)" />
                    MÉTRICAS DE PERFORMANCE
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    flex: 1
                }}>
                    {/* Response Time */}
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                    }}>
                        <Timer size={18} color={getResponseColor(data.avgResponseTime)} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                            Tempo Resposta
                        </span>
                        <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: getResponseColor(data.avgResponseTime)
                        }}>
                            {formatTime(data.avgResponseTime)}
                        </span>
                    </div>

                    {/* Cycle Time */}
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                    }}>
                        <Clock size={18} color={getCycleColor(data.avgCycleTime)} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                            Ciclo Venda
                        </span>
                        <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: getCycleColor(data.avgCycleTime)
                        }}>
                            {data.avgCycleTime}d
                        </span>
                    </div>

                    {/* Contact Rate */}
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                    }}>
                        <Target size={18} color={getRateColor(data.contactRate)} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                            Taxa Contato
                        </span>
                        <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: getRateColor(data.contactRate)
                        }}>
                            {data.contactRate}%
                        </span>
                    </div>

                    {/* Follow-up Rate */}
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                    }}>
                        <Zap size={18} color={getRateColor(data.followUpRate)} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                            Taxa Follow-up
                        </span>
                        <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: getRateColor(data.followUpRate)
                        }}>
                            {data.followUpRate}%
                        </span>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
