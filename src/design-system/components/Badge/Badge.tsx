import clsx from 'clsx';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
    /** Conteúdo (número ou texto curto) */
    content?: number | string;
    /** Variante de cor (ignorada se customColor for definida) */
    variant?: BadgeVariant;
    /** Cor customizada (hex, rgb, etc) - sobrescreve variant */
    customColor?: string;
    /** Máximo para números (ex: 99+) */
    max?: number;
    /** Mostra ponto ao invés de número */
    dot?: boolean;
    /** Callback ao remover (exibe botão X) */
    onRemove?: () => void;
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
 * <Badge content="Custom" customColor="#8b5cf6" onRemove={() => {}} />
 */
export const Badge = ({
    content,
    variant = 'default',
    customColor,
    max = 99,
    dot = false,
    onRemove,
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

    const customStyle = customColor ? {
        backgroundColor: customColor,
        boxShadow: `0 2px 8px ${customColor}40`,
    } : undefined;

    const badge = (
        <span
            className={clsx(
                styles.badge,
                !customColor && styles[variant],
                {
                    [styles.dot]: dot,
                    [styles.removable]: !!onRemove,
                },
                className
            )}
            style={customStyle}
        >
            {displayContent()}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className={styles.removeButton}
                    aria-label="Remover"
                >
                    ×
                </button>
            )}
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
