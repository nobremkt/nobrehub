import { Card, CardBody } from '@/design-system';
import { Users } from 'lucide-react';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

export function ActiveProducersCard() {
    const { metrics } = useDashboardStore();
    const count = metrics?.activeProducers ?? 0;

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <Users size={16} color="var(--color-primary-500)" />
                    PRODUTORES ATIVOS
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>produtores</div>
            </CardBody>
        </Card>
    );
}

