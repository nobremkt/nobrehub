import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Variante do card */
    variant?: 'default' | 'elevated' | 'outlined';
    /** Padding interno */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Card clicável */
    clickable?: boolean;
}

/**
 * Card Component
 * 
 * Container versátil para agrupar conteúdo relacionado.
 * 
 * @example
 * <Card variant="elevated" padding="md">
 *   <h3>Título</h3>
 *   <p>Conteúdo do card</p>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = 'default',
            padding = 'md',
            clickable = false,
            className,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    styles.card,
                    styles[variant],
                    styles[`padding-${padding}`],
                    { [styles.clickable]: clickable },
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

/* ─────────────────────────────────────────────────────────────────────────────
 * SUB-COMPONENTS
 * ───────────────────────────────────────────────────────────────────────────── */

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ title, subtitle, action, className, children, ...props }, ref) => {
        return (
            <div ref={ref} className={clsx(styles.header, className)} {...props}>
                {(title || subtitle) ? (
                    <div className={styles.headerContent}>
                        {title && <h3 className={styles.title}>{title}</h3>}
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                ) : children}
                {action && <div className={styles.action}>{action}</div>}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div ref={ref} className={clsx(styles.body, className)} {...props}>
                {children}
            </div>
        );
    }
);

CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div ref={ref} className={clsx(styles.footer, className)} {...props}>
                {children}
            </div>
        );
    }
);

CardFooter.displayName = 'CardFooter';
