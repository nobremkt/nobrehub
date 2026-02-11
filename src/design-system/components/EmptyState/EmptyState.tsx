import React from 'react';
import clsx from 'clsx';
import styles from './EmptyState.module.css';

/* ═══════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface EmptyStateProps {
    /** Icon element to display */
    icon?: React.ReactNode;
    /** Title text */
    title?: string;
    /** Description / helper text */
    description?: string;
    /** Action element (e.g. a Button) */
    action?: React.ReactNode;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Custom class */
    className?: string;
    /** Custom style */
    style?: React.CSSProperties;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    size = 'md',
    className,
    style,
}) => {
    return (
        <div className={clsx(styles.container, styles[size], className)} style={style}>
            {icon && <div className={styles.icon}>{icon}</div>}
            {title && <h3 className={styles.title}>{title}</h3>}
            {description && <p className={styles.description}>{description}</p>}
            {action && <div className={styles.action}>{action}</div>}
        </div>
    );
};

EmptyState.displayName = 'EmptyState';
