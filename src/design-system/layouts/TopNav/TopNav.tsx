/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - LAYOUT: TOP NAV
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';
import { useUIStore } from '@/stores';
import { Badge } from '@/design-system/components';
import styles from './TopNav.module.css';

interface TopNavProps {
    title?: string;
    subtitle?: string;
}

export function TopNav({ title, subtitle }: TopNavProps) {
    const { theme, setTheme, setSidebarMobileOpen } = useUIStore();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className={styles.topnav}>
            {/* Mobile Menu Button */}
            <button
                className={styles.mobileMenuBtn}
                onClick={() => setSidebarMobileOpen(true)}
                aria-label="Abrir menu"
            >
                <Menu size={22} />
            </button>

            {/* Page Title */}
            <div className={styles.titleSection}>
                {title && <h1 className={styles.title}>{title}</h1>}
                {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
            </div>

            {/* Spacer */}
            <div className={styles.spacer} />

            {/* Actions */}
            <div className={styles.actions}>
                {/* Search */}
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className={styles.searchInput}
                    />
                    <kbd className={styles.searchKbd}>⌘K</kbd>
                </div>

                {/* Notifications */}
                <button className={styles.iconBtn} title="Notificações">
                    <Badge content={3} variant="danger">
                        <Bell size={20} />
                    </Badge>
                </button>

                {/* Theme Toggle */}
                <button
                    className={styles.iconBtn}
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
}
