import { Card, CardBody } from '@/design-system';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
import styles from './FinancialStats.module.css';

interface AccountsData {
    receivable: number;
    payable: number;
    overdue: number;
}

export function AccountsOverview({ data }: { data: AccountsData }) {
    const balance = data.receivable - data.payable;
    const isPositiveBalance = balance >= 0;

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Wallet size={16} color="var(--color-primary-500)" />
                    CONTAS
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', flex: 1 }}>
                    {/* A Receber */}
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            <ArrowUpCircle size={14} color="#22c55e" />
                            A RECEBER
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                            R$ {data.receivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* A Pagar */}
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            <ArrowDownCircle size={14} color="#ef4444" />
                            A PAGAR
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-error-500)' }}>
                            R$ {data.payable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Atrasados */}
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            <Clock size={14} color="#f59e0b" />
                            ATRASADOS
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-warning-500)' }}>
                            R$ {data.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Balance indicator */}
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    background: isPositiveBalance ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Saldo previsto
                    </span>
                    <span style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: isPositiveBalance ? 'var(--color-success-500)' : 'var(--color-error-500)'
                    }}>
                        {isPositiveBalance ? '+' : '-'} R$ {Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </CardBody>
        </Card>
    );
}
