/**
 * Post Tracker Component - Calendar Style
 */

import { useEffect, useMemo } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { useSocialMediaStore } from '../../stores/useSocialMediaStore';
import styles from './PostTracker.module.css';

interface PostTrackerProps {
    clientId: string;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Get all days in a month as a calendar grid (including padding for alignment)
const getMonthCalendarDays = (year: number, month: number, validDays: Date[]): (Date | null)[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];

    // Add padding for days before the 1st
    for (let i = 0; i < startPadding; i++) {
        days.push(null);
    }

    // Add actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(year, month, d);
        date.setHours(0, 0, 0, 0);
        // Only include if it's within the valid range
        const isValid = validDays.some(vd => {
            const validDate = new Date(vd);
            validDate.setHours(0, 0, 0, 0);
            return validDate.getTime() === date.getTime();
        });
        days.push(isValid ? date : null);
    }

    return days;
};

// Generate all days between start and end dates
const generateDays = (start: Date, end: Date): Date[] => {
    const days: Date[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    while (current <= endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return days;
};

// Group days by month
const getUniqueMonths = (days: Date[]): { year: number; month: number; label: string }[] => {
    const seen = new Set<string>();
    const months: { year: number; month: number; label: string }[] = [];

    days.forEach(day => {
        const key = `${day.getFullYear()}-${day.getMonth()}`;
        if (!seen.has(key)) {
            seen.add(key);
            const label = day.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            months.push({ year: day.getFullYear(), month: day.getMonth(), label });
        }
    });

    return months;
};

export const PostTracker = ({ clientId }: PostTrackerProps) => {
    const { clients, subscribeToClientPosts, getClientPosts, createPost, updatePostStatus } = useSocialMediaStore();

    const client = clients.find(c => c.id === clientId);
    const clientPosts = getClientPosts(clientId);

    useEffect(() => {
        subscribeToClientPosts(clientId);
    }, [clientId, subscribeToClientPosts]);

    const { days, months } = useMemo(() => {
        if (!client) return { days: [] as Date[], months: [] };
        const endDate = client.contractEndDate || (() => {
            const end = new Date(client.postStartDate);
            end.setMonth(end.getMonth() + client.planDuration);
            return end;
        })();
        const allDays = generateDays(client.postStartDate, endDate);
        return {
            days: allDays,
            months: getUniqueMonths(allDays),
        };
    }, [client]);

    const getPostForDay = (day: Date) => {
        return clientPosts.find(p => {
            const pDate = new Date(p.scheduledDate);
            return pDate.toDateString() === day.toDateString();
        });
    };

    const handleDayClick = async (day: Date) => {
        const existingPost = getPostForDay(day);
        if (existingPost) {
            const nextStatus = existingPost.status === 'pending' ? 'completed'
                : existingPost.status === 'completed' ? 'missed' : 'pending';
            await updatePostStatus(clientId, existingPost.id, nextStatus);
        } else {
            await createPost(clientId, day);
        }
    };

    if (!client) return null;

    const completedCount = clientPosts.filter(p => p.status === 'completed').length;
    const missedCount = clientPosts.filter(p => p.status === 'missed').length;
    const totalDays = days.length;
    const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <Calendar size={20} />
                    <h3>Acompanhamento de Postagens</h3>
                    <span className={styles.clientBadge}>{client.clientName}</span>
                </div>

                {/* Stats Bar */}
                <div className={styles.statsBar}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{completedCount}</span>
                        <span className={styles.statLabel}>Concluídas</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={`${styles.statValue} ${styles.missed}`}>{missedCount}</span>
                        <span className={styles.statLabel}>Perdidas</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{totalDays - completedCount - missedCount}</span>
                        <span className={styles.statLabel}>Pendentes</span>
                    </div>
                    <div className={styles.progressWrapper}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className={styles.progressText}>{progressPercent}%</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.upcomingDot}`} />
                    <span>Próximo</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.pendingDot}`} />
                    <span>Pendente</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.completedDot}`} />
                    <span>Concluída</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.missedDot}`} />
                    <span>Perdida</span>
                </div>
            </div>

            {/* Calendar Months */}
            <div className={styles.calendarsWrapper}>
                {months.map(({ year, month, label }) => {
                    const calendarDays = getMonthCalendarDays(year, month, days);

                    return (
                        <div key={`${year}-${month}`} className={styles.monthCard}>
                            <div className={styles.monthHeader}>{label}</div>

                            {/* Weekday Headers */}
                            <div className={styles.weekdayRow}>
                                {WEEKDAYS.map(wd => (
                                    <div key={wd} className={styles.weekdayCell}>{wd}</div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className={styles.calendarGrid}>
                                {calendarDays.map((day, idx) => {
                                    if (!day) {
                                        return <div key={`empty-${idx}`} className={styles.emptyCell} />;
                                    }

                                    const post = getPostForDay(day);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isToday = today.toDateString() === day.toDateString();
                                    const isFuture = day > today;
                                    const dayOfWeek = day.getDay();
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                    // Determine status class
                                    let statusClass = styles.pending;
                                    if (post) {
                                        statusClass = styles[post.status];
                                    } else if (isFuture) {
                                        statusClass = styles.upcoming;
                                    }

                                    return (
                                        <button
                                            key={day.toISOString()}
                                            className={`
                                                ${styles.dayCell}
                                                ${statusClass}
                                                ${isToday ? styles.today : ''}
                                                ${isWeekend ? styles.weekend : ''}
                                            `}
                                            onClick={() => handleDayClick(day)}
                                            title={`${day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })} - ${post?.status === 'completed' ? 'Concluída' : post?.status === 'missed' ? 'Perdida' : isFuture ? 'Próximo' : 'Pendente'}`}
                                        >
                                            <span className={styles.dayNumber}>{day.getDate()}</span>
                                            {post?.status === 'completed' && <Check size={12} className={styles.statusIcon} />}
                                            {post?.status === 'missed' && <X size={12} className={styles.statusIcon} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
