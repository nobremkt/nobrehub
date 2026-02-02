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
import { IntegrationsPage } from '@/features/settings/pages/IntegrationsPage';
import { CRMPage } from '@/features/crm/pages/CRMPage';
import { DebugUIPage } from '@/pages';
import { MainLayout } from '@/design-system/layouts';
import { Spinner } from '@/design-system';
import { InboxPage } from '@/features/inbox/pages/InboxPage';
import { ProductionPage } from '@/features/production/pages/ProductionPage';
import { OrganizationPage, ProductsPage, LossReasonsPage, SectorsPage, RolesPage, CollaboratorsPage, PermissionsPage } from '@/features/settings/pages';
import { MembersPage, TeamChatPage } from '@/features/team/pages';
import { useThemeApplier } from '@/features/settings/hooks/useThemeApplier';

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

function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
                Página em desenvolvimento
            </p>
        </div>
    );
}

export function App() {
    const { theme, setTheme } = useUIStore();
    const { initAuthListener } = useAuthStore();

    // Inicializa tema ao carregar
    useEffect(() => {
        setTheme(theme);
    }, []);

    // Aplica tema personalizado (Cores)
    useThemeApplier();

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

                {/* Protected Routes with MainLayout */}
                <Route element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }>
                    <Route path={ROUTES.dashboard} element={<DashboardPage />} />

                    <Route path={ROUTES.debug_ui} element={<DebugUIPage />} />

                    <Route path={ROUTES.crm.root + '/*'} element={<CRMPage />} />

                    <Route path={ROUTES.inbox.root + '/*'} element={<InboxPage />} />

                    <Route path={ROUTES.production.root + '/*'} element={<ProductionPage />} />

                    <Route path={ROUTES.postSales.root + '/*'} element={<PlaceholderPage title="Pós-Venda" />} />

                    <Route path={ROUTES.team.members} element={<MembersPage />} />

                    <Route path={ROUTES.team.chat} element={<TeamChatPage />} />

                    <Route path={ROUTES.team.root + '/*'} element={<PlaceholderPage title="Equipe" />} />

                    <Route path={ROUTES.analytics.root + '/*'} element={<PlaceholderPage title="Analytics" />} />

                    {/* Settings */}
                    <Route path={ROUTES.settings.appearance} element={<AppearancePage />} />

                    <Route path={ROUTES.settings.collaborators} element={<CollaboratorsPage />} />

                    <Route path={ROUTES.settings.root + '/*'} element={<PlaceholderPage title="Configurações" />} />

                    <Route path={ROUTES.settings.integrations} element={<IntegrationsPage />} />

                    <Route path={ROUTES.settings.organization} element={<OrganizationPage />} />

                    <Route path={ROUTES.settings.products} element={<ProductsPage />} />

                    <Route path={ROUTES.settings.lossReasons} element={<LossReasonsPage />} />

                    <Route path={ROUTES.settings.sectors} element={<SectorsPage />} />

                    <Route path={ROUTES.settings.roles} element={<RolesPage />} />

                    <Route path={ROUTES.settings.permissions} element={<PermissionsPage />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
            </Routes>
        </BrowserRouter>
    );
}
