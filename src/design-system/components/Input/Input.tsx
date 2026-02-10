import { InputHTMLAttributes, forwardRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Label do input */
    label?: string;
    /** Mensagem de erro */
    error?: string;
    /** Texto de ajuda */
    helperText?: string;
    /** Tamanho do input */
    size?: InputSize;
    /** Ícone à esquerda */
    leftIcon?: React.ReactNode;
    /** Ícone à direita */
    rightIcon?: React.ReactNode;
    /** Input ocupar 100% da largura */
    fullWidth?: boolean;
    /** Se verdadeiro, renderiza como textarea */
    multiline?: boolean;
    /** Número de linhas (apenas para multiline/textarea) */
    rows?: number;
}

/**
 * Input Component
 * 
 * @example
 * <Input label="Email" placeholder="seu@email.com" />
 * <Input label="Senha" type="password" error="Senha incorreta" />
 * <Input leftIcon={<SearchIcon />} placeholder="Buscar..." />
 * <Input multiline rows={4} label="Descrição" />
 */
export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            size = 'md',
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            className,
            id,
            type = 'text',
            multiline = false,
            rows,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        // Use state to store the generated ID so it doesn't change on re-renders
        const [generatedId] = useState(() => `input-${Math.random().toString(36).substr(2, 9)}`);
        const inputId = id || generatedId;
        const isPassword = type === 'password';
        const inputType = isPassword && showPassword ? 'text' : type;
        const isRequired = Boolean(props.required);

        const commonClasses = clsx(
            styles.inputWrapper,
            styles[size],
            {
                [styles.hasError]: !!error,
                [styles.disabled]: disabled,
                [styles.hasLeftIcon]: !!leftIcon,
                [styles.hasRightIcon]: !!rightIcon || isPassword,
                [styles.multiline]: multiline,
            }
        );

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
                        {isRequired && <span className={styles.required}>*</span>}
                    </label>
                )}
                <div className={commonClasses}>
                    {leftIcon && (
                        <span className={styles.leftIcon}>{leftIcon}</span>
                    )}

                    {multiline ? (
                        <textarea
                            ref={ref as any}
                            id={inputId}
                            disabled={disabled}
                            rows={rows}
                            className={styles.input}
                            {...(props as any)}
                        />
                    ) : (
                        <input
                            ref={ref as React.Ref<HTMLInputElement>}
                            id={inputId}
                            type={inputType}
                            disabled={disabled}
                            className={styles.input}
                            {...props}
                        />
                    )}

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={styles.passwordToggle}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    )}
                    {!isPassword && rightIcon && (
                        <span className={styles.rightIcon}>{rightIcon}</span>
                    )}
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

Input.displayName = 'Input';
