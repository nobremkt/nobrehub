import { ButtonHTMLAttributes, forwardRef, useCallback } from 'react';
import clsx from 'clsx';
import styles from './PremiumButton.module.css';
import { useUISound } from '@/hooks';

export interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Whether the button is in a loading state */
    isLoading?: boolean;
    /** Disable sound effects */
    noSound?: boolean;
}

/**
 * Premium Button Component
 * 
 * Standalone premium button with advanced animations (shine, glow, scaling).
 * 
 * @example
 * <PremiumButton onClick={handleClick}>
 *   GARANTIR MEU LUGAR
 * </PremiumButton>
 */
export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
    ({ className, isLoading, children, disabled, noSound = false, onClick, ...props }, ref) => {
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
                className={clsx(styles.btnPremium, className)}
                disabled={isDisabled}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                {...props}
            >
                {isLoading && <span className={styles.spinner} />}

                {/* Shine Animation Container */}
                <span className={styles.btnShineContainer}>
                    <span className={styles.btnShine}></span>
                </span>

                {/* Content */}
                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center' }}>
                    {children}
                </span>
            </button>
        );
    }
);

PremiumButton.displayName = 'PremiumButton';
