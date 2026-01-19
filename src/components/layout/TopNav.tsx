import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Columns,
    MessageSquare,
    CheckSquare,
    Users,
    Zap,
    Settings,
    Bell,
    LogOut,
    ChevronDown,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

interface TopNavProps {
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

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
}

const TopNav: React.FC<TopNavProps> = ({
    user,
    unreadCount = 0,
    notifications = 0,
    onLogout,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const userMenuRef = React.useRef<HTMLDivElement>(null);

    const navItems: NavItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
        { id: 'kanban', label: 'Kanban', icon: <Columns size={18} />, path: '/kanban' },
        { id: 'inbox', label: 'Inbox', icon: <MessageSquare size={18} />, path: '/inbox', badge: unreadCount },
        { id: 'producao', label: 'Produção', icon: <CheckSquare size={18} />, path: '/producao' },
        { id: 'equipe', label: 'Equipe', icon: <Users size={18} />, path: '/equipe' },
        { id: 'automacoes', label: 'Automações', icon: <Zap size={18} />, path: '/automacoes' },
    ];

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    // Close menu on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-14 flex-shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 mr-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="font-bold text-slate-900 hidden sm:block">Nobre Hub</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex items-center gap-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                            transition-colors relative
                            ${isActive(item.path)
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }
                        `}
                    >
                        <span className={isActive(item.path) ? 'text-blue-600' : 'text-slate-400'}>
                            {item.icon}
                        </span>
                        <span className="hidden md:inline">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                            <Badge variant="danger" size="sm">
                                {item.badge > 99 ? '99+' : item.badge}
                            </Badge>
                        )}
                    </button>
                ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
                {/* Settings */}
                <button
                    onClick={() => navigate('/configuracoes')}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Configurações"
                >
                    <Settings size={20} />
                </button>

                {/* Notifications */}
                <button
                    className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Notificações"
                >
                    <Bell size={20} />
                    {notifications > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                            {notifications > 9 ? '9+' : notifications}
                        </span>
                    )}
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Avatar name={user.name} src={user.avatar} size="sm" />
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                            <div className="py-1 border-t border-slate-100">
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={16} />
                                    Sair
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNav;
