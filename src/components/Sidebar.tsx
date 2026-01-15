
import React from 'react';
import { LayoutDashboard, MessageSquare, Zap, BarChart3, Settings, LogOut, Users, ListFilter, Briefcase } from 'lucide-react';
import { ViewType } from '../types';

// Role types from backend
type UserRole = 'admin' | 'manager_sales' | 'manager_production' | 'strategic' | 'closer_ht' | 'closer_lt' | 'sdr' | 'post_sales' | 'production';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  userRole?: UserRole;
}

// Permission matrix: which roles can see which menu items
const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  kanban: ['admin', 'manager_sales', 'manager_production', 'strategic', 'post_sales', 'production'],
  personal_workspace: ['admin', 'manager_sales', 'manager_production', 'strategic', 'closer_ht', 'closer_lt', 'sdr', 'post_sales', 'production'],
  leads: ['admin', 'manager_sales', 'manager_production', 'strategic', 'sdr'],
  chat: ['admin', 'manager_sales', 'manager_production', 'strategic', 'closer_ht', 'closer_lt', 'post_sales'],
  flows: ['admin'],
  team: ['admin', 'manager_sales', 'manager_production', 'strategic'],
  analytics: ['admin', 'manager_sales', 'manager_production', 'strategic'],
  settings: ['admin'],
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onLogout, userRole = 'admin' }) => {
  const allMenuItems = [
    { id: 'kanban', icon: LayoutDashboard, label: 'Pipeline' },
    { id: 'personal_workspace', icon: Briefcase, label: 'Meu Workspace' },
    { id: 'leads', icon: ListFilter, label: 'Leads' },
    { id: 'chat', icon: MessageSquare, label: 'Atendimento' },
    { id: 'flows', icon: Zap, label: 'Automações' },
    { id: 'team', icon: Users, label: 'Equipe' },
    { id: 'analytics', icon: BarChart3, label: 'Relatórios' },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    const allowedRoles = ROLE_PERMISSIONS[item.id];
    return allowedRoles?.includes(userRole);
  });

  // Check if user can see settings
  const canSeeSettings = ROLE_PERMISSIONS.settings.includes(userRole);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-dvh fixed left-0 top-0 z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center font-bold text-white shadow-lg shadow-rose-600/30">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <span className="font-black tracking-tighter text-slate-900 uppercase text-xs leading-none">Nobre CRM</span>
          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1">Marketing Hub</span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 pb-4">
        <div className="bg-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-purple-500' : userRole.includes('closer') ? 'bg-rose-500' : 'bg-blue-500'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            {userRole === 'admin' ? 'Administrador' :
              userRole === 'closer_ht' ? 'Closer HT' :
                userRole === 'closer_lt' ? 'Closer LT' :
                  userRole === 'sdr' ? 'SDR' :
                    userRole === 'manager_sales' ? 'Ger. Vendas' :
                      userRole === 'manager_production' ? 'Ger. Produção' :
                        userRole === 'post_sales' ? 'Pós-Venda' :
                          userRole === 'production' ? 'Produção' :
                            'Estratégico'}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as ViewType)}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 relative group ${activeView === item.id
              ? 'bg-rose-50 text-rose-600'
              : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-rose-600 rounded-r-full shadow-[2px_0_10px_rgba(225,29,72,0.4)]"></div>
            )}
            <item.icon size={20} strokeWidth={activeView === item.id ? 2.5 : 2} className={activeView === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
            <span className={`font-black uppercase tracking-widest text-[10px] ${activeView === item.id ? 'opacity-100' : 'opacity-80'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-100 space-y-2">
        {canSeeSettings && (
          <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
            <Settings size={20} />
            <span className="font-black uppercase tracking-widest text-[10px]">Configurações</span>
          </button>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
        >
          <LogOut size={20} />
          <span className="font-black uppercase tracking-widest text-[10px]">Desconectar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
