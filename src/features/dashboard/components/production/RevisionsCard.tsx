import { Card, CardBody } from '@/design-system';
import { RotateCcw } from 'lucide-react';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

export function RevisionsCard() {
    const { metrics } = useDashboardStore();
    const count = metrics?.pendingRevisions ?? 0;

    return (
        <Card variant="default" className={`${styles.card} ${styles.revisionsArea}`}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <RotateCcw size={16} color="var(--color-primary-500)" />
                    ALTERAÇÕES
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>alterações</div>
            </CardBody>
        </Card>
    );
}

