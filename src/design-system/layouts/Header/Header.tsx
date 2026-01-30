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
import styles from './Header.module.css';

interface HeaderProps {
    notificationCount?: number;
}

export function Header({ notificationCount = 0 }: HeaderProps) {
    return (
        <header className={styles.header}>
            {/* Logo */}
            <div className={styles.logo}>
                <div className={styles.logoIcon}>N</div>
                <span className={styles.logoText}>Nobre Hub</span>
            </div>

            {/* Spacer */}
            <div className={styles.spacer} />

            {/* Notifications */}
            <button className={styles.notificationBtn} title="Notificações">
                {notificationCount > 0 ? (
                    <Badge content={notificationCount} variant="danger">
                        <Bell size={20} />
                    </Badge>
                ) : (
                    <Bell size={20} />
                )}
            </button>
        </header>
    );
}
