import { Card, CardBody } from '@/design-system';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DeferredChart } from '../DeferredChart';
import styles from './FinancialStats.module.css';

interface CostCategory {
    name: string;
    value: number;
    color: string;
}

interface OperationalCostsChartProps {
    data: CostCategory[];
    totalCosts: number;
}

const COST_COLORS: Record<string, string> = {
    'Marketing': '#f59e0b',       // Amber
    'Salários': '#3b82f6',        // Blue
    'Impostos': '#ef4444',        // Red
    'Comissões': '#10b981',       // Emerald
    'Outros Gastos': '#6b7280',   // Gray
    'Infraestrutura': '#06b6d4',  // Cyan
    'Ferramentas': '#8b5cf6',     // Purple
    'Metas': '#f97316',           // Orange
};

export function OperationalCostsChart({ data, totalCosts }: OperationalCostsChartProps) {
    // Sort by value descending
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <PieChartIcon size={16} color="var(--color-warning-500)" />
                    CUSTOS OPERACIONAIS
                    <span style={{ marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                        R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
                    {/* Donut Chart */}
                    <div style={{ flex: '0 0 180px', height: '180px' }}>
                        <DeferredChart>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={sortedData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        isAnimationActive={false}
                                    >
                                        {sortedData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COST_COLORS[entry.name] || '#6b7280'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--color-bg-primary)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                        formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                                        isAnimationActive={false}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </DeferredChart>
                    </div>

                    {/* Legend */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {sortedData.map((item, index) => {
                            const percentage = totalCosts > 0 ? ((item.value / totalCosts) * 100).toFixed(1) : '0';
                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0.75rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div
                                            style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '2px',
                                                background: item.color || COST_COLORS[item.name] || '#6b7280'
                                            }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {item.name}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {percentage}%
                                        </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                                            R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
