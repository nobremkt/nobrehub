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
        <div className="min-h-dvh bg-slate-50">
            {/* Sidebar */}
            <Sidebar user={user} unreadCount={unreadCount} onLogout={onLogout} />

            {/* Header */}
            <Header user={user} notifications={notifications} onLogout={onLogout} />

            {/* Main Content */}
            <main className="ml-60 pt-14 min-h-dvh">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
