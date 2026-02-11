import React, { forwardRef, useRef, useEffect, useId, useImperativeHandle, useCallback } from 'react';
import clsx from 'clsx';
import styles from './Textarea.module.css';

/* ═══════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
    /** Label text */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper text (shown when no error) */
    helperText?: string;
    /** Size */
    size?: 'sm' | 'md' | 'lg';
    /** Auto-resize the textarea to fit content */
    autoResize?: boolean;
    /** Show character counter (requires maxLength) */
    showCount?: boolean;
    /** Full width */
    fullWidth?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            label,
            error,
            helperText,
            size = 'md',
            autoResize = false,
            showCount = false,
            fullWidth = true,
            className,
            id,
            maxLength,
            value,
            onChange,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const inputId = id || generatedId;
        const internalRef = useRef<HTMLTextAreaElement>(null);

        useImperativeHandle(ref, () => internalRef.current!);

        const adjustHeight = useCallback(() => {
            const el = internalRef.current;
            if (!el || !autoResize) return;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }, [autoResize]);

        useEffect(() => {
            adjustHeight();
        }, [value, adjustHeight]);

        const currentLength = typeof value === 'string' ? value.length : 0;

        return (
            <div className={clsx(styles.wrapper, { [styles.fullWidth]: fullWidth }, className)}>
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                    </label>
                )}
                <textarea
                    ref={internalRef}
                    id={inputId}
                    className={clsx(
                        styles.textarea,
                        styles[size],
                        { [styles.hasError]: !!error, [styles.disabled]: disabled }
                    )}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    maxLength={maxLength}
                    {...props}
                />
                <div className={styles.footer}>
                    {(error || helperText) && (
                        <span className={clsx(styles.helper, { [styles.errorText]: !!error })}>
                            {error || helperText}
                        </span>
                    )}
                    {showCount && maxLength && (
                        <span className={clsx(styles.counter, { [styles.counterWarning]: currentLength >= maxLength * 0.9 })}>
                            {currentLength}/{maxLength}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
