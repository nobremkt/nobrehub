import { Card, CardBody } from '@/design-system';
import { Trophy } from 'lucide-react';
import styles from './ProductionStats.module.css';

const MOCK_PRODUCERS = [
    { name: 'Julia', avatar: null, points: 5 },
    { name: 'Gabriel', avatar: null, points: 4 },
    { name: 'Pâmelah', avatar: null, points: 3 },
    { name: 'Kaua', avatar: null, points: 3 },
    { name: 'Kaua Pessoni', avatar: null, points: 2 },
];

export function TopPerformersCard() {
    return (
        <Card variant="default" className={`${styles.card} ${styles.topArea}`}>
            <CardBody>
                <div className={styles.cardTitle}>
                    <Trophy size={16} />
                    TOP PERFORMERS
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {MOCK_PRODUCERS.map((producer, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            background: index === 0 ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                            border: index === 0 ? '1px solid var(--color-primary-500)' : 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'var(--color-bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: 'var(--color-primary-500)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    {producer.name[0]}
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    {producer.name}
                                </span>
                            </div>
                            <span style={{
                                fontWeight: 'bold',
                                color: index === 0 ? 'var(--color-primary-500)' : 'var(--color-text-muted)'
                            }}>
                                {producer.points} pts
                            </span>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}
