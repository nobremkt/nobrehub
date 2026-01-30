import React, { InputHTMLAttributes, forwardRef, useRef } from 'react';
import clsx from 'clsx';
import { Minus, Plus } from 'lucide-react';
import styles from './NumberInput.module.css';

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
    /** Label of the input */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper text */
    helperText?: string;
    /** Size of the input */
    size?: 'sm' | 'md' | 'lg';
    /** Icon on the left */
    leftIcon?: React.ReactNode;
    /** Whether the input should take full width */
    fullWidth?: boolean;
    /** Callback when value changes */
    onChange?: (value: string) => void;
    /** Step value for increment/decrement */
    step?: number;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
}

/**
 * NumberInput Component
 * 
 * An enhanced input for numerical values with increment/decrement buttons.
 * 
 * @example
 * <NumberInput label="Quantity" value={quantity} onChange={setQuantity} min={0} />
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    (
        {
            label,
            error,
            helperText,
            size = 'md',
            leftIcon,
            fullWidth = false,
            disabled,
            className,
            id,
            value,
            onChange,
            step = 1,
            min,
            max,
            ...props
        },
        ref
    ) => {
        const inputId = id || `number-input-${Math.random().toString(36).substr(2, 9)}`;
        const internalRef = useRef<HTMLInputElement>(null);

        // Combine refs (user provided ref + internal ref)
        const handleRef = (element: HTMLInputElement | null) => {
            (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
            if (typeof ref === 'function') {
                ref(element);
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onChange) {
                onChange(e.target.value);
            }
        };

        const handleIncrement = () => {
            const currentValue = parseFloat(value?.toString() || '0') || 0;
            const newValue = currentValue + (Number(step) || 1);

            if (max !== undefined && newValue > max) return;

            if (onChange) {
                onChange(String(newValue)); // Keep consistent with string value typical of inputs
            }
        };

        const handleDecrement = () => {
            const currentValue = parseFloat(value?.toString() || '0') || 0;
            const newValue = currentValue - (Number(step) || 1);

            if (min !== undefined && newValue < min) return;

            if (onChange) {
                onChange(String(newValue));
            }
        };

        return (
            <div
                className={clsx(
                    styles.wrapper,
                    { [styles.fullWidth]: fullWidth },
                    className
                )}
            >
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                    </label>
                )}
                <div
                    className={clsx(
                        styles.inputContainer,
                        styles[size],
                        {
                            [styles.hasError]: !!error,
                            [styles.disabled]: disabled,
                        }
                    )}
                >
                    {leftIcon && (
                        <span className={styles.leftIcon}>{leftIcon}</span>
                    )}

                    <input
                        ref={handleRef}
                        id={inputId}
                        type="number"
                        disabled={disabled}
                        className={styles.input}
                        value={value}
                        onChange={handleChange}
                        step={step}
                        min={min}
                        max={max}
                        {...props}
                    />

                    <div className={styles.controls}>
                        <button
                            type="button"
                            className={styles.controlButton}
                            onClick={handleDecrement}
                            disabled={disabled || (min !== undefined && parseFloat(value?.toString() || '0') <= min)}
                            tabIndex={-1}
                            aria-label="Decrease value"
                        >
                            <Minus size={14} />
                        </button>
                        <div className={styles.separator} />
                        <button
                            type="button"
                            className={styles.controlButton}
                            onClick={handleIncrement}
                            disabled={disabled || (max !== undefined && parseFloat(value?.toString() || '0') >= max)}
                            tabIndex={-1}
                            aria-label="Increase value"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
                {(error || helperText) && (
                    <span className={clsx(styles.helper, { [styles.errorText]: !!error })}>
                        {error || helperText}
                    </span>
                )}
            </div>
        );
    }
);

NumberInput.displayName = 'NumberInput';
