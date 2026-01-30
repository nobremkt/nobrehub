import clsx from 'clsx';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
    /** Conteúdo (número ou texto curto) */
    content?: number | string;
    /** Variante de cor */
    variant?: BadgeVariant;
    /** Máximo para números (ex: 99+) */
    max?: number;
    /** Mostra ponto ao invés de número */
    dot?: boolean;
    /** Elemento ao qual o badge está anexado */
    children?: React.ReactNode;
    /** Classes adicionais */
    className?: string;
}

/**
 * Badge Component
 * 
 * Indicador numérico ou de status.
 * 
 * @example
 * <Badge content={5} variant="primary">
 *   <IconButton>🔔</IconButton>
 * </Badge>
 * <Badge dot variant="success" />
 */
export const Badge = ({
    content,
    variant = 'default',
    max = 99,
    dot = false,
    children,
    className,
}: BadgeProps) => {
    const displayContent = () => {
        if (dot) return null;
        if (typeof content === 'number' && content > max) {
            return `${max}+`;
        }
        return content;
    };

    const badge = (
        <span
            className={clsx(
                styles.badge,
                styles[variant],
                { [styles.dot]: dot },
                className
            )}
        >
            {displayContent()}
        </span>
    );

    if (!children) return badge;

    return (
        <span className={styles.wrapper}>
            {children}
            {badge}
        </span>
    );
};

Badge.displayName = 'Badge';
