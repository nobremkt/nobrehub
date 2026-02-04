import { Card, CardBody } from '@/design-system';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from './StatCard.module.css';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon }: StatCardProps) {
    return (
        <Card variant="elevated" className={styles.statCard}>
            <CardBody className={styles.statBody}>
                <div className={styles.statTop}>
                    <div className={styles.statIcon}>{icon}</div>
                    <span className={styles.statTitle}>{title}</span>
                </div>
                <div className={styles.statBottom}>
                    <span className={styles.statValue}>{value}</span>
                    {change && (
                        <span className={`${styles.statChange} ${styles[changeType]}`}>
                            {changeType === 'positive' && <ArrowUpRight size={14} />}
                            {changeType === 'negative' && <ArrowDownRight size={14} />}
                            {change}
                        </span>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
