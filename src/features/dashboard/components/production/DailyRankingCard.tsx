import { Card, CardBody } from '@/design-system';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

// Custom Tooltip for styling
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--color-bg-secondary)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>{label}</p>
                <p style={{ color: 'var(--color-primary-500)' }}>{`${payload[0].value} pts`}</p>
            </div>
        );
    }
    return null;
};

export function DailyRankingCard() {
    const { metrics } = useDashboardStore();
    const data = metrics?.producerRanking ?? [];

    return (
        <Card variant="default" className={`${styles.card} ${styles.rankingArea}`}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <BarChart3 size={16} />
                    RANKING
                </div>

                <div style={{ flex: 1, minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} isAnimationActive={false} />
                            <Bar dataKey="points" barSize={20} radius={[0, 4, 4, 0]}>
                                <LabelList
                                    dataKey="points"
                                    position="right"
                                    fill="var(--color-text-muted)"
                                    fontSize={12}
                                    fontWeight={600}
                                />
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill="#dc2626" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardBody>
        </Card>
    );
}

