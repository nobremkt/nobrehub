/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - APP COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Componente raiz da aplicação.
 * Configura rotas, tema, e autenticação.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUIStore, useAuthStore } from '@/stores';
import { initFirebase } from '@/config/firebase';
import { ROUTES } from '@/config';
import { LoginPage } from '@/features/auth';
import { DashboardPage } from '@/pages';
import { AppearancePage } from '@/features/settings/pages';
import { CRMPage } from '@/features/crm/pages/CRMPage';
import { DebugUIPage } from '@/pages';
import { AppLayout } from '@/design-system/layouts';
import { Spinner } from '@/design-system';

// Inicializa Firebase no boot
initFirebase();

/**
 * Protected Route wrapper
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, status, initialized } = useAuthStore();

    // Ainda carregando
    if (!initialized || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
                <Spinner size="lg" />
            </div>
        );
    }

    // Não autenticado, redireciona para login
    if (!user || status === 'unauthenticated') {
        return <Navigate to={ROUTES.auth.login} replace />;
    }

    return <>{children}</>;
}

/**
 * Public Route wrapper (redireciona se já logado)
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { user, status, initialized } = useAuthStore();

    // Ainda carregando
    if (!initialized || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
                <Spinner size="lg" />
            </div>
        );
    }

    // Já autenticado, redireciona para dashboard
    if (user && status === 'authenticated') {
        return <Navigate to={ROUTES.dashboard} replace />;
    }

    return <>{children}</>;
}

/**
 * Placeholder page para rotas em desenvolvimento
 */
function PlaceholderPage({ title }: { title: string }) {
    return (
        <AppLayout>
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Página em desenvolvimento
                </p>
            </div>
        </AppLayout>
    );
}

export function App() {
    const { theme, setTheme } = useUIStore();
    const { initAuthListener } = useAuthStore();

    // Inicializa tema ao carregar
    useEffect(() => {
        setTheme(theme);
    }, []);

    // Inicializa listener de autenticação
    useEffect(() => {
        const unsubscribe = initAuthListener();
        return () => unsubscribe();
    }, [initAuthListener]);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path={ROUTES.auth.login} element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                } />

                {/* Protected Routes */}
                <Route path={ROUTES.dashboard} element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.debug_ui} element={
                    <ProtectedRoute>
                        <DebugUIPage />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.crm.root + '/*'} element={
                    <ProtectedRoute>
                        <CRMPage />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.inbox.root + '/*'} element={
                    <ProtectedRoute>
                        <PlaceholderPage title="Inbox" />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.production.root + '/*'} element={
                    <ProtectedRoute>
                        <PlaceholderPage title="Produção" />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.postSales.root + '/*'} element={
                    <ProtectedRoute>
                        <PlaceholderPage title="Pós-Venda" />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.team.root + '/*'} element={
                    <ProtectedRoute>
                        <PlaceholderPage title="Equipe" />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.analytics.root + '/*'} element={
                    <ProtectedRoute>
                        <PlaceholderPage title="Analytics" />
                    </ProtectedRoute>
                } />

                {/* Settings */}
                <Route path={ROUTES.settings.appearance} element={
                    <ProtectedRoute>
                        <AppearancePage />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.settings.collaborators} element={
                    <ProtectedRoute>
                        <PlaceholderPage title="Colaboradores" />
                    </ProtectedRoute>
                } />

                <Route path={ROUTES.settings.root + '/*'} element={
                    <ProtectedRoute>
                        <PlaceholderPage title="Configurações" />
                    </ProtectedRoute>
                } />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
            </Routes>
        </BrowserRouter>
    );
}
