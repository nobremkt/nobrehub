import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import Avatar from '../ui/Avatar';

interface HeaderProps {
    user: {
        name: string;
        email: string;
        role: string;
        avatar?: string;
    };
    notifications?: number;
    onSearch?: (query: string) => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
    user,
    notifications = 0,
    onSearch,
    onLogout,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(searchQuery);
    };

    return (
        <header className="fixed top-0 right-0 left-60 h-14 bg-white border-b border-slate-200 z-[200] flex items-center justify-between px-6">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar leads, conversas... (Ctrl+K)"
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
                    />
                </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
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

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                    <User size={16} className="text-slate-400" />
                                    Meu Perfil
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                    <Settings size={16} className="text-slate-400" />
                                    Configurações
                                </button>
                            </div>

                            {/* Logout */}
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

export default Header;
