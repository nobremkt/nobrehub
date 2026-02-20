import { Card, CardBody } from '@/design-system';
import { Rocket, Target, Flame, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DeferredChart } from '../DeferredChart';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

function getStatusInfo(percentage: number) {
    if (percentage >= 100) {
        return { icon: <Trophy size={24} color="#22c55e" />, text: 'Meta batida!' };
    } else if (percentage >= 80) {
        return { icon: <Target size={24} color="#f59e0b" />, text: 'Quase lá!' };
    } else if (percentage >= 50) {
        return { icon: <Flame size={24} color="#f97316" />, text: 'Esquentando!' };
    } else {
        return { icon: <Rocket size={24} color="var(--color-primary-500)" />, text: 'Vamos lá!' };
    }
}

export function ProductionGoalCard() {
    const { metrics } = useDashboardStore();

    const goal = metrics?.goalTarget ?? 100;
    // Use totalPoints since goalTarget is calculated in points
    const current = metrics?.totalPoints ?? 0;
    const percentage = metrics?.goalPercentage ?? 0;

    const statusInfo = getStatusInfo(percentage);

    // Data with remainder to ensure correct angle calculation
    const data = [
        { value: Math.min(percentage, 100) },
        { value: Math.max(100 - percentage, 0) }
    ];

    // Background track data (full circle)
    const bgData = [{ value: 100 }];

    return (
        <Card variant="default" className={`${styles.card} ${styles.goalArea}`}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.cardTitle}>
                    <Target size={16} />
                    STATUS DA META
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, position: 'relative' }}>

                    {/* Gauge Container - Pointer Events Disabled */}
                    <div style={{ width: '100%', height: '100%', minHeight: '180px', pointerEvents: 'none' }}>
                        <DeferredChart>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <defs>
                                        <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f87171" /> {/* Lighter Red (400) */}
                                            <stop offset="100%" stopColor="#991b1b" /> {/* Darker Red (800) */}
                                        </linearGradient>
                                    </defs>

                                    {/* Track (Background) */}
                                    <Pie
                                        data={bgData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={75}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        stroke="none"
                                        isAnimationActive={false}
                                    >
                                        <Cell fill="var(--color-bg-secondary)" />
                                    </Pie>

                                    {/* Value (Foreground) */}
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={75}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={10}
                                        paddingAngle={0}
                                        isAnimationActive={false}
                                    >
                                        {/* Value Segment with Gradient */}
                                        <Cell fill="url(#goalGradient)" />
                                        {/* Remainder Segment Transparent */}
                                        <Cell fill="transparent" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </DeferredChart>
                    </div>

                    {/* Centered Label */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                            {percentage}%
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            {current} / {goal} pts
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Status</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                            {statusInfo.icon}
                            {statusInfo.text}
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

