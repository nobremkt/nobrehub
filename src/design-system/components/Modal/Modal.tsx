import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto';

export interface ModalProps {
    /** Se o modal está aberto */
    isOpen: boolean;
    /** Callback para fechar o modal */
    onClose: () => void;
    /** Título do modal */
    title?: string;
    /** Tamanho do modal */
    size?: ModalSize;
    /** Desabilita fechamento ao clicar no overlay */
    closeOnOverlayClick?: boolean;
    /** Desabilita fechamento com ESC */
    closeOnEsc?: boolean;
    /** Esconde o botão de fechar */
    hideCloseButton?: boolean;
    /** Conteúdo do modal */
    children: React.ReactNode;
    /** Footer do modal */
    footer?: React.ReactNode;
}

/**
 * Modal Component
 * 
 * Diálogo modal com suporte a portal, animações e acessibilidade.
 * 
 * @example
 * <Modal isOpen={isOpen} onClose={close} title="Confirmar">
 *   <p>Deseja continuar?</p>
 * </Modal>
 */
export const Modal = ({
    isOpen,
    onClose,
    title,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEsc = true,
    hideCloseButton = false,
    children,
    footer,
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle ESC key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEsc) {
            onClose();
        }
    }, [closeOnEsc, onClose]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    // Focus management & body scroll lock
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleKeyDown);

            // Focus first focusable element
            setTimeout(() => {
                modalRef.current?.focus();
            }, 0);
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
            role="dialog"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <div
                ref={modalRef}
                className={clsx(styles.modal, styles[size])}
                tabIndex={-1}
            >
                {(title || !hideCloseButton) && (
                    <div className={styles.header}>
                        {title && (
                            <h2 id="modal-title" className={styles.title}>{title}</h2>
                        )}
                        {!hideCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className={styles.closeButton}
                                aria-label="Fechar modal"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                <div className={styles.body}>
                    {children}
                </div>

                {footer && (
                    <div className={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

Modal.displayName = 'Modal';
