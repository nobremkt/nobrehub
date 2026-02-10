/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - NOTIFICATION TOAST
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Container de toast notifications. Aparece no canto superior direito,
 * abaixo do header. Auto-dismiss em 5s com barra de progresso visual.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, UserPlus, FolderKanban, Trophy, Bell } from 'lucide-react';
import { useNotificationStore, type AppNotification, type NotificationType } from '@/stores/useNotificationStore';
import styles from './NotificationToast.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getTypeIcon(type: NotificationType) {
    switch (type) {
        case 'teamchat': return <MessageSquare size={16} />;
        case 'lead_assigned': return <UserPlus size={16} />;
        case 'project_assigned': return <FolderKanban size={16} />;
        case 'client_assigned': return <UserPlus size={16} />;
        case 'goal_reached': return <Trophy size={16} />;
        case 'system': return <Bell size={16} />;
        default: return <Bell size={16} />;
    }
}

function getTypeIconClass(type: NotificationType): string {
    switch (type) {
        case 'teamchat': return styles.iconTeamchat;
        case 'lead_assigned':
        case 'client_assigned': return styles.iconLead;
        case 'project_assigned': return styles.iconProject;
        case 'goal_reached': return styles.iconGoal;
        case 'system': return styles.iconSystem;
        default: return styles.iconSystem;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE TOAST
// ─────────────────────────────────────────────────────────────────────────────

function ToastItem({ notification }: { notification: AppNotification }) {
    const navigate = useNavigate();
    const { dismissToast, markAsRead } = useNotificationStore();

    const handleClick = () => {
        markAsRead(notification.id);
        dismissToast(notification.id);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        dismissToast(notification.id);
    };

    const hasPhoto = notification.senderPhotoUrl;
    const avatarClass = `${styles.avatar} ${!hasPhoto ? getTypeIconClass(notification.type) : ''}`;

    return (
        <div className={styles.toast} onClick={handleClick}>
            {/* Avatar / Icon */}
            <div className={avatarClass}>
                {hasPhoto ? (
                    <img
                        src={notification.senderPhotoUrl}
                        alt={notification.senderName || ''}
                    />
                ) : (
                    getTypeIcon(notification.type)
                )}
            </div>

            {/* Content */}
            <div className={styles.content}>
                <div className={styles.title}>{notification.title}</div>
                <div className={styles.body}>{notification.body}</div>
            </div>

            {/* Dismiss */}
            <button className={styles.dismissBtn} onClick={handleDismiss} title="Dispensar">
                <X size={14} />
            </button>

            {/* Progress bar */}
            <div className={styles.progressBar} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST CONTAINER
// ─────────────────────────────────────────────────────────────────────────────

export function NotificationToast() {
    const { toasts } = useNotificationStore();

    if (toasts.length === 0) return null;

    return (
        <div className={styles.container}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} notification={toast} />
            ))}
        </div>
    );
}
