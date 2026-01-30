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
}

/**
 * Input Component
 * 
 * @example
 * <Input label="Email" placeholder="seu@email.com" />
 * <Input label="Senha" type="password" error="Senha incorreta" />
 * <Input leftIcon={<SearchIcon />} placeholder="Buscar..." />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
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
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const isPassword = type === 'password';
        const inputType = isPassword && showPassword ? 'text' : type;

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
                        styles.inputWrapper,
                        styles[size],
                        {
                            [styles.hasError]: !!error,
                            [styles.disabled]: disabled,
                            [styles.hasLeftIcon]: !!leftIcon,
                            [styles.hasRightIcon]: !!rightIcon || isPassword,
                        }
                    )}
                >
                    {leftIcon && (
                        <span className={styles.leftIcon}>{leftIcon}</span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        disabled={disabled}
                        className={styles.input}
                        {...props}
                    />
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
