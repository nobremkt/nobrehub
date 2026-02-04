import { Card, CardBody } from '@/design-system';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import styles from './AdminStats.module.css';

interface ProductivityData {
    name: string;
    productivity: number;
    projects: number;
}

interface ProductivityChartProps {
    data: ProductivityData[];
}

function getBarColor(value: number): string {
    if (value >= 90) return '#22c55e';
    if (value >= 75) return '#f59e0b';
    return '#ef4444';
}

export function ProductivityChart({ data }: ProductivityChartProps) {
    const avgProductivity = data.length > 0
        ? Math.round(data.reduce((sum, d) => sum + d.productivity, 0) / data.length)
        : 0;

    // Sort by productivity descending and take top 8
    const sortedData = [...data]
        .sort((a, b) => b.productivity - a.productivity)
        .slice(0, 8);

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <BarChart3 size={16} color="var(--color-warning-500)" />
                    PRODUTIVIDADE POR MEMBRO
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        Média: {avgProductivity}%
                    </span>
                </div>

                <div style={{ flex: 1, minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={sortedData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} horizontal={false} />
                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--color-border)' }}
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--color-border)' }}
                                width={80}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--color-bg-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                formatter={(value) => [
                                    `${value}%`,
                                    'Produtividade'
                                ]}
                            />
                            <Bar
                                dataKey="productivity"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                            >
                                {sortedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.productivity)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#22c55e' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>Excelente (≥90%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>Bom (≥75%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>Atenção (&lt;75%)</span>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
