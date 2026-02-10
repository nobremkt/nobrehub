/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COLLABORATOR PROFILE MODAL - Premium Profile Viewer
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Modal de visualização de perfil de colaborador com sistema de abas.
 * Design premium com glassmorphism e gradientes.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Modal, Spinner } from '@/design-system';
import { Collaborator } from '@/features/settings/types';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';
import { HolidaysService } from '@/features/settings/services/holidaysService';
import { useGoalProgress } from '@/features/settings/hooks/useGoalProgress';
import type { GoalProgress } from '@/features/settings/services/goalTrackingService';
import { formatPhone } from '@/utils';
import { getFirestoreDb } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
    Mail,
    Phone,
    Building2,
    Calendar,
    Briefcase,
    Target,
    User,
    Trophy,
    Check,
    X as XIcon,
    BarChart3,
    TrendingUp,
    DollarSign,
    Users,
    Clock,
    Percent
} from 'lucide-react';
import styles from './CollaboratorProfileModal.module.css';

export interface CollaboratorProfileModalProps {
    /** Colaborador a ser exibido */
    collaborator: Collaborator | null;
    /** Se o modal está aberto */
    isOpen: boolean;
    /** Callback para fechar o modal */
    onClose: () => void;
    /** Nome do setor do colaborador */
    sectorName?: string;
    /** Nome do cargo do colaborador */
    roleName?: string;
}

type TabType = 'info' | 'metas' | 'metricas';
type GoalPeriod = 'dia' | 'semana' | 'mes' | '3meses';

// Sector IDs
const SECTOR_IDS = {
    PRODUCAO: '7OhlXcRc8Vih9n7p4PdZ',
    POS_VENDAS: '2OByfKttFYPi5Cxbcs2t',
    VENDAS: 'vQIAMfIXt1xKWXHG2Scq',
    ESTRATEGICO: 'zeekJ4iY9voX3AURpar5',
    GERENCIA: 'YIK77HEH6qESkWzVYvXK'
};

interface CollaboratorMetrics {
    // Production
    points: number;
    projectsFinished: number;
    approvalRate: number;
    avgDeliveryDays: number;
    // Sales
    totalSold: number;
    leadsConverted: number;
    conversionRate: number;
    avgTicket: number;
    // Post-Sales
    clientsAttended: number;
    completedProjects: number;
}

