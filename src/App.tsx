import React, { useState } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { AppLayout } from './components/layout';
import NotificationHandler from './components/NotificationHandler';

// Existing Components (will be refactored in later phases)
import Kanban from './components/Kanban';
import LeadList from './components/LeadList';
import { ChatLayout } from './components/chat-layout';
import FlowBuilder from './components/FlowBuilder';
import Analytics from './components/Analytics';
import TeamManagement from './components/TeamManagement';
import PersonalWorkspace from './components/PersonalWorkspace';
import Login from './components/Login';
import SettingsPage from './pages/SettingsPage';

import ContactsView from './pages/ContactsView';
import { Agent } from './types';

// Wrapper component to extract leadId from URL params
const InboxPage: React.FC<{
  userId: string;
  isAdmin: boolean;
  pendingLeadId: string | null;
  onConversationOpened: () => void;
}> = ({ userId, isAdmin, pendingLeadId, onConversationOpened }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const leadIdFromUrl = searchParams.get('leadId');

  // Use URL param if available, otherwise use pendingLeadId from state
  const initialLeadId = leadIdFromUrl || pendingLeadId;

  // Clear URL param after conversation is opened
  const handleConversationOpened = () => {
    if (leadIdFromUrl) {
      setSearchParams({});
    }
    onConversationOpened();
  };

  return (
    <ChatLayout
      userId={userId}
      isAdmin={isAdmin}
      initialLeadId={initialLeadId}
      onConversationOpened={handleConversationOpened}
    />
  );
};

// Helper to get current user from localStorage
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Main App with new layout
const MainApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const currentUser = getCurrentUser();
  const [monitoredUser, setMonitoredUser] = useState<Agent | null>(null);
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);

  const user = {
    name: currentUser?.name || 'Usuário',
    email: currentUser?.email || '',
    role: currentUser?.role || 'agent',
    avatar: currentUser?.avatar,
  };

  // TODO: Get from API
  const unreadCount = 0;
  const notifications = 0;

  return (
    <AppLayout
      user={user}
      unreadCount={unreadCount}
      notifications={notifications}
      onLogout={onLogout}
    >
      <Routes>
        <Route path="/dashboard" element={<Analytics />} />
        <Route path="/kanban" element={
          monitoredUser
            ? <Kanban monitoredUser={monitoredUser} onExitMonitor={() => setMonitoredUser(null)} />
            : <Kanban />
        } />
        <Route path="/inbox" element={
          <InboxPage
            userId={currentUser?.id || ''}
            isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'strategic'}
            pendingLeadId={pendingLeadId}
            onConversationOpened={() => setPendingLeadId(null)}
          />
        } />
        <Route path="/leads" element={<Navigate to="/contatos" replace />} />
        <Route path="/contatos" element={
          <ContactsView onNavigateToChat={(leadId) => {
            setPendingLeadId(leadId || null);
          }} />
        } />
        <Route path="/producao" element={<div className="p-6 text-slate-500">Módulo em desenvolvimento...</div>} />
        <Route path="/equipe" element={<TeamManagement onMonitor={setMonitoredUser} />} />
        <Route path="/automacoes" element={<FlowBuilder />} />
        <Route path="/config/*" element={<SettingsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/personal" element={<PersonalWorkspace />} />
        <Route path="/" element={<Navigate to="/kanban" replace />} />
        <Route path="*" element={<Navigate to="/kanban" replace />} />
      </Routes>
    </AppLayout>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = (token: string, user: any) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  return (
    <FirebaseProvider>
      <NotificationHandler />
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainApp onLogout={handleLogout} />
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster richColors position="bottom-right" />
    </FirebaseProvider>
  );
};

export default App;
