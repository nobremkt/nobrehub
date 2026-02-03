import { Card, CardBody } from '@/design-system';
import { Folder } from 'lucide-react';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

export function ProjectsSummaryCard() {
    const { metrics } = useDashboardStore();
    const count = metrics?.totalActiveProjects ?? 0;

    return (
        <Card variant="default" className={`${styles.card} ${styles.projectsArea}`}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <Folder size={16} color="var(--color-warning-500)" />
                    PROJETOS
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>projetos</div>
            </CardBody>
        </Card>
    );
}

