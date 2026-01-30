import clsx from 'clsx';
import styles from './Tag.module.css';

export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type TagSize = 'sm' | 'md';

export interface TagProps {
    /** Variante de cor */
    variant?: TagVariant;
    /** Tamanho */
    size?: TagSize;
    /** Callback ao remover (exibe botão X) */
    onRemove?: () => void;
    /** Conteúdo */
    children: React.ReactNode;
    /** Classes adicionais */
    className?: string;
}

/**
 * Tag Component
 * 
 * Labels categorizados para status, filtros, etc.
 * 
 * @example
 * <Tag variant="success">Ativo</Tag>
 * <Tag variant="warning" onRemove={() => {}}>Removível</Tag>
 */
export const Tag = ({
    variant = 'default',
    size = 'md',
    onRemove,
    children,
    className,
}: TagProps) => {
    return (
        <span className={clsx(styles.tag, styles[variant], styles[size], className)}>
            <span className={styles.content}>{children}</span>
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className={styles.removeButton}
                    aria-label="Remover"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            )}
        </span>
    );
};

Tag.displayName = 'Tag';
