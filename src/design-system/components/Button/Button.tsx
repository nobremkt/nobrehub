import { ButtonHTMLAttributes, forwardRef, useCallback } from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';
import { useUISound } from '@/hooks';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Variante visual do botão */
    variant?: ButtonVariant;
    /** Tamanho do botão */
    size?: ButtonSize;
    /** Estado de loading */
    isLoading?: boolean;
    /** Ícone à esquerda */
    leftIcon?: React.ReactNode;
    /** Ícone à direita */
    rightIcon?: React.ReactNode;
    /** Botão ocupar 100% da largura */
    fullWidth?: boolean;
    /** Desabilitar sons */
    noSound?: boolean;
}

/**
 * Button Component
 * 
 * @example
 * <Button variant="primary" size="md">Clique aqui</Button>
 * <Button variant="ghost" leftIcon={<Icon />}>Com ícone</Button>
 * <Button isLoading>Carregando...</Button>
 * <Button variant="premium">Botão Premium</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            className,
            children,
            onClick,
            noSound = false,
            ...props
        },
        ref
    ) => {
        const { playSound } = useUISound();
        const isDisabled = disabled || isLoading;

        const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
            if (!noSound && !isDisabled) {
                playSound('click');
            }
            onClick?.(e);
        }, [noSound, isDisabled, playSound, onClick]);

        const handleMouseEnter = useCallback(() => {
            if (!noSound && !isDisabled) {
                playSound('hover');
            }
        }, [noSound, isDisabled, playSound]);

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={clsx(
                    styles.button,
                    styles[variant],
                    styles[size],
                    {
                        [styles.fullWidth]: fullWidth,
                        [styles.loading]: isLoading,
                    },
                    className
                )}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                {...props}
            >
                {isLoading && (
                    <span className={styles.spinner} aria-hidden="true" />
                )}

                {!isLoading && leftIcon && (
                    <span className={styles.leftIcon}>{leftIcon}</span>
                )}
                <span className={styles.label}>{children}</span>
                {!isLoading && rightIcon && (
                    <span className={styles.rightIcon}>{rightIcon}</span>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
