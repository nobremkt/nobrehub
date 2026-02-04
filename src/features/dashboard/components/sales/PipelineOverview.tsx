import { Card, CardBody } from '@/design-system';
import { Layers, ChevronRight } from 'lucide-react';
import styles from './SalesStats.module.css';

interface PipelineStage {
    name: string;
    count: number;
    value: number;
}

interface PipelineOverviewProps {
    stages: PipelineStage[];
}

const STAGE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#10b981'];

export function PipelineOverview({ stages }: PipelineOverviewProps) {
    const totalValue = stages.reduce((sum, s) => sum + s.value, 0);
    const totalLeads = stages.reduce((sum, s) => sum + s.count, 0);

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Layers size={16} color="var(--color-primary-500)" />
                    PIPELINE POR ETAPA
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                        R$ {(totalValue / 1000).toFixed(0)}k total
                    </span>
                </div>

                {/* Pipeline flow visualization */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 0',
                    marginBottom: '0.75rem'
                }}>
                    {stages.map((stage, index) => {
                        const widthPercent = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
                        return (
                            <div
                                key={index}
                                style={{
                                    flex: Math.max(widthPercent, 10), // min 10% for visibility
                                    height: '8px',
                                    background: STAGE_COLORS[index % STAGE_COLORS.length],
                                    borderRadius: index === 0 ? '4px 0 0 4px' : index === stages.length - 1 ? '0 4px 4px 0' : '0'
                                }}
                            />
                        );
                    })}
                </div>

                {/* Stage details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {stages.map((stage, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: `3px solid ${STAGE_COLORS[index % STAGE_COLORS.length]}`
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                    {stage.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    {stage.count} leads
                                </div>
                            </div>
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                color: 'var(--color-success-500)'
                            }}>
                                R$ {stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </div>
                            {index < stages.length - 1 && (
                                <ChevronRight size={14} color="var(--color-text-muted)" />
                            )}
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}
