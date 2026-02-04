import { Card, CardBody } from '@/design-system';
import { PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--color-bg-secondary)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-primary)' }}>
                    {payload[0].name}: <strong>{payload[0].value}</strong>
                </p>
            </div>
        );
    }
    return null;
};

export function CategoryDistributionCard() {
    const { metrics } = useDashboardStore();
    const data = metrics?.categoryDistribution ?? [];

    // Sort by value descending for the legend
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    return (
        <Card variant="default" className={`${styles.card} ${styles.categoriesArea}`}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <PieIcon size={16} />
                    CATEGORIAS
                </div>

                {/* Horizontal layout: Chart + Legend */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    minHeight: '180px'
                }}>
                    {/* Donut Chart - Left side (bigger) */}
                    <div style={{ flex: 1, height: '180px', minWidth: '140px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Vertical Legend - Right side (narrower, no scroll) */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.125rem',
                        maxWidth: '120px'
                    }}>
                        {sortedData.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.125rem 0'
                                }}
                            >
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    background: item.color,
                                    borderRadius: '2px',
                                    flexShrink: 0
                                }} />
                                <span style={{
                                    fontSize: '0.625rem',
                                    color: 'var(--color-text-secondary)',
                                    flex: 1,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {item.name}
                                </span>
                                <span style={{
                                    fontSize: '0.625rem',
                                    fontWeight: 700,
                                    color: 'var(--color-text-primary)',
                                    fontFamily: 'monospace'
                                }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

