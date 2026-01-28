import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/layout';
import NotificationHandler from './components/NotificationHandler';
import { Loader2 } from 'lucide-react';

// Light components - loaded immediately
import Login from './components/Login';

// Heavy components - lazy loaded for better performance
const Kanban = lazy(() => import('./components/Kanban'));
const LeadList = lazy(() => import('./components/LeadList'));
const ChatLayout = lazy(() => import('./components/chat-layout').then(m => ({ default: m.ChatLayout })));
const FlowBuilder = lazy(() => import('./components/FlowBuilder'));
const Analytics = lazy(() => import('./components/Analytics'));
const TeamManagement = lazy(() => import('./components/TeamManagement'));
const PersonalWorkspace = lazy(() => import('./components/PersonalWorkspace'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ContactsView = lazy(() => import('./pages/ContactsView'));
const SectorDashboard = lazy(() => import('./components/dashboard/SectorDashboard'));

import { Agent } from './types';

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      <span className="text-sm text-slate-400 font-medium">Carregando...</span>
    </div>
  </div>
);

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
    id: currentUser?.id || '',
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/dashboard" element={<Analytics />} />
          <Route path="/dashboard/sector" element={<SectorDashboard />} />

          {/* Board routes - new sector-based navigation */}
          <Route path="/board/:userId" element={
            <Kanban />
          } />
          <Route path="/board/sector/:sectorId" element={
            <Kanban />
          } />

          {/* Legacy kanban route - redirects to user's own board */}
          <Route path="/kanban" element={
            monitoredUser
              ? <Kanban monitoredUser={monitoredUser} onExitMonitor={() => setMonitoredUser(null)} />
              : <Navigate to={`/board/${currentUser?.id || 'me'}`} replace />
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
          <Route path="/" element={<Navigate to={`/board/${currentUser?.id || 'me'}`} replace />} />
          <Route path="*" element={<Navigate to={`/board/${currentUser?.id || 'me'}`} replace />} />
        </Routes>
      </Suspense>
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
