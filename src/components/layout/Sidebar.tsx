import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Zap,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Contact,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

import { canAccessNav, ROLE_LABELS } from '../../config/permissions';

interface SidebarProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string;
    };
    unreadCount?: number;
    onLogout: () => void;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ user, unreadCount = 0, onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Utility nav items (not boards)
    const utilityNavItems: NavItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { id: 'inbox', label: 'Inbox', icon: <MessageSquare size={20} />, path: '/inbox', badge: unreadCount > 0 ? unreadCount : undefined },
        { id: 'contatos', label: 'Contatos', icon: <Contact size={20} />, path: '/contatos' },
    ];

    // Admin-only items
    const adminNavItems: NavItem[] = [
        { id: 'equipe', label: 'Equipe', icon: <Users size={20} />, path: '/equipe' },
        { id: 'automacoes', label: 'Automações', icon: <Zap size={20} />, path: '/automacoes' },
    ];

    // Filter utility items based on user role
    const visibleUtilityItems = useMemo(() => {
        return utilityNavItems.filter(item => canAccessNav(user.role, item.id));
    }, [user.role, unreadCount]);

    // Filter admin items
    const visibleAdminItems = useMemo(() => {
        return adminNavItems.filter(item => canAccessNav(user.role, item.id));
    }, [user.role]);

    // Check if user can access settings
    const canSeeSettings = canAccessNav(user.role, 'configuracoes');

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const renderNavItem = (item: NavItem) => (
        <li key={item.id}>
            <button
                onClick={() => navigate(item.path)}
                className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors
                    ${isActive(item.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                `}
                title={isCollapsed ? item.label : undefined}
            >
                <span className={isActive(item.path) ? 'text-blue-600' : 'text-slate-400'}>
                    {item.icon}
                </span>
                {!isCollapsed && (
                    <>
                        <span className="flex-1 text-left text-sm font-medium">
                            {item.label}
                        </span>
                        {item.badge && item.badge > 0 && (
                            <Badge variant="danger" size="sm">
                                {item.badge > 99 ? '99+' : item.badge}
                            </Badge>
                        )}
                    </>
                )}
                {isCollapsed && item.badge && item.badge > 0 && (
                    <span className="absolute right-2 top-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
            </button>
        </li>
    );

    return (
        <aside
            className={`
                h-full flex-shrink-0
                bg-white border-r border-slate-200
                flex flex-col
                transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-16' : 'w-64'}
            `}
        >
            {/* Logo */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">N</span>
                        </div>
                        <span className="font-bold text-slate-900">Nobre Hub</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto">
                {/* Utility Items (Dashboard, Inbox, Contatos) */}
                {visibleUtilityItems.length > 0 && (
                    <nav className="py-2">
                        <ul className="space-y-1 px-2">
                            {visibleUtilityItems.map(renderNavItem)}
                        </ul>
                    </nav>
                )}

                {/* Divider */}
                {visibleUtilityItems.length > 0 && (
                    <div className="mx-4 border-t border-slate-100" />
                )}

                {/* Board List (Sectors with users) */}
                {/* CRM Main Board Link */}
                <nav className="py-2">
                    <ul className="space-y-1 px-2">
                        <li>
                            <button
                                onClick={() => navigate('/leads')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/leads') ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <span className={isActive('/leads') ? 'text-blue-600' : 'text-slate-400'}>
                                    <LayoutDashboard size={20} />
                                </span>
                                {!isCollapsed && <span className="flex-1 text-left text-sm font-medium">CRM Board</span>}
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Admin Items (Equipe, Automações) */}
                {visibleAdminItems.length > 0 && (
                    <>
                        <div className="mx-4 border-t border-slate-100" />
                        <nav className="py-2">
                            {!isCollapsed && (
                                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Admin
                                </div>
                            )}
                            <ul className="space-y-1 px-2">
                                {visibleAdminItems.map(renderNavItem)}
                            </ul>
                        </nav>
                    </>
                )}
            </div>

            {/* Settings */}
            {canSeeSettings && (
                <div className="border-t border-slate-200 p-2">
                    <button
                        onClick={() => navigate('/configuracoes')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
                        title={isCollapsed ? 'Configurações' : undefined}
                    >
                        <Settings size={20} className="text-slate-400" />
                        {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
                    </button>
                </div>
            )}

            {/* User Profile */}
            <div className="border-t border-slate-200 p-3">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Avatar name={user.name} src={user.avatar} size="sm" />
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{ROLE_LABELS[user.role] || user.role}</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <button
                            onClick={onLogout}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sair"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

