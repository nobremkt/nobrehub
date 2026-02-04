import { Card, CardBody } from '@/design-system';
import { Users } from 'lucide-react';
import styles from './AdminStats.module.css';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    sector: string;
    photoUrl?: string;
    isOnline: boolean;
    productivity: number;
}

interface TeamOverviewProps {
    members: TeamMember[];
}

// Generate a consistent color based on name
function getAvatarColor(name: string): string {
    const colors = [
        '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
        '#059669', '#0891b2', '#0284c7', '#2563eb', '#7c3aed',
        '#9333ea', '#c026d3', '#db2777', '#e11d48'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getProductivityColor(value: number): string {
    if (value >= 90) return 'var(--color-success-500)';
    if (value >= 70) return 'var(--color-warning-500)';
    return 'var(--color-error-500)';
}

export function TeamOverview({ members }: TeamOverviewProps) {
    const onlineCount = members.filter(m => m.isOnline).length;

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Users size={16} color="var(--color-primary-500)" />
                    VISÃO DA EQUIPE
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-success-500)' }}>
                        {onlineCount} online
                    </span>
                </div>

                <div className={styles.teamGrid}>
                    {members.map(member => (
                        <div key={member.id} className={styles.memberCard}>
                            {/* Avatar */}
                            <div
                                className={styles.memberAvatar}
                                style={{ background: getAvatarColor(member.name) }}
                            >
                                {member.photoUrl ? (
                                    <img
                                        src={member.photoUrl}
                                        alt={member.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    member.name.charAt(0)
                                )}
                            </div>

                            {/* Info */}
                            <div className={styles.memberInfo}>
                                <div className={styles.memberName}>{member.name}</div>
                                <div className={styles.memberRole}>{member.role}</div>
                                {/* Productivity bar */}
                                <div className={styles.productivityBar} style={{ marginTop: '4px' }}>
                                    <div
                                        className={styles.productivityFill}
                                        style={{
                                            width: `${member.productivity}%`,
                                            background: getProductivityColor(member.productivity)
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Online status */}
                            <div
                                className={`${styles.memberStatus} ${member.isOnline ? styles.statusOnline : styles.statusOffline}`}
                            />
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}
