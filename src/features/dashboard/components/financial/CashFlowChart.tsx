import { Card, CardBody } from '@/design-system';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import styles from './FinancialStats.module.css';

interface CashFlowData {
    month: string;
    revenue: number;
    expenses: number;
    balance: number;
}

interface CashFlowChartProps {
    data: CashFlowData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
    const latestBalance = data.length > 0 ? data[data.length - 1].balance : 0;
    const previousBalance = data.length > 1 ? data[data.length - 2].balance : 0;
    const trend = latestBalance - previousBalance;
    const isPositive = trend >= 0;

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <TrendingUp size={16} color="var(--color-primary-500)" />
                    FLUXO DE CAIXA
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        color: isPositive ? 'var(--color-success-500)' : 'var(--color-error-500)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        R$ {Math.abs(trend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                <div style={{ flex: 1, minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="cashFlowRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="cashFlowExpenses" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--color-border)' }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--color-border)' }}
                                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                            />
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
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#22c55e"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#cashFlowRevenue)"
                                name="Receita"
                                isAnimationActive={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#cashFlowExpenses)"
                                name="Despesas"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#22c55e' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>Receitas</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>Despesas</span>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
