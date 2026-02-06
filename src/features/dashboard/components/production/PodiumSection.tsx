import { Card, CardBody } from '@/design-system';
import { Crown, Folder, Rocket, CheckCircle } from 'lucide-react';
import styles from './ProductionStats.module.css';
import { useDashboardStore } from '../../stores/useDashboardStore';

interface PodiumItemProps {
    icon: React.ReactNode;
    title: string;
    name: string;
    stat: string;
    description: string;
    avatarUrl?: string;
    highlightColor: string;
}

function PodiumCard({ icon, title, name, stat, description, highlightColor, avatarUrl }: PodiumItemProps) {
    return (
        <Card variant="elevated" className={styles.podiumCard}>
            <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', padding: '1.5rem 1rem' }}>
                {/* Avatar with Ring */}
                <div style={{ padding: '2px', borderRadius: '50%', border: `2px solid ${highlightColor}` }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{name.charAt(0)}</span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {icon}
                    {title}
                </div>

                {/* Name */}
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                    {name}
                </div>

                {/* Stat */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: highlightColor }}>{stat}</div>
                    {description && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{description}</div>}
                </div>
            </CardBody>
        </Card>
    );
}

export function PodiumSection() {
    const { metrics } = useDashboardStore();

    const topPoints = metrics?.topPointsProducer;
    const topProjects = metrics?.topProjectsProducer;
    const rocket = metrics?.rocketProducer;
    const finisher = metrics?.finisherProducer;

    return (
        <div className={styles.podiumGrid}>
            <PodiumCard
                icon={<Crown size={14} color="#f59e0b" />}
                title="REI DOS PONTOS"
                name={topPoints?.name ?? '—'}
                stat={`${topPoints?.points ?? 0} pts`}
                description=""
                highlightColor="var(--color-warning-500)"
                avatarUrl={topPoints?.profilePhotoUrl}
            />
            <PodiumCard
                icon={<Folder size={14} color="#3b82f6" />}
                title="MAIS PROJETOS"
                name={topProjects?.name ?? '—'}
                stat={`${topProjects?.count ?? 0} proj`}
                description=""
                highlightColor="#3b82f6"
                avatarUrl={topProjects?.profilePhotoUrl}
            />
            <PodiumCard
                icon={<Rocket size={14} color="#f43f5e" />}
                title="FOGUETE"
                name={rocket?.name ?? '—'}
                stat={`${rocket?.points ?? 0} pts`}
                description="em 1 dia"
                highlightColor="#f43f5e"
                avatarUrl={rocket?.profilePhotoUrl}
            />
            <PodiumCard
                icon={<CheckCircle size={14} color="#22c55e" />}
                title="FINALIZADOR"
                name={finisher?.name ?? '—'}
                stat={`${finisher?.count ?? 0} proj`}
                description="em 1 dia"
                highlightColor="#22c55e"
                avatarUrl={finisher?.profilePhotoUrl}
            />
        </div>
    );
}

