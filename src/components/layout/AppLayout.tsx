import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

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

const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    user,
    unreadCount = 0,
    notifications = 0,
    onLogout,
}) => {
    return (
        <div className="h-dvh flex flex-col bg-slate-50 overflow-hidden">
            {/* Header - Fixed at top */}
            <Header user={user} notifications={notifications} onLogout={onLogout} />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Fixed width */}
                <Sidebar user={user} unreadCount={unreadCount} onLogout={onLogout} />

                {/* Main Content - Edge-to-edge, fills remaining space */}
                <main className="flex-1 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
