import { forwardRef, InputHTMLAttributes, useCallback } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';
import { useUISound } from '@/hooks';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    /** Desabilitar sons */
    noSound?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, error, className, id, disabled, checked, onChange, noSound = false, ...props }, ref) => {
        const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
        const { playSound } = useUISound();

        const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            if (!noSound && !disabled) {
                playSound('checkbox');
            }
            onChange?.(e);
        }, [noSound, disabled, playSound, onChange]);

        return (
            <div className={clsx(styles.container, { [styles.disabled]: disabled }, className)}>
                <label className={styles.labelWrapper} htmlFor={checkboxId}>
                    <div className={styles.checkboxWrapper}>
                        <input
                            type="checkbox"
                            id={checkboxId}
                            ref={ref}
                            className={styles.input}
                            disabled={disabled}
                            checked={checked}
                            onChange={handleChange}
                            {...props}
                        />
                        <div className={styles.box}>
                            <Check className={styles.icon} size={14} strokeWidth={3} />
                        </div>
                    </div>
                    {label && <span className={styles.labelText}>{label}</span>}
                </label>
                {error && <span className={styles.errorText}>{error}</span>}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';
