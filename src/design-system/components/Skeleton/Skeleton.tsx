import React from 'react';
import clsx from 'clsx';
import styles from './Skeleton.module.css';

/* ═══════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface SkeletonProps {
    /** Shape variant */
    variant?: 'rect' | 'circle' | 'text';
    /** Width (px or string like '100%') — for rect/text */
    width?: number | string;
    /** Height (px) — for rect */
    height?: number;
    /** Size (px) — for circle (sets both width and height) */
    size?: number;
    /** Number of text lines — for variant="text" */
    lines?: number;
    /** Border radius override */
    borderRadius?: number | string;
    /** Custom class */
    className?: string;
    /** Custom style */
    style?: React.CSSProperties;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'rect',
    width,
    height,
    size,
    lines = 3,
    borderRadius,
    className,
    style,
}) => {
    if (variant === 'text') {
        return (
            <div className={clsx(styles.textWrapper, className)} style={style}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={styles.shimmer}
                        style={{
                            width: i === lines - 1 ? '60%' : '100%',
                            height: 12,
                            borderRadius: borderRadius ?? 'var(--radius-sm)',
                        }}
                    />
                ))}
            </div>
        );
    }

    if (variant === 'circle') {
        const s = size ?? 40;
        return (
            <div
                className={clsx(styles.shimmer, className)}
                style={{
                    width: s,
                    height: s,
                    borderRadius: '50%',
                    ...style,
                }}
            />
        );
    }

    // rect (default)
    return (
        <div
            className={clsx(styles.shimmer, className)}
            style={{
                width: width ?? '100%',
                height: height ?? 20,
                borderRadius: borderRadius ?? 'var(--radius-md)',
                ...style,
            }}
        />
    );
};

Skeleton.displayName = 'Skeleton';
