import React from 'react';
import clsx from 'clsx';
import styles from './ProgressBar.module.css';

/* ═══════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface ProgressBarProps {
    /** Current value */
    value: number;
    /** Maximum value */
    max?: number;
    /** Color variant */
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    /** Size */
    size?: 'sm' | 'md' | 'lg';
    /** Show percentage label */
    showLabel?: boolean;
    /** Custom label (overrides percentage) */
    label?: string;
    /** Animate fill on mount */
    animated?: boolean;
    /** Striped pattern */
    striped?: boolean;
    /** Custom class */
    className?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    variant = 'primary',
    size = 'md',
    showLabel = false,
    label,
    animated = true,
    striped = false,
    className,
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const displayLabel = label ?? `${Math.round(percentage)}%`;

    return (
        <div className={clsx(styles.wrapper, className)}>
            {showLabel && (
                <div className={styles.labelRow}>
                    <span className={styles.label}>{displayLabel}</span>
                    {!label && (
                        <span className={styles.values}>
                            {value} / {max}
                        </span>
                    )}
                </div>
            )}
            <div
                className={clsx(styles.track, styles[size])}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
            >
                <div
                    className={clsx(
                        styles.fill,
                        styles[variant],
                        { [styles.animated]: animated, [styles.striped]: striped }
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

ProgressBar.displayName = 'ProgressBar';
