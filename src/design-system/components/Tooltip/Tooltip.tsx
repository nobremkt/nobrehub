import React, { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import styles from './Tooltip.module.css';

/* ═══════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface TooltipProps {
    /** Tooltip content (can be text or JSX) */
    content: React.ReactNode;
    /** Position relative to trigger */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Delay before showing (ms) */
    delay?: number;
    /** The element that triggers the tooltip */
    children: React.ReactElement;
    /** Whether the tooltip is disabled */
    disabled?: boolean;
    /** Max width of the tooltip */
    maxWidth?: number;
    /** Custom class */
    className?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    position = 'top',
    delay = 200,
    children,
    disabled = false,
    maxWidth = 240,
    className,
}) => {
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const show = useCallback(() => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => setVisible(true), delay);
    }, [delay, disabled]);

    const hide = useCallback(() => {
        clearTimeout(timeoutRef.current);
        setVisible(false);
    }, []);

    if (disabled) return <>{children}</>;

    return (
        <span
            className={clsx(styles.wrapper, className)}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {visible && (
                <span
                    className={clsx(styles.tooltip, styles[position])}
                    style={{ maxWidth }}
                    role="tooltip"
                >
                    <span className={styles.content}>{content}</span>
                    <span className={styles.arrow} />
                </span>
            )}
        </span>
    );
};

Tooltip.displayName = 'Tooltip';
