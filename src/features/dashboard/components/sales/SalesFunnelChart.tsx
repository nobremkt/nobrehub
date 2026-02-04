import { Card, CardBody } from '@/design-system';
import { TrendingUp } from 'lucide-react';
import styles from './SalesStats.module.css';

interface FunnelData {
    stage: string;
    count: number;
}

interface SalesFunnelChartProps {
    data: FunnelData[];
}

// Map status names to display names
const STATUS_LABELS: Record<string, string> = {
    'new': 'Novos',
    'contacted': 'Contatados',
    'qualified': 'Qualificados',
    'negotiation': 'Negociação',
    'proposal': 'Proposta',
    'won': 'Fechados',
    'lost': 'Perdidos',
};

// Colors for funnel stages
const STAGE_COLORS: Record<string, string> = {
    'new': '#3b82f6',
    'contacted': '#06b6d4',
    'qualified': '#8b5cf6',
    'negotiation': '#f59e0b',
    'proposal': '#22c55e',
    'won': '#10b981',
    'lost': '#ef4444',
};

export function SalesFunnelChart({ data }: SalesFunnelChartProps) {
    const total = data.reduce((sum, d) => sum + d.count, 0);

    // Sort data by typical funnel order
    const ORDER = ['new', 'contacted', 'qualified', 'negotiation', 'proposal', 'won', 'lost'];
    const sortedData = [...data].sort((a, b) => {
        const aIdx = ORDER.indexOf(a.stage);
        const bIdx = ORDER.indexOf(b.stage);
        return aIdx - bIdx;
    });

    // Calculate max for bar width proportions
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <TrendingUp size={16} color="var(--color-primary-500)" />
                    FUNIL DE VENDAS
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {total} leads no total
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                    {sortedData.map((item, index) => {
                        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                        const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        const color = STAGE_COLORS[item.stage] || '#6b7280';
                        const label = STATUS_LABELS[item.stage] || item.stage;

                        return (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}
                            >
                                {/* Stage label */}
                                <div style={{
                                    width: '90px',
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-muted)',
                                    textAlign: 'right'
                                }}>
                                    {label}
                                </div>

                                {/* Bar */}
                                <div style={{
                                    flex: 1,
                                    height: '24px',
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-sm)',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: `${barWidth}%`,
                                        height: '100%',
                                        background: color,
                                        borderRadius: 'var(--radius-sm)',
                                        transition: 'width 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingLeft: '0.5rem'
                                    }}>
                                        {barWidth > 20 && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                color: 'white'
                                            }}>
                                                {item.count}
                                            </span>
                                        )}
                                    </div>
                                    {barWidth <= 20 && (
                                        <span style={{
                                            position: 'absolute',
                                            right: '0.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            color: 'var(--color-text-muted)'
                                        }}>
                                            {item.count}
                                        </span>
                                    )}
                                </div>

                                {/* Percentage */}
                                <div style={{
                                    width: '40px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    color: 'var(--color-text-secondary)',
                                    textAlign: 'right'
                                }}>
                                    {percentage}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}
