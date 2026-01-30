/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - COMPONENT: SWITCH
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Switches toggle the state of a single setting on or off.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useCallback } from 'react';
import styles from './Switch.module.css';
import { useUISound } from '@/hooks';

export interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
    /** Desabilitar sons */
    noSound?: boolean;
}

export function Switch({
    checked,
    onChange,
    label,
    disabled = false,
    className = '',
    id,
    noSound = false,
}: SwitchProps) {
    const { playSound } = useUISound();

    const handleChange = useCallback((newChecked: boolean) => {
        if (disabled) return;

        if (!noSound) {
            playSound(newChecked ? 'toggle-on' : 'toggle-off');
        }
        onChange(newChecked);
    }, [disabled, noSound, playSound, onChange]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleChange(!checked);
        }
    };

    return (
        <label
            className={`
                ${styles.container} 
                ${checked ? styles.checked : ''} 
                ${disabled ? styles.disabled : ''}
                ${className}
            `}
        >
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => handleChange(e.target.checked)}
                className={`sr-only ${styles.input}`}
                disabled={disabled}
            />
            <div
                className={styles.switch}
                role="presentation"
                tabIndex={-1}
                onKeyDown={handleKeyDown}
            />
            {label && <span className={styles.label}>{label}</span>}
        </label>
    );
}
