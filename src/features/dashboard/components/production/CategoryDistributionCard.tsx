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

    return (
        <Card variant="default" className={`${styles.card} ${styles.categoriesArea}`}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <PieIcon size={16} />
                    CATEGORIAS
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
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

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
                        {data.map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', background: item.color, borderRadius: '2px' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

