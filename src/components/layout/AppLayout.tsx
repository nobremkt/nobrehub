import React from 'react';
import TopNav from './TopNav';


interface AppLayoutProps {
    children: React.ReactNode;
    user: {
        id: string;
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
 * AppLayout - Hybrid layout with TopNav + Sidebar
 * TopNav at top (h-14), Sidebar on left, content fills remaining space
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

            {/* Main area - Content only */}
            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;

