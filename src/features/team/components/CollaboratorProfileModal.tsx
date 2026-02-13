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

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/design-system';
import { Collaborator } from '@/features/settings/types';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';
import { HolidaysService } from '@/features/settings/services/holidaysService';
import { formatPhone } from '@/utils';
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
} from 'lucide-react';
import styles from './CollaboratorProfileModal.module.css';

// ─── Extracted Modules ───────────────────────────────────────────────
import { type TabType, type GoalPeriod, SECTOR_IDS, LIDER_ROLE_ID } from './profileModal.types';
import { generateMockGoalHistory, calculateGoalStats } from './profileModal.helpers';
import { MetricsTabContent } from './MetricsTabContent';

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

    // Goal history data
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
    const showMetasTab = !isGerenciaOrLider && !isEstrategico;

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
