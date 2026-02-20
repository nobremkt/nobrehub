import { Card, CardBody } from '@/design-system';
import { Target, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import styles from './FinancialStats.module.css';

interface FinancialKPIsProps {
    revenue: number;
    expenses: number;
    margin: number;
    operationalCosts: { name: string; value: number; color: string }[];
}

export function FinancialKPIs({ revenue, expenses, margin, operationalCosts }: FinancialKPIsProps) {
    // Extract marketing spend from operational costs
    const marketingSpend = operationalCosts.find(c => c.name === 'Marketing')?.value || 0;
    const payroll = operationalCosts.find(c => c.name === 'Salários')?.value || 0;
    const taxes = operationalCosts.find(c => c.name === 'Impostos')?.value || 0;

    // ROAS = Revenue / Marketing Spend
    const roas = marketingSpend > 0 ? (revenue / marketingSpend) : 0;

    // Cost per R$ earned = Expenses / Revenue
    const costPerReal = revenue > 0 ? (expenses / revenue) : 0;

    // Payroll ratio = Salários / Revenue
    const payrollRatio = revenue > 0 ? ((payroll / revenue) * 100) : 0;

    // Tax ratio = Impostos / Revenue
    const taxRatio = revenue > 0 ? ((taxes / revenue) * 100) : 0;

    const kpis = [
        {
            icon: <Target size={14} />,
            label: 'ROAS',
            value: roas > 0 ? `${roas.toFixed(1)}x` : '—',
            subtext: marketingSpend > 0
                ? `R$ ${(marketingSpend / 1000).toFixed(0)}K investido`
                : 'Sem dados de marketing',
            color: roas >= 5 ? 'var(--color-success-500)' : roas >= 3 ? 'var(--color-warning-400)' : 'var(--color-error-500)',
            iconColor: '#f59e0b',
        },
        {
            icon: <TrendingUp size={14} />,
            label: 'MARGEM LÍQUIDA',
            value: `${margin.toFixed(1)}%`,
            subtext: margin >= 40 ? 'Saudável' : margin >= 25 ? 'Atenção' : 'Crítica',
            color: margin >= 40 ? 'var(--color-success-500)' : margin >= 25 ? 'var(--color-warning-400)' : 'var(--color-error-500)',
            iconColor: '#22c55e',
        },
        {
            icon: <DollarSign size={14} />,
            label: 'CUSTO / R$ FATURADO',
            value: costPerReal > 0 ? `R$ ${costPerReal.toFixed(2)}` : '—',
            subtext: costPerReal > 0
                ? `A cada R$ 1 faturado, gasta R$ ${costPerReal.toFixed(2)}`
                : 'Sem dados',
            color: costPerReal <= 0.5 ? 'var(--color-success-500)' : costPerReal <= 0.7 ? 'var(--color-warning-400)' : 'var(--color-error-500)',
            iconColor: '#3b82f6',
        },
        {
            icon: <BarChart3 size={14} />,
            label: 'FOLHA / RECEITA',
            value: payrollRatio > 0 ? `${payrollRatio.toFixed(1)}%` : '—',
            subtext: taxRatio > 0 ? `Impostos: ${taxRatio.toFixed(1)}% da receita` : 'Sem dados',
            color: payrollRatio <= 20 ? 'var(--color-success-500)' : payrollRatio <= 30 ? 'var(--color-warning-400)' : 'var(--color-error-500)',
            iconColor: '#8b5cf6',
        },
    ];

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Target size={16} color="var(--color-primary-500)" />
                    INDICADORES FINANCEIROS
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', flex: 1 }}>
                    {kpis.map((kpi, i) => (
                        <div
                            key={i}
                            style={{
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.7rem',
                                color: 'var(--color-text-muted)',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                            }}>
                                <span style={{ color: kpi.iconColor }}>{kpi.icon}</span>
                                {kpi.label}
                            </div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: kpi.color,
                            }}>
                                {kpi.value}
                            </div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-muted)',
                            }}>
                                {kpi.subtext}
                            </div>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}
