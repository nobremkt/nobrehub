import React, { useMemo } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import styles from './SessionWarning.module.css';

interface SessionWarningProps {
    lastInboundAt?: Date;
    needsTemplateFirst?: boolean;
    onDismiss?: () => void;
    onSendTemplate?: () => void;
}

/**
 * Calculates time remaining in WhatsApp 24h session window
 */
const getSessionStatus = (lastInboundAt?: Date): {
    status: 'active' | 'expiring' | 'expired';
    hoursRemaining: number;
    message: string;
} => {
    if (!lastInboundAt) {
        return { status: 'expired', hoursRemaining: 0, message: 'Janela de 24h expirada' };
    }

    const now = new Date();
    const lastTime = new Date(lastInboundAt);
    const hoursSince = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursSince);

    if (hoursRemaining <= 0) {
        return { status: 'expired', hoursRemaining: 0, message: 'Janela de 24h expirada' };
    }

    if (hoursRemaining <= 4) {
        const hours = Math.floor(hoursRemaining);
        const minutes = Math.floor((hoursRemaining - hours) * 60);
        return {
            status: 'expiring',
            hoursRemaining,
            message: `Janela expira em ${hours}h ${minutes}min`
        };
    }

    return { status: 'active', hoursRemaining, message: '' };
};

export const SessionWarning: React.FC<SessionWarningProps> = ({
    lastInboundAt,
    needsTemplateFirst,
    onDismiss,
    onSendTemplate
}) => {
    const sessionStatus = useMemo(() => getSessionStatus(lastInboundAt), [lastInboundAt]);

    // Show template-first warning if vendor hasn't sent a template yet
    if (needsTemplateFirst) {
        return (
            <div className={`${styles.container} ${styles.expiring}`}>
                <div className={styles.iconWrapper}>
                    <AlertTriangle size={18} />
                </div>
                <div className={styles.content}>
                    <span className={styles.message}>Envie um template para iniciar a conversa</span>
                    <span className={styles.hint}>A primeira mensagem deve ser um template aprovado</span>
                </div>
                <div className={styles.actions}>
                    {onSendTemplate && (
                        <button className={styles.templateBtn} onClick={onSendTemplate}>
                            Enviar Template
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Don't render if session is active (more than 4h remaining)
    if (sessionStatus.status === 'active') {
        return null;
    }

    const isExpired = sessionStatus.status === 'expired';

    return (
        <div className={`${styles.container} ${isExpired ? styles.expired : styles.expiring}`}>
            <div className={styles.iconWrapper}>
                {isExpired ? <AlertTriangle size={18} /> : <Clock size={18} />}
            </div>

            <div className={styles.content}>
                <span className={styles.message}>{sessionStatus.message}</span>
                {isExpired ? (
                    <span className={styles.hint}>
                        Envie um template para reabrir a conversa
                    </span>
                ) : null}
            </div>

            <div className={styles.actions}>
                {isExpired && onSendTemplate && (
                    <button className={styles.templateBtn} onClick={onSendTemplate}>
                        Enviar Template
                    </button>
                )}
                {onDismiss && (
                    <button className={styles.dismissBtn} onClick={onDismiss}>
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
