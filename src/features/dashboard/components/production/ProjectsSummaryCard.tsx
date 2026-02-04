import { Card, CardBody } from '@/design-system';
import { CheckCircle } from 'lucide-react';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

export function ProjectsSummaryCard() {
    const { metrics } = useDashboardStore();
    // Show delivered projects in the selected period
    const count = metrics?.deliveredProjects ?? 0;

    return (
        <Card variant="default" className={`${styles.card} ${styles.projectsArea}`}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <CheckCircle size={16} color="var(--color-success-500)" />
                    ENTREGUES
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>projetos</div>
            </CardBody>
        </Card>
    );
}

