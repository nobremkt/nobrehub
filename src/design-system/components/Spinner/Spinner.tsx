import clsx from 'clsx';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
    /** Tamanho */
    size?: SpinnerSize;
    /** Cor customizada (para o glow e arc) */
    color?: string;
    /** Classes adicionais */
    className?: string;
}

/**
 * Spinner Component
 * 
 * Indicador de loading premium com glow localizado no arco.
 */
export const Spinner = ({
    size = 'md',
    color,
    className,
}: SpinnerProps) => {
    const strokeColor = color || 'var(--color-primary-500)';

    return (
        <svg
            className={clsx(styles.spinner, styles[size], className)}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="status"
            aria-label="Carregando"
            style={{ overflow: 'visible' }}
        >
            {/* Background track */}
            <circle
                className={styles.track}
                cx="16"
                cy="16"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
            />
            {/* Active arc with glow */}
            <path
                className={styles.head}
                d="M16 6C10.4771 6 6 10.4771 6 16C6 17.9391 6.55325 19.751 7.51139 21.2871"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
};

Spinner.displayName = 'Spinner';
