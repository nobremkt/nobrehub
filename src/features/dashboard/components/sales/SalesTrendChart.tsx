import { Card, CardBody } from '@/design-system';
import { Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { DeferredChart } from '../DeferredChart';
import styles from './SalesStats.module.css';

interface SalesTrendData {
    date: string;
    leads: number;
    closed: number;
}

interface SalesTrendChartProps {
    data: SalesTrendData[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
    // Calculate totals and trends
    const halfPoint = Math.floor(data.length / 2);
    const firstHalfLeads = data.slice(0, halfPoint).reduce((sum, d) => sum + d.leads, 0);
    const secondHalfLeads = data.slice(halfPoint).reduce((sum, d) => sum + d.leads, 0);
    const leadsTrend = secondHalfLeads - firstHalfLeads;
    const isPositiveTrend = leadsTrend >= 0;

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Calendar size={16} color="var(--color-primary-500)" />
                    EVOLUÇÃO DE LEADS
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        color: isPositiveTrend ? 'var(--color-success-500)' : 'var(--color-error-500)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        {isPositiveTrend ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(leadsTrend)} leads
                    </span>
                </div>

                <div style={{ flex: 1, minHeight: '200px' }}>
                    <DeferredChart>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="salesTrendLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="salesTrendClosed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                                    axisLine={{ stroke: 'var(--color-border)' }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                                    axisLine={{ stroke: 'var(--color-border)' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--color-bg-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                    isAnimationActive={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    stroke="#dc2626"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#salesTrendLeads)"
                                    name="Leads"
                                    isAnimationActive={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="closed"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#salesTrendClosed)"
                                    name="Fechados"
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </DeferredChart>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#dc2626' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>Novos Leads</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#22c55e' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>Fechados</span>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
