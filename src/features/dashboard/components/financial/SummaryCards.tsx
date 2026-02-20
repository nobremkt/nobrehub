import { Card, CardBody } from '@/design-system';
import { DollarSign, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import styles from './FinancialStats.module.css';

interface RevenueCardProps {
    revenue: number;
    previousRevenue?: number;
    contractedRevenue?: number;
}

export function RevenueCard({ revenue, previousRevenue, contractedRevenue }: RevenueCardProps) {
    const change = previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
    const isPositive = change >= 0;

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <Banknote size={16} color="var(--color-success-500)" />
                    FATURAMENTO REAL
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1, color: 'var(--color-success-500)' }}>
                    R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {previousRevenue !== undefined && previousRevenue > 0 && (
                    <div style={{
                        fontSize: '0.875rem',
                        color: isPositive ? 'var(--color-success-500)' : 'var(--color-error-500)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isPositive ? '+' : ''}{change.toFixed(1)}% vs período anterior
                    </div>
                )}
                {contractedRevenue !== undefined && contractedRevenue > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', opacity: 0.7, marginTop: '0.25rem' }}>
                        Valor contratado: R$ {contractedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export function ExpensesCard({ expenses }: { expenses: number }) {
    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <DollarSign size={16} color="var(--color-error-500)" />
                    DESPESAS
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1, color: 'var(--color-error-500)' }}>
                    R$ {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    no período • <span style={{ opacity: 0.6 }}>estimativa</span>
                </div>
            </CardBody>
        </Card>
    );
}

export function ProfitCard({ profit, margin }: { profit: number; margin: number }) {
    const isPositive = profit >= 0;

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {isPositive ? <TrendingUp size={16} color="var(--color-success-500)" /> : <TrendingDown size={16} color="var(--color-error-500)" />}
                    LUCRO
                </div>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    lineHeight: 1,
                    color: isPositive ? 'var(--color-success-500)' : 'var(--color-error-500)'
                }}>
                    {isPositive ? '' : '- '}R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{
                    fontSize: '0.875rem',
                    color: isPositive ? 'var(--color-success-500)' : 'var(--color-error-500)'
                }}>
                    margem {margin.toFixed(1)}%
                </div>
            </CardBody>
        </Card>
    );
}

export function AvgTicketCard({ avgTicket }: { avgTicket: number }) {
    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <DollarSign size={16} color="var(--color-warning-500)" />
                    TICKET MÉDIO
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                    R$ {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    por projeto
                </div>
            </CardBody>
        </Card>
    );
}
