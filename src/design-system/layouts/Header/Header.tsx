/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - LAYOUT: HEADER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Header fino e simples com logo e notificações.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Bell } from 'lucide-react';
import { Badge } from '@/design-system/components';
import { useOrganizationStore } from '@/features/settings/stores/useOrganizationStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import styles from './Header.module.css';

export function Header() {
    const { companyName, logoUrl } = useOrganizationStore();
    const { unreadCount, toggleDrawer } = useNotificationStore();

    return (
        <header className={styles.header}>
            {/* Logo */}
            <div className={styles.logo}>
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={companyName}
                        className={styles.logoImage}
                        style={{ height: '32px', width: 'auto', maxHeight: '32px', objectFit: 'contain' }}
                    />
                ) : (
                    <div className={styles.logoIcon}>{companyName.charAt(0).toUpperCase()}</div>
                )}
                <span className={styles.logoText}>{companyName}</span>
            </div>

            {/* Spacer */}
            <div className={styles.spacer} />

            {/* Notifications */}
            <button
                className={styles.notificationBtn}
                title="Notificações"
                onClick={toggleDrawer}
            >
                {unreadCount > 0 ? (
                    <Badge content={unreadCount} variant="danger">
                        <Bell size={20} />
                    </Badge>
                ) : (
                    <Bell size={20} />
                )}
            </button>
        </header>
    );
}

