/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - NOTIFICATION POPOVER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Menu popover que aparece abaixo do botão de notificações.
 * Substitui a gaveta lateral por um dropdown mais leve.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCheck, BellOff,
    MessageSquare, UserPlus, FolderKanban, Trophy, Bell
} from 'lucide-react';
import {
    useNotificationStore,
    type AppNotification,
    type NotificationType
} from '@/stores/useNotificationStore';
import styles from './NotificationDrawer.module.css';

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

function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ITEM
// ─────────────────────────────────────────────────────────────────────────────

function NotificationItem({ notification }: { notification: AppNotification }) {
    const navigate = useNavigate();
    const { markAsRead, setDrawerOpen } = useNotificationStore();

    const handleClick = () => {
        markAsRead(notification.id);
        setDrawerOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const hasPhoto = notification.senderPhotoUrl;
    const avatarClass = `${styles.itemAvatar} ${!hasPhoto ? getTypeIconClass(notification.type) : ''}`;
    const itemClass = `${styles.item} ${!notification.read ? styles.itemUnread : ''}`;
    const titleClass = `${styles.itemTitle} ${!notification.read ? styles.itemTitleUnread : ''}`;

    return (
        <div className={itemClass} onClick={handleClick}>
            <div className={avatarClass}>
                {hasPhoto ? (
                    <img src={notification.senderPhotoUrl} alt={notification.senderName || ''} />
                ) : (
                    getTypeIcon(notification.type)
                )}
            </div>

            <div className={styles.itemContent}>
                <div className={titleClass}>{notification.title}</div>
                <div className={styles.itemBody}>{notification.body}</div>
            </div>

            <span className={styles.itemTime}>
                {formatRelativeTime(notification.timestamp)}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// POPOVER
// ─────────────────────────────────────────────────────────────────────────────

export function NotificationDrawer() {
    const { drawerOpen, setDrawerOpen, notifications, markAllRead, unreadCount } = useNotificationStore();

    const handleClose = useCallback(() => {
        setDrawerOpen(false);
    }, [setDrawerOpen]);

    // Close on Escape
    useEffect(() => {
        if (!drawerOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [drawerOpen, handleClose]);

    if (!drawerOpen) return null;

    return (
        <>
            {/* Invisible backdrop to close on click outside */}
            <div className={styles.backdrop} onClick={handleClose} />

            {/* Popover panel */}
            <div className={styles.popover}>
                {/* Arrow */}
                <div className={styles.arrow} />

                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.headerTitle}>Notificações</span>

                    {unreadCount > 0 && (
                        <button
                            className={styles.headerBtn}
                            onClick={markAllRead}
                            title="Marcar todas como lidas"
                        >
                            <CheckCheck size={13} />
                            Marcar lidas
                        </button>
                    )}
                </div>

                {/* List */}
                <div className={styles.list}>
                    {notifications.length === 0 ? (
                        <div className={styles.empty}>
                            <BellOff size={40} className={styles.emptyIcon} />
                            <span className={styles.emptyText}>
                                Sem notificações
                            </span>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <NotificationItem key={notif.id} notification={notif} />
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
