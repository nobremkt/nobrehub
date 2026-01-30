/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - LAYOUT: APP LAYOUT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Layout principal da aplicação com Sidebar + Header + Content.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { ReactNode } from 'react';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { useUIStore } from '@/stores';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
    children: ReactNode;
    notificationCount?: number;
}

export function AppLayout({ children, notificationCount = 0 }: AppLayoutProps) {
    const { sidebarCollapsed } = useUIStore();
    const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

    return (
        <div
            className={styles.layout}
            style={{ '--sidebar-width': sidebarWidth } as React.CSSProperties}
        >
            <Sidebar />

            <div className={styles.main}>
                <Header notificationCount={notificationCount} />

                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
