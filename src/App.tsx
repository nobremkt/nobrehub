
import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import Kanban from './components/Kanban';
import LeadList from './components/LeadList';
import Inbox from './components/Inbox';
import FlowBuilder from './components/FlowBuilder';
import Analytics from './components/Analytics';
import TeamManagement from './components/TeamManagement';
import PersonalWorkspace from './components/PersonalWorkspace';
import Login from './components/Login';
import { ViewType, Agent } from './types';

// Default view per role (first accessible view)
const DEFAULT_VIEW_BY_ROLE: Record<string, ViewType> = {
  admin: 'kanban',
  manager_sales: 'kanban',
  manager_production: 'kanban',
  strategic: 'kanban',
  closer_ht: 'personal_workspace',
  closer_lt: 'personal_workspace',
  sdr: 'personal_workspace',
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  // Get initial view based on stored user role
  const getInitialView = (): ViewType => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return DEFAULT_VIEW_BY_ROLE[user.role] || 'personal_workspace';
      }
    } catch { }
    return 'kanban';
  };

  const [activeView, setActiveView] = useState<ViewType>(getInitialView);
  const [monitoredUser, setMonitoredUser] = useState<Agent | null>(null);
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);

  const handleLogin = (token: string, user: any) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsLoggedIn(true);
    // Set initial view based on user role
    setActiveView(DEFAULT_VIEW_BY_ROLE[user.role] || 'personal_workspace');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  const startMonitoring = (user: Agent) => {
    setMonitoredUser(user);
    setActiveView('kanban');
  };

  const stopMonitoring = () => {
    setMonitoredUser(null);
    setActiveView('team');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  const renderView = () => {
    // Se estiver monitorando, força a renderização do Kanban com o contexto do usuário
    if (monitoredUser) {
      return <Kanban monitoredUser={monitoredUser} onExitMonitor={stopMonitoring} />;
    }

    switch (activeView) {
      case 'kanban': return <Kanban />;
      case 'leads': return <LeadList onNavigateToChat={(leadId) => {
        setPendingLeadId(leadId || null);
        setActiveView('chat');
      }} />;
      case 'chat': return <Inbox userId={currentUser?.id || ''} isAdmin={currentUser?.role === 'admin'} initialLeadId={pendingLeadId} onConversationOpened={() => setPendingLeadId(null)} />;
      case 'flows': return <FlowBuilder />;
      case 'analytics': return <Analytics />;
      case 'team': return <TeamManagement onMonitor={startMonitoring} />;
      case 'personal_workspace': return <PersonalWorkspace />;
      default: return <Kanban />;
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 overflow-hidden">
        {/* Esconde o sidebar se estiver monitorando para focar no workspace */}
        {!monitoredUser && (
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            isDarkMode={false}
            onToggleTheme={() => { }}
            onLogout={handleLogout}
            userRole={currentUser?.role}
          />
        )}

        <main className={`flex-1 ${!monitoredUser ? 'ml-64' : 'ml-0'} min-h-screen overflow-hidden relative transition-all duration-500`}>
          {renderView()}
        </main>
      </div>
      <Toaster richColors position="bottom-right" />
    </>
  );
};

export default App;

