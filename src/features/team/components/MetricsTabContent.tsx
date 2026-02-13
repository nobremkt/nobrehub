/**
 * MetricsTabContent — Sub-component for the Métricas tab
 */

import { Spinner } from '@/design-system';
import { Collaborator } from '@/features/settings/types';
import {
    TrendingUp,
    Trophy,
    Percent,
    Clock,
    DollarSign,
    Users,
    Check,
    BarChart3,
} from 'lucide-react';
import styles from './CollaboratorProfileModal.module.css';
import { SECTOR_IDS, formatCurrency } from './profileModal.types';
import { useCollaboratorMetrics } from './useCollaboratorMetrics';
import { GoalProgressBars } from './GoalProgressBars';

export function MetricsTabContent({ collaborator }: { collaborator: Collaborator }) {
    const { metrics, loading } = useCollaboratorMetrics(
        collaborator.id, collaborator.sectorId, true
    );

    if (loading) {
        return (
            <div className={styles.tabContent}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
                    <Spinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.tabContent}>
            <div className={styles.metricsSection}>
                {/* Produção Metrics */}
                {collaborator.sectorId === SECTOR_IDS.PRODUCAO && (
                    <>
                        <h3 className={styles.sectionTitle}>Métricas de Produção</h3>
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{metrics?.points ?? 0}</span>
                                    <span className={styles.metricLabel}>Pontos Este Mês</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <Trophy size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{metrics?.projectsFinished ?? 0}</span>
                                    <span className={styles.metricLabel}>Projetos Finalizados</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <Percent size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{metrics?.approvalRate ?? 0}%</span>
                                    <span className={styles.metricLabel}>Taxa de Aprovação</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <Clock size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{metrics?.avgDeliveryDays ?? 0} dias</span>
                                    <span className={styles.metricLabel}>Tempo Médio</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Vendas Metrics */}
                {collaborator.sectorId === SECTOR_IDS.VENDAS && (
                    <>
                        <h3 className={styles.sectionTitle}>Métricas de Vendas</h3>
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <DollarSign size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{formatCurrency(metrics?.totalSold ?? 0)}</span>
                                    <span className={styles.metricLabel}>Total Vendido</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <Users size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{metrics?.leadsConverted ?? 0}</span>
                                    <span className={styles.metricLabel}>Leads Convertidos</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <Percent size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{metrics?.conversionRate ?? 0}%</span>
                                    <span className={styles.metricLabel}>Taxa de Conversão</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{formatCurrency(metrics?.avgTicket ?? 0)}</span>
                                    <span className={styles.metricLabel}>Ticket Médio</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Pós-vendas Metrics */}
                {collaborator.sectorId === SECTOR_IDS.POS_VENDAS && (
                    <>
                        <h3 className={styles.sectionTitle}>Métricas de Pós-vendas</h3>
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <Users size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{metrics?.clientsAttended ?? 0}</span>
                                    <span className={styles.metricLabel}>Clientes Atendidos</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <Check size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>{metrics?.completedProjects ?? 0}</span>
                                    <span className={styles.metricLabel}>Projetos Concluídos</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <Clock size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>—</span>
                                    <span className={styles.metricLabel}>Tempo Médio Atend.</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <div className={styles.metricIcon}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className={styles.metricInfo}>
                                    <span className={styles.metricValue}>—</span>
                                    <span className={styles.metricLabel}>Taxa de Satisfação</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Estratégico Metrics */}
                {collaborator.sectorId === SECTOR_IDS.ESTRATEGICO && (
                    <>
                        <h3 className={styles.sectionTitle}>Métricas Estratégicas</h3>
                        <div className={styles.comingSoon}>
                            <BarChart3 size={48} />
                            <p>Métricas em desenvolvimento</p>
                            <span>Em breve você poderá visualizar as métricas estratégicas aqui.</span>
                        </div>
                    </>
                )}

                {/* Goal Progress Bars — shown for ALL sectors */}
                <GoalProgressBars collaborator={collaborator} />
            </div>
        </div>
    );
}
