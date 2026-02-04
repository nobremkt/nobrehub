import { Card, CardBody } from '@/design-system';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './AdminStats.module.css';

interface SectorMetric {
    name: string;
    productivity: number;
    trend: 'up' | 'down' | 'stable';
    members: number;
}

interface SectorPerformanceProps {
    sectors: SectorMetric[];
}

export function SectorPerformance({ sectors }: SectorPerformanceProps) {
    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Activity size={16} color="var(--color-success-500)" />
                    PERFORMANCE POR SETOR
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    {sectors.map((sector, index) => {
                        const color = sector.productivity >= 85
                            ? 'var(--color-success-500)'
                            : sector.productivity >= 70
                                ? 'var(--color-warning-500)'
                                : 'var(--color-error-500)';

                        return (
                            <div
                                key={index}
                                style={{
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                {/* Sector name and members */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                                        {sector.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {sector.members} membros
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ flex: 1.5 }}>
                                    <div style={{
                                        height: '8px',
                                        background: 'var(--color-bg-primary)',
                                        borderRadius: 'var(--radius-full)',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${sector.productivity}%`,
                                            background: color,
                                            borderRadius: 'var(--radius-full)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>

                                {/* Percentage */}
                                <div style={{
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    color,
                                    minWidth: '50px',
                                    textAlign: 'right'
                                }}>
                                    {sector.productivity}%
                                </div>

                                {/* Trend indicator */}
                                <div style={{
                                    color: sector.trend === 'up'
                                        ? 'var(--color-success-500)'
                                        : sector.trend === 'down'
                                            ? 'var(--color-error-500)'
                                            : 'var(--color-text-muted)'
                                }}>
                                    {sector.trend === 'up' && <TrendingUp size={16} />}
                                    {sector.trend === 'down' && <TrendingDown size={16} />}
                                    {sector.trend === 'stable' && <Minus size={16} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}
