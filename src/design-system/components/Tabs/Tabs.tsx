import React, { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import styles from './Tabs.module.css';

/* ═══════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface TabItem {
    /** Unique value for this tab */
    value: string;
    /** Display label */
    label: string;
    /** Optional icon */
    icon?: React.ReactNode;
    /** Optional badge count */
    badge?: number;
    /** Whether the tab is disabled */
    disabled?: boolean;
}

export interface TabsProps {
    /** Currently selected tab value */
    value: string;
    /** Callback when tab changes */
    onChange: (value: string) => void;
    /** Tab items */
    items: TabItem[];
    /** Visual variant */
    variant?: 'underline' | 'pills' | 'enclosed';
    /** Size */
    size?: 'sm' | 'md' | 'lg';
    /** Whether tabs should fill the container */
    fullWidth?: boolean;
    /** Custom class */
    className?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export const Tabs: React.FC<TabsProps> = ({
    value,
    onChange,
    items,
    variant = 'underline',
    size = 'md',
    fullWidth = false,
    className,
}) => {
    const tabsRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

    const updateIndicator = useCallback(() => {
        if (!tabsRef.current || variant !== 'underline') return;
        const activeTab = tabsRef.current.querySelector(`[data-value="${value}"]`) as HTMLElement;
        if (activeTab) {
            setIndicatorStyle({
                left: activeTab.offsetLeft,
                width: activeTab.offsetWidth,
            });
        }
    }, [value, variant]);

    useEffect(() => {
        updateIndicator();
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);

    return (
        <div
            ref={tabsRef}
            className={clsx(
                styles.tabs,
                styles[variant],
                styles[size],
                { [styles.fullWidth]: fullWidth },
                className
            )}
            role="tablist"
        >
            {items.map((item) => (
                <button
                    key={item.value}
                    data-value={item.value}
                    role="tab"
                    aria-selected={value === item.value}
                    className={clsx(
                        styles.tab,
                        {
                            [styles.active]: value === item.value,
                            [styles.disabled]: item.disabled,
                        }
                    )}
                    onClick={() => !item.disabled && onChange(item.value)}
                    disabled={item.disabled}
                    type="button"
                >
                    {item.icon && <span className={styles.icon}>{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                        <span className={styles.badge}>{item.badge}</span>
                    )}
                </button>
            ))}
            {variant === 'underline' && (
                <div className={styles.indicator} style={indicatorStyle} />
            )}
        </div>
    );
};

Tabs.displayName = 'Tabs';
