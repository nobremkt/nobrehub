import React from 'react';
import TopNav from './TopNav';

interface AppLayoutProps {
    children: React.ReactNode;
    user: {
        name: string;
        email: string;
        role: string;
        avatar?: string;
    };
    unreadCount?: number;
    notifications?: number;
    onLogout: () => void;
}

/**
 * AppLayout - Horizontal navigation layout
 * TopNav at top (h-14), content fills remaining space
 */
const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    user,
    unreadCount = 0,
    notifications = 0,
    onLogout,
}) => {
    return (
        <div className="h-dvh flex flex-col bg-slate-50 overflow-hidden">
            {/* Top Navigation Bar */}
            <TopNav
                user={user}
                unreadCount={unreadCount}
                notifications={notifications}
                onLogout={onLogout}
            />

            {/* Main Content - Edge-to-edge, fills remaining space */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
};

export default AppLayout;
