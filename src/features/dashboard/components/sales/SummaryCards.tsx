import { Card, CardBody } from '@/design-system';
import { UserPlus, Briefcase, Percent, DollarSign } from 'lucide-react';
import styles from './SalesStats.module.css';

export function LeadsCard({ count, qualified }: { count: number; qualified: number }) {
    return (
        <Card variant="default" className={styles.card}>
            <CardBody className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                    <UserPlus size={16} color="var(--color-primary-500)" />
                    LEADS
                </div>
                <div className={styles.summaryValue} style={{ color: 'var(--color-primary-500)' }}>
                    {count}
                </div>
                <div className={styles.summarySubtext}>
                    {qualified} qualificados
                </div>
            </CardBody>
        </Card>
    );
}

export function ClosedDealsCard({ closed, lost }: { closed: number; lost: number }) {
    const total = closed + lost;
    const winRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return (
        <Card variant="default" className={styles.card}>
            <CardBody className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                    <Briefcase size={16} color="var(--color-success-500)" />
                    FECHADOS
                </div>
                <div className={styles.summaryValue} style={{ color: 'var(--color-success-500)' }}>
                    {closed}
                </div>
                <div className={styles.summarySubtext}>
                    {lost} perdidos ({winRate}% win rate)
                </div>
            </CardBody>
        </Card>
    );
}

export function ConversionRateCard({ rate }: { rate: number }) {
    const color = rate >= 25 ? 'var(--color-success-500)' : rate >= 15 ? 'var(--color-warning-500)' : 'var(--color-error-500)';
    const status = rate >= 25 ? 'Excelente' : rate >= 15 ? 'Bom' : 'Precisa melhorar';

    return (
        <Card variant="default" className={styles.card}>
            <CardBody className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                    <Percent size={16} color={color} />
                    CONVERSÃO
                </div>
                <div className={styles.summaryValue} style={{ color }}>
                    {rate}%
                </div>
                <div className={styles.summarySubtext}>
                    {status}
                </div>
            </CardBody>
        </Card>
    );
}

export function PipelineValueCard({ value }: { value: number }) {
    return (
        <Card variant="default" className={styles.card}>
            <CardBody className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                    <DollarSign size={16} color="var(--color-warning-500)" />
                    PIPELINE
                </div>
                <div className={styles.summaryValue} style={{ color: 'var(--color-warning-500)' }}>
                    R$ {(value / 1000).toFixed(0)}k
                </div>
                <div className={styles.summarySubtext}>
                    valor potencial
                </div>
            </CardBody>
        </Card>
    );
}