function useCollaboratorMetrics(collaboratorId: string | undefined, sectorId: string | undefined, isActive: boolean) {
    const [metrics, setMetrics] = useState<CollaboratorMetrics | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchMetrics = useCallback(async () => {
        if (!collaboratorId || !sectorId || !isActive) return;
        setLoading(true);
        try {
            const db = getFirestoreDb();
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            if (sectorId === SECTOR_IDS.PRODUCAO) {
                const snapshot = await getDocs(collection(db, 'production_projects'));
                let points = 0, delivered = 0, alteracoes = 0, totalDays = 0, deliveryCount = 0;

                snapshot.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.producerId !== collaboratorId) return;
                    const deliveredAt = d.deliveredAt?.toDate?.() || (d.deliveredAt ? new Date(d.deliveredAt) : null);
                    const createdAt = d.createdAt?.toDate?.() || (d.createdAt ? new Date(d.createdAt) : null);
                    const isAlt = d.type === 'alteracao' || d.status === 'alteracao';
                    if (!deliveredAt || deliveredAt < monthStart || deliveredAt > monthEnd) return;
                    if (isAlt) { alteracoes++; return; }
                    delivered++;
                    points += Number(d.points) || 1;
                    if (createdAt) {
                        totalDays += Math.max(0, Math.ceil((deliveredAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                        deliveryCount++;
                    }
                });

                const total = delivered + alteracoes;
                setMetrics({
                    points,
                    projectsFinished: delivered,
                    approvalRate: total > 0 ? Math.round((delivered / total) * 100) : 100,
                    avgDeliveryDays: deliveryCount > 0 ? Math.round((totalDays / deliveryCount) * 10) / 10 : 0,
                    totalSold: 0, leadsConverted: 0, conversionRate: 0, avgTicket: 0,
                    clientsAttended: 0, completedProjects: 0,
                });
            } else if (sectorId === SECTOR_IDS.VENDAS) {
                const snapshot = await getDocs(collection(db, 'leads'));
                let totalSold = 0, closed = 0, lost = 0;
                const closedStatuses = ['won', 'closed', 'contracted'];
                const lostStatuses = ['lost', 'churned'];

                snapshot.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.responsibleId !== collaboratorId) return;
                    const createdAt = d.createdAt?.toDate?.() || (d.createdAt ? new Date(d.createdAt) : null);
                    if (!createdAt || createdAt < monthStart || createdAt > monthEnd) return;
                    if (closedStatuses.includes(d.status)) {
                        closed++;
                        totalSold += d.estimatedValue || 0;
                    }
                    if (lostStatuses.includes(d.status)) lost++;
                });

                const totalCompleted = closed + lost;
                setMetrics({
                    points: 0, projectsFinished: 0, approvalRate: 0, avgDeliveryDays: 0,
                    totalSold,
                    leadsConverted: closed,
                    conversionRate: totalCompleted > 0 ? Math.round((closed / totalCompleted) * 100) : 0,
                    avgTicket: closed > 0 ? Math.round(totalSold / closed) : 0,
                    clientsAttended: 0, completedProjects: 0,
                });
            } else if (sectorId === SECTOR_IDS.POS_VENDAS) {
                const leadsSnap = await getDocs(collection(db, 'leads'));
                let clientsAttended = 0, completed = 0;

                leadsSnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.postSalesId !== collaboratorId) return;
                    clientsAttended++;
                    if (d.clientStatus === 'concluido') completed++;
                });

                setMetrics({
                    points: 0, projectsFinished: 0, approvalRate: 0, avgDeliveryDays: 0,
                    totalSold: 0, leadsConverted: 0, conversionRate: 0, avgTicket: 0,
                    clientsAttended,
                    completedProjects: completed,
                });
            }
        } catch (error) {
            console.error('Erro ao buscar métricas do colaborador:', error);
        } finally {
            setLoading(false);
        }
    }, [collaboratorId, sectorId, isActive]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return { metrics, loading };
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

