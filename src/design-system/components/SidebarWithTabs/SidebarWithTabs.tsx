/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB — SHARED SIDEBAR WITH TABS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Reusable sidebar component with tab navigation.
 * Used by ProductionPage and PostSalesPage.
 */

import { type ReactNode, type ReactElement } from 'react';
import styles from './SidebarWithTabs.module.css';

export interface SidebarTab {
    key: string;
    label: string;
    icon: ReactElement;
    content: ReactNode;
}

interface SidebarWithTabsProps {
    tabs: SidebarTab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

export const SidebarWithTabs = ({ tabs, activeTab, onTabChange }: SidebarWithTabsProps) => {
    const activeContent = tabs.find(t => t.key === activeTab)?.content ?? null;

    return (
        <div className={styles.sidebar}>
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className={styles.content}>
                {activeContent}
            </div>
        </div>
    );
};
