import { Card, CardBody } from '@/design-system';
import { Users, Clock, Target, Zap } from 'lucide-react';
import styles from './AdminStats.module.css';

export function TeamSizeCard({ count, activeCount }: { count: number; activeCount: number }) {
    return (
        <Card variant="default" className={styles.card}>
            <CardBody className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                    <Users size={16} color="var(--color-primary-500)" />
                    EQUIPE
                </div>
                <div className={styles.summaryValue} style={{ color: 'var(--color-primary-500)' }}>
                    {count}
                </div>
                <div className={styles.summarySubtext}>
                    {activeCount} ativos agora
                </div>
            </CardBody>
        </Card>
    );
}

export function AvgWorkloadCard({ hours }: { hours: number }) {
    const status = hours <= 6 ? 'Leve' : hours <= 8 ? 'Normal' : 'Alto';
    const color = hours <= 6 ? 'var(--color-success-500)' : hours <= 8 ? 'var(--color-warning-500)' : 'var(--color-error-500)';

    return (
        <Card variant="default" className={styles.card}>
            <CardBody className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                    <Clock size={16} color={color} />
                    CARGA MÉDIA
                </div>
                <div className={styles.summaryValue} style={{ color }}>
                    {hours}h
                </div>
                <div className={styles.summarySubtext}>
                    por dia • {status}
                </div>
            </CardBody>
        </Card>
    );
}

export function GoalsMetCard({ percentage }: { percentage: number }) {
    const color = percentage >= 80 ? 'var(--color-success-500)' : percentage >= 60 ? 'var(--color-warning-500)' : 'var(--color-error-500)';

    return (
        <Card variant="default" className={styles.card}>
            <CardBody className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                    <Target size={16} color={color} />
                    METAS ATINGIDAS
                </div>
                <div className={styles.summaryValue} style={{ color }}>
                    {percentage}%
                </div>
                <div className={styles.summarySubtext}>
                    este mês
                </div>
            </CardBody>
        </Card>
    );
}

export function EfficiencyCard({ score }: { score: number }) {
    const color = score >= 90 ? 'var(--color-success-500)' : score >= 75 ? 'var(--color-warning-500)' : 'var(--color-error-500)';
    const label = score >= 90 ? 'Excelente' : score >= 75 ? 'Bom' : 'Precisa melhorar';

    return (
        <Card variant="default" className={styles.card}>
            <CardBody className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                    <Zap size={16} color={color} />
                    EFICIÊNCIA
                </div>
                <div className={styles.summaryValue} style={{ color }}>
                    {score}%
                </div>
                <div className={styles.summarySubtext}>
                    {label}
                </div>
            </CardBody>
        </Card>
    );
}