function GoalProgressBars({ collaborator }: { collaborator: Collaborator }) {
    const { progress, loading } = useGoalProgress(
        collaborator.id, collaborator.sectorId, true
    );

    if (loading) {
        return (
            <div className={styles.goalProgressSection}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-4)' }}>
                    <Spinner size="sm" />
                </div>
            </div>
        );
    }

    if (!progress || progress.goals.length === 0 || progress.goals.every((g: GoalProgress) => g.target === 0)) {
        return (
            <div className={styles.goalProgressSection}>
                <h4 className={styles.goalProgressTitle}>Progresso de Metas</h4>
                <div className={styles.noGoalsMessage}>
                    <Target size={24} />
                    <span>Metas não configuradas para este setor.</span>
                    <span style={{ fontSize: '0.75rem' }}>Configure em Administração → Metas</span>
                </div>
            </div>
        );
    }

    const color = progress.overallPercentage >= 100
        ? 'var(--color-success-500)'
        : progress.overallPercentage >= 60
            ? 'var(--color-warning-500)'
            : 'var(--color-primary-500)';

    return (
        <div className={styles.goalProgressSection}>
            <h4 className={styles.goalProgressTitle}>Progresso de Metas — {progress.sectorLabel}</h4>

            {/* Overall percentage */}
            <div className={styles.goalOverallCard}>
                <div className={styles.goalOverallPercentage} style={{ color }}>
                    {progress.overallPercentage}%
                </div>
                <div className={styles.goalOverallLabel}>
                    Progresso geral do mês
                </div>
            </div>

            {/* Individual goals */}
            <div className={styles.goalProgressList}>
                {progress.goals.filter((g: GoalProgress) => g.target > 0).map((goal: GoalProgress) => {
                    const barWidth = Math.min(goal.percentage, 100);
                    const isComplete = goal.percentage >= 100;
                    const formatValue = (value: number, unit: string) => {
                        if (unit === 'R$') return `R$ ${value.toLocaleString('pt-BR')}`;
                        if (unit === '%') return `${value}%`;
                        return `${value}`;
                    };
                    return (
                        <div key={goal.label} className={styles.goalProgressItem}>
                            <div className={styles.goalProgressHeader}>
                                <span className={styles.goalProgressLabel}>{goal.label}</span>
                                <span className={styles.goalProgressValues}>
                                    {formatValue(goal.actual, goal.unit)} / {formatValue(goal.target, goal.unit)}
                                </span>
                            </div>
                            <div className={styles.goalProgressBarBg}>
                                <div
                                    className={`${styles.goalProgressBarFill} ${isComplete ? styles.success : ''}`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MetricsTabContent({ collaborator }: { collaborator: Collaborator }) {
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

const LIDER_ROLE_ID = '2Qb0NHjub0kaYFYDITqQ';

interface DayData {
    date: Date;
    achieved: boolean;
    isFuture: boolean;
    dayOfWeek: string;
    dayNumber: number;
    monthName: string;
}

interface WeekData {
    weekLabel: string;
    days: DayData[];
}

// Nome dos dias da semana
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Check if a date is a working day (Mon-Fri, not a holiday)
 */
const isWorkingDay = (date: Date, holidayDates: Set<string>): boolean => {
    const dayOfWeek = date.getDay();
    // Weekend check: 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    // Holiday check
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return !holidayDates.has(dateStr);
};

/**
 * Get the Monday of the week for a given date
 */
const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Get Friday of the week for a given date
 */
const getFriday = (date: Date): Date => {
    const monday = getMonday(date);
    monday.setDate(monday.getDate() + 4);
    return monday;
};

/**
 * Generate mock goal history - properly structured (includes future days)
 */
const generateMockGoalHistory = (
    collaboratorId: string,
    period: GoalPeriod,
    holidayDates: Set<string>
): WeekData[] => {
    const hash = collaboratorId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate: Date;

    switch (period) {
        case 'dia': {
            // Just today
            startDate = new Date(today);
            endDate = new Date(today);
            break;
        }
        case 'semana': {
            // Monday to Friday of current week
            startDate = getMonday(today);
            endDate = getFriday(today);
            break;
        }
        case 'mes': {
            // First day to last day of current month
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month
            break;
        }
        case '3meses': {
            // First day of 3 months ago to last day of current month
            startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        }
    }

    // Collect all working days from startDate to endDate
    const allDays: DayData[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        if (isWorkingDay(current, holidayDates)) {
            const isFuture = current > today;
            const dayHash = hash + current.getDate() + current.getMonth();
            // For future days, achieved is always false (pending)
            const achieved = isFuture ? false : dayHash % 10 >= 3;

            allDays.push({
                date: new Date(current),
                achieved,
                isFuture,
                dayOfWeek: DAY_NAMES[current.getDay()],
                dayNumber: current.getDate(),
                monthName: MONTH_NAMES[current.getMonth()]
            });
        }
        current.setDate(current.getDate() + 1);
    }

    // Group by week (for month and 3-month views) or single group (for today/week)
    if (period === 'dia' || period === 'semana') {
        // Single group - just the current period
        const label = period === 'dia'
            ? 'Hoje'
            : `${startDate.getDate()} - ${Math.min(today.getDate(), getMonday(today).getDate() + 4)} ${MONTH_NAMES[today.getMonth()]}`;

        return allDays.length > 0 ? [{
            weekLabel: label,
            days: allDays
        }] : [];
    }

    // For month and 3-month views, group by week
    const weeks: WeekData[] = [];
    let currentWeekDays: DayData[] = [];
    let currentWeekMonday: Date | null = null;

    allDays.forEach((day) => {
        const dayMonday = getMonday(day.date);

        if (!currentWeekMonday || dayMonday.getTime() !== currentWeekMonday.getTime()) {
            // Save previous week if exists
            if (currentWeekDays.length > 0 && currentWeekMonday) {
                const firstDay = currentWeekDays[0];
                const lastDay = currentWeekDays[currentWeekDays.length - 1];

                let weekLabel: string;
                if (firstDay.date.getMonth() === lastDay.date.getMonth()) {
                    weekLabel = `${firstDay.dayNumber} - ${lastDay.dayNumber} ${MONTH_NAMES[lastDay.date.getMonth()]}`;
                } else {
                    weekLabel = `${firstDay.dayNumber} ${firstDay.monthName} - ${lastDay.dayNumber} ${lastDay.monthName}`;
                }

                weeks.push({ weekLabel, days: [...currentWeekDays] });
            }

            // Start new week
            currentWeekMonday = dayMonday;
            currentWeekDays = [day];
        } else {
            currentWeekDays.push(day);
        }
    });

    // Don't forget the last week
    if (currentWeekDays.length > 0) {
        const firstDay = currentWeekDays[0];
        const lastDay = currentWeekDays[currentWeekDays.length - 1];

        let weekLabel: string;
        if (firstDay.date.getMonth() === lastDay.date.getMonth()) {
            weekLabel = `${firstDay.dayNumber} - ${lastDay.dayNumber} ${MONTH_NAMES[lastDay.date.getMonth()]}`;
        } else {
            weekLabel = `${firstDay.dayNumber} ${firstDay.monthName} - ${lastDay.dayNumber} ${lastDay.monthName}`;
        }

        weeks.push({ weekLabel, days: [...currentWeekDays] });
    }

    return weeks;
};

// Calcular estatísticas de metas
const calculateGoalStats = (weeks: WeekData[]) => {
    const allDays = weeks.flatMap(w => w.days);
    const achieved = allDays.filter(d => d.achieved).length;
    const total = allDays.length;
    const percentage = total > 0 ? Math.round((achieved / total) * 100) : 0;

    // Calcular streak atual
    let streak = 0;
    for (let i = allDays.length - 1; i >= 0; i--) {
        if (allDays[i].achieved) {
            streak++;
        } else {
            break;
        }
    }

    return { achieved, total, percentage, streak };
};

export const CollaboratorProfileModal: React.FC<CollaboratorProfileModalProps> = ({
    collaborator,
    isOpen,
    onClose,
    sectorName,
    roleName,
}) => {
    const teamStatus = useTeamStatus();
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>('semana');
    const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());

    // Reset to info tab when collaborator changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab('info');
        }
    }, [isOpen, collaborator?.id]);

    // Load holidays when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const loadHolidays = async () => {
            try {
                const currentYear = new Date().getFullYear();
                // Load holidays for current year and previous year (for 3-month view)
                const [currentYearHolidays, prevYearHolidays] = await Promise.all([
                    HolidaysService.getAllHolidays(currentYear),
                    HolidaysService.getAllHolidays(currentYear - 1)
                ]);

                const dates = new Set<string>();
                [...currentYearHolidays, ...prevYearHolidays].forEach(h => {
                    dates.add(h.date);
                });
                setHolidayDates(dates);
            } catch (error) {
                console.error('Error loading holidays:', error);
            }
        };

        loadHolidays();
    }, [isOpen]);

    // Goal history data - hooks must be before early return
    const goalHistory = useMemo(() =>
        collaborator ? generateMockGoalHistory(collaborator.id, goalPeriod, holidayDates) : [],
        [collaborator?.id, goalPeriod, holidayDates]
    );

    const goalStats = useMemo(() =>
        calculateGoalStats(goalHistory),
        [goalHistory]
    );

    if (!collaborator) return null;

    const userStatus = collaborator.authUid
        ? teamStatus[collaborator.authUid]?.state
        : 'offline';
    const isOnline = userStatus === 'online';

    // Calcular tempo na empresa
    const joinDate = new Date(collaborator.createdAt);
    const now = new Date();
    const months = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const timeInCompany = months < 12
        ? `${months} meses`
        : `${Math.floor(months / 12)} ano${Math.floor(months / 12) > 1 ? 's' : ''} e ${months % 12} meses`;

    const imageUrl = collaborator.photoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(collaborator.name)}&background=dc2626&color=fff&size=256`;

    // Determine which tabs to show based on sector/role
    const isGerenciaOrLider = (
        collaborator.sectorId === SECTOR_IDS.GERENCIA ||
        collaborator.roleId === LIDER_ROLE_ID
    );

    const isEstrategico = collaborator.sectorId === SECTOR_IDS.ESTRATEGICO;

    // Metas tab: NOT for Gerência, Estratégico, or Líder
    const showMetasTab = !isGerenciaOrLider && !isEstrategico;

    // Métricas tab: for Produção, Vendas, Pós-vendas, Estratégico (not Gerência or Líder)
    const showMetricasTab = (
        collaborator.sectorId === SECTOR_IDS.PRODUCAO ||
        collaborator.sectorId === SECTOR_IDS.VENDAS ||
        collaborator.sectorId === SECTOR_IDS.POS_VENDAS ||
        collaborator.sectorId === SECTOR_IDS.ESTRATEGICO
    );

    const tabs = [
        { id: 'info' as TabType, label: 'Informações', icon: User },
        ...(showMetasTab ? [{ id: 'metas' as TabType, label: 'Metas', icon: Target }] : []),
        ...(showMetricasTab ? [{ id: 'metricas' as TabType, label: 'Métricas', icon: BarChart3 }] : [])
    ];

    const periodFilters = [
        { id: 'dia' as GoalPeriod, label: 'Hoje' },
        { id: 'semana' as GoalPeriod, label: 'Semana' },
        { id: 'mes' as GoalPeriod, label: 'Mês' },
        { id: '3meses' as GoalPeriod, label: '3 Meses' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xxl"
            hideCloseButton={true}
        >
            <div className={styles.container}>
                {/* Hero Header */}
                <div className={styles.hero}>
                    <div className={styles.heroBackground} style={{ backgroundImage: `url(${imageUrl})` }} />
                    <div className={styles.heroOverlay} />

                    {/* Close Button */}
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        <XIcon size={24} />
                    </button>

                    <div className={styles.heroContent}>
                        <div className={styles.avatarContainer}>
                            <img
                                src={imageUrl}
                                alt={collaborator.name}
                                className={styles.avatar}
                            />
                            <div className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`} />
                        </div>

                        <div className={styles.heroInfo}>
                            <h1 className={styles.name}>{collaborator.name}</h1>
                            <p className={styles.role}>{roleName || 'Sem cargo definido'}</p>
                            <div className={styles.badges}>
                                {sectorName && (
                                    <span className={styles.sectorBadge}>
                                        <Building2 size={14} />
                                        {sectorName}
                                    </span>
                                )}
                                <span className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
                                    <span className={styles.statusIndicator} />
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className={styles.tabsContainer}>
                    <div className={styles.tabs}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Tab: Informações */}
                    {activeTab === 'info' && (
                        <div className={styles.infoSection}>
                            <div className={styles.infoGrid}>
                                {collaborator.email && (
                                    <div className={styles.infoItem}>
                                        <Mail size={18} className={styles.infoIcon} />
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>Email</span>
                                            <span className={styles.infoValue}>{collaborator.email}</span>
                                        </div>
                                    </div>
                                )}

                                {collaborator.phone && (
                                    <div className={styles.infoItem}>
                                        <Phone size={18} className={styles.infoIcon} />
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>Telefone</span>
                                            <span className={styles.infoValue}>{formatPhone(collaborator.phone)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className={styles.infoItem}>
                                    <Calendar size={18} className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Na empresa</span>
                                        <span className={styles.infoValue}>{timeInCompany}</span>
                                    </div>
                                </div>

                                <div className={styles.infoItem}>
                                    <Briefcase size={18} className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Cargo</span>
                                        <span className={styles.infoValue}>{roleName || 'Não definido'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Metas */}
                    {activeTab === 'metas' && (
                        <div className={styles.goalsSection}>
                            {/* Period Filters */}
                            <div className={styles.periodFilters}>
                                {periodFilters.map((filter) => (
                                    <button
                                        key={filter.id}
                                        className={`${styles.periodButton} ${goalPeriod === filter.id ? styles.periodActive : ''}`}
                                        onClick={() => setGoalPeriod(filter.id)}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            {/* Stats Cards */}
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>
                                        <Trophy size={24} />
                                    </div>
                                    <div className={styles.statValue}>{goalStats.percentage}%</div>
                                    <div className={styles.statLabel}>Taxa de Batimento</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>
                                        <Check size={24} />
                                    </div>
                                    <div className={styles.statValue}>{goalStats.achieved}/{goalStats.total}</div>
                                    <div className={styles.statLabel}>Dias com Meta</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={`${styles.statIcon} ${styles.streakIcon}`}>
                                        🔥
                                    </div>
                                    <div className={styles.statValue}>{goalStats.streak}</div>
                                    <div className={styles.statLabel}>Streak Atual</div>
                                </div>
                            </div>

                            {/* Goal History */}
                            <div className={styles.historySection}>
                                <h4 className={styles.historyTitle}>Histórico</h4>

                                {goalPeriod === 'dia' ? (
                                    // Single Day View
                                    <div className={styles.singleDayView}>
                                        {goalHistory[0]?.days[0] && (
                                            <div className={`${styles.dayCard} ${goalHistory[0].days[0].achieved ? styles.dayAchieved : styles.dayMissed}`}>
                                                <div className={styles.dayIcon}>
                                                    {goalHistory[0].days[0].achieved ? (
                                                        <Check size={48} />
                                                    ) : (
                                                        <XIcon size={48} />
                                                    )}
                                                </div>
                                                <div className={styles.dayStatus}>
                                                    {goalHistory[0].days[0].achieved ? 'Meta Batida!' : 'Meta Não Batida'}
                                                </div>
                                                <div className={styles.dayDate}>Hoje</div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Week-by-Week Calendar View
                                    <div className={styles.weeksContainer}>
                                        {goalHistory.map((week, weekIndex) => (
                                            <div key={weekIndex} className={styles.weekRow}>
                                                <div className={styles.weekLabel}>{week.weekLabel}</div>
                                                <div className={styles.weekDays}>
                                                    {week.days.map((day, dayIndex) => (
                                                        <div
                                                            key={dayIndex}
                                                            className={`${styles.calendarDay} ${day.isFuture
                                                                ? styles.future
                                                                : day.achieved
                                                                    ? styles.achieved
                                                                    : styles.missed
                                                                }`}
                                                        >
                                                            <span className={styles.dayName}>{day.dayOfWeek}</span>
                                                            <span className={styles.dayNum}>{day.dayNumber}</span>
                                                            <div className={styles.dayIndicator}>
                                                                {day.isFuture ? (
                                                                    <span className={styles.futureIcon}>—</span>
                                                                ) : day.achieved ? (
                                                                    <Check size={16} />
                                                                ) : (
                                                                    <XIcon size={16} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Legend */}
                                <div className={styles.legend}>
                                    <div className={styles.legendItem}>
                                        <span className={`${styles.legendDot} ${styles.achieved}`}></span>
                                        Meta batida
                                    </div>
                                    <div className={styles.legendItem}>
                                        <span className={`${styles.legendDot} ${styles.missed}`}></span>
                                        Meta não batida
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Métricas Tab Content */}
                    {activeTab === 'metricas' && (
                        <MetricsTabContent collaborator={collaborator} />
                    )}
                </div>
            </div>
        </Modal>
    );
};
