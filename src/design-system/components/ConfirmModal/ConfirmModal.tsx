import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Button } from '../Button';
import styles from './ConfirmModal.module.css';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalProps {
    /** Se o modal está aberto */
    isOpen: boolean;
    /** Callback para fechar o modal (cancelar) */
    onClose: () => void;
    /** Callback para confirmar a ação */
    onConfirm: () => void;
    /** Título do modal */
    title?: string;
    /** Descrição da ação */
    description?: React.ReactNode;
    /** Texto do botão de confirmar */
    confirmLabel?: string;
    /** Texto do botão de cancelar */
    cancelLabel?: string;
    /** Variante visual do modal e botão de confirmação */
    variant?: ConfirmVariant;
    /** Estado de loading do botão de confirmação */
    isLoading?: boolean;
    /** Se deve fechar ao clicar no overlay */
    closeOnOverlayClick?: boolean;
}

const Icons = {
    danger: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    warning: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    info: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    success: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
};

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    isLoading = false,
    closeOnOverlayClick = true,
}: ConfirmModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Mapeamento de variantes do modal para variantes do botão
    const buttonVariantMap: Record<ConfirmVariant, 'danger' | 'primary' | 'success'> = {
        danger: 'danger',
        warning: 'danger', // Warning usa 'danger' para chamar atenção ou customizaremos
        info: 'primary',
        success: 'success'
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleKeyDown);

            // Focus no botão de cancelar por segurança
            setTimeout(() => {
                const cancelButton = modalRef.current?.querySelector('[data-type="cancel"]');
                (cancelButton as HTMLElement)?.focus();
            }, 50);
        } else {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
            previousActiveElement.current?.focus();
        }
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={styles.overlay}
            onClick={handleOverlayClick}
            aria-modal="true"
            role="alertdialog"
        >
            <div
                ref={modalRef}
                className={styles.modal}
            >
                <div className={styles.content}>
                    <div className={clsx(styles.iconWrapper, styles[variant])}>
                        {Icons[variant]}
                    </div>

                    <div className={styles.textContent}>
                        {title && <h2 className={styles.title}>{title}</h2>}
                        {description && <div className={styles.description}>{description}</div>}
                    </div>
                </div>

                <div className={styles.footer}>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        data-type="cancel"
                        fullWidth
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={buttonVariantMap[variant]}
                        onClick={onConfirm}
                        isLoading={isLoading}
                        fullWidth
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
