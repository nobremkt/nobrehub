/**
 * GoalProgressBars — Sub-component for goal progress display
 */

import { Spinner } from '@/design-system';
import { Collaborator } from '@/features/settings/types';
import { useGoalProgress } from '@/features/settings/hooks/useGoalProgress';
import type { GoalProgress } from '@/features/settings/services/goalTrackingService';
import { Target } from 'lucide-react';
import styles from './CollaboratorProfileModal.module.css';

export function GoalProgressBars({ collaborator }: { collaborator: Collaborator }) {
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
