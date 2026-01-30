/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PAGES: DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { AppLayout } from '@/design-system/layouts';
import { Card, CardHeader, CardBody, Tag, Badge } from '@/design-system';
import { useAuthStore } from '@/stores';
import { TrendingUp, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from './DashboardPage.module.css';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
}

function StatCard({ title, value, change, changeType = 'neutral', icon }: StatCardProps) {
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

export function DashboardPage() {
    const { user } = useAuthStore();

    return (
        <AppLayout notificationCount={3}>
            <div className={styles.dashboard}>
                {/* Welcome */}
                <div className={styles.welcome}>
                    <h1 className={styles.welcomeTitle}>
                        Bem-vindo, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
                    </h1>
                    <p className={styles.welcomeSubtitle}>
                        Aqui está o resumo do seu dia
                    </p>
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <StatCard
                        title="Leads Novos"
                        value={42}
                        change="+12%"
                        changeType="positive"
                        icon={<Users size={20} />}
                    />
                    <StatCard
                        title="Vendas Fechadas"
                        value={8}
                        change="+3"
                        changeType="positive"
                        icon={<DollarSign size={20} />}
                    />
                    <StatCard
                        title="Projetos Ativos"
                        value={15}
                        change="2 para hoje"
                        changeType="neutral"
                        icon={<Package size={20} />}
                    />
                    <StatCard
                        title="Ticket Médio"
                        value="R$ 2.450"
                        change="+8%"
                        changeType="positive"
                        icon={<TrendingUp size={20} />}
                    />
                </div>

                {/* Recent Activity */}
                <Card variant="default" className={styles.activity}>
                    <CardHeader title="Atividade Recente" />
                    <CardBody>
                        <div className={styles.activityList}>
                            <div className={styles.activityItem}>
                                <Badge dot variant="success" />
                                <span className={styles.activityText}>Lead "João Silva" movido para Proposta</span>
                                <Tag variant="default" size="sm">há 5 min</Tag>
                            </div>
                            <div className={styles.activityItem}>
                                <Badge dot variant="primary" />
                                <span className={styles.activityText}>Novo projeto criado para "Maria Santos"</span>
                                <Tag variant="default" size="sm">há 12 min</Tag>
                            </div>
                            <div className={styles.activityItem}>
                                <Badge dot variant="warning" />
                                <span className={styles.activityText}>Revisão solicitada no projeto #142</span>
                                <Tag variant="default" size="sm">há 1 hora</Tag>
                            </div>
                            <div className={styles.activityItem}>
                                <Badge dot variant="danger" />
                                <span className={styles.activityText}>Entrega atrasada: "Campanha Black Friday"</span>
                                <Tag variant="default" size="sm">há 2 horas</Tag>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
