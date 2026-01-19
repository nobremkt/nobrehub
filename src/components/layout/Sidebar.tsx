import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Columns,
    MessageSquare,
    CheckSquare,
    Users,
    Zap,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

interface SidebarProps {
    user: {
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
    adminOnly?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, unreadCount = 0, onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Admin has access to all modules
    const navItems: NavItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { id: 'kanban', label: 'Kanban', icon: <Columns size={20} />, path: '/kanban' },
        { id: 'inbox', label: 'Inbox', icon: <MessageSquare size={20} />, path: '/inbox', badge: unreadCount },
        { id: 'producao', label: 'Produção', icon: <CheckSquare size={20} />, path: '/producao' },
        { id: 'equipe', label: 'Equipe', icon: <Users size={20} />, path: '/equipe', adminOnly: true },
        { id: 'automacoes', label: 'Automações', icon: <Zap size={20} />, path: '/automacoes', adminOnly: true },
    ];

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <aside
            className={`
                fixed left-0 top-0 h-screen
                bg-white border-r border-slate-200
                flex flex-col
                transition-all duration-300 ease-in-out
                z-[300]
                ${isCollapsed ? 'w-16' : 'w-60'}
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
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => (
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
                    ))}
                </ul>
            </nav>

            {/* Settings */}
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

            {/* User Profile */}
            <div className="border-t border-slate-200 p-3">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Avatar name={user.name} src={user.avatar} size="sm" />
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.role}</p>
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
