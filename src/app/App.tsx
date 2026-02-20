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

import { useEffect, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUIStore, useAuthStore } from '@/stores';
import { initFirebase } from '@/config/firebase';
import { ROUTES } from '@/config';
import { LoginPage } from '@/features/auth';
import { MainLayout } from '@/design-system/layouts';
import { Spinner } from '@/design-system';
import { useThemeApplier } from '@/features/settings/hooks/useThemeApplier';
import { usePresence } from '@/features/presence/hooks/usePresence';
import { Agentation } from 'agentation';

// ─── Lazy-loaded route-level pages ───────────────────────────────────────────

const DashboardPage = lazy(() => import('@/features/dashboard').then(m => ({ default: m.DashboardPage })));
const CRMPage = lazy(() => import('@/features/crm/pages/CRMPage').then(m => ({ default: m.CRMPage })));
const InboxPage = lazy(() => import('@/features/inbox/pages/InboxPage').then(m => ({ default: m.InboxPage })));
const ProductionPage = lazy(() => import('@/features/production/pages/ProductionPage').then(m => ({ default: m.ProductionPage })));
const PostSalesPage = lazy(() => import('@/features/pos-vendas/pages/PostSalesPage').then(m => ({ default: m.PostSalesPage })));
const PublicProjectStatusPage = lazy(() => import('@/features/production/pages/PublicProjectStatusPage').then(m => ({ default: m.PublicProjectStatusPage })));
const MembersPage = lazy(() => import('@/features/team/pages').then(m => ({ default: m.MembersPage })));
const TeamChatPage = lazy(() => import('@/features/team/pages').then(m => ({ default: m.TeamChatPage })));
const NotesPage = lazy(() => import('@/features/strategic/pages').then(m => ({ default: m.NotesPage })));
const StrategicProjectsPage = lazy(() => import('@/features/strategic/pages').then(m => ({ default: m.StrategicProjectsPage })));
const SocialMediaPage = lazy(() => import('@/features/strategic/pages').then(m => ({ default: m.SocialMediaPage })));

// Financial pages
const CashFlowPage = lazy(() => import('@/features/financial').then(m => ({ default: m.CashFlowPage })));
const TransactionsPage = lazy(() => import('@/features/financial').then(m => ({ default: m.TransactionsPage })));
const CategoriesPage = lazy(() => import('@/features/financial').then(m => ({ default: m.CategoriesPage })));

// Settings pages
const AppearancePage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.AppearancePage })));
const IntegrationsPage = lazy(() => import('@/features/settings/pages/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const OrganizationPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.OrganizationPage })));
const ProductsPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.ProductsPage })));
const LossReasonsPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.LossReasonsPage })));
const SectorsPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.SectorsPage })));
const RolesPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.RolesPage })));
const CollaboratorsPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.CollaboratorsPage })));
const PermissionsPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.PermissionsPage })));
const GoalsPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.GoalsPage })));
const HolidaysPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.HolidaysPage })));
const LeadDistributionPage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.LeadDistributionPage })));
const PipelinePage = lazy(() => import('@/features/settings/pages').then(m => ({ default: m.PipelinePage })));

// Studio pages
const ImageGeneratorPage = lazy(() => import('@/features/studio/pages').then(m => ({ default: m.ImageGeneratorPage })));
const WipPage = lazy(() => import('@/features/studio/pages').then(m => ({ default: m.WipPage })));
const ImageStylesPage = lazy(() => import('@/features/studio/pages').then(m => ({ default: m.ImageStylesPage })));
const GalleryPage = lazy(() => import('@/features/studio/pages').then(m => ({ default: m.GalleryPage })));

// Debug pages (not lazy — lightweight and rarely used)
import { DebugUIPage, DataImportPage, DatabasePage } from '@/pages';

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

    // Monitora presença online/offline/idle
    usePresence();

    // Inicializa listener de autenticação
    useEffect(() => {
        const unsubscribe = initAuthListener();
        return () => unsubscribe();
    }, [initAuthListener]);

    return (
        <>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    {/* Public project status page (no authentication required) */}
                    <Route path="/status/projeto/:token" element={<PublicProjectStatusPage />} />

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
                        <Route path={ROUTES.data_import} element={<DataImportPage />} />
                        <Route path={ROUTES.debug_integrations} element={<IntegrationsPage />} />
                        <Route path={ROUTES.debug_database} element={<DatabasePage />} />
                        <Route path={ROUTES.debug_imageStyles} element={<ImageStylesPage />} />

                        <Route path={ROUTES.crm.root + '/*'} element={<CRMPage />} />

                        <Route path={ROUTES.inbox.root + '/*'} element={<InboxPage />} />

                        <Route path={ROUTES.production.root + '/*'} element={<ProductionPage />} />

                        <Route path={ROUTES.postSales.root + '/*'} element={<PostSalesPage />} />

                        <Route path={ROUTES.team.members} element={<MembersPage />} />

                        <Route path={ROUTES.team.chat} element={<TeamChatPage />} />
                        <Route path={ROUTES.team.chat + '/:chatId'} element={<TeamChatPage />} />

                        <Route path={ROUTES.team.root + '/*'} element={<PlaceholderPage title="Equipe" />} />

                        <Route path={ROUTES.analytics.root + '/*'} element={<PlaceholderPage title="Analytics" />} />

                        {/* Strategic */}
                        <Route path={ROUTES.strategic.notes} element={<NotesPage />} />
                        <Route path={ROUTES.strategic.projects} element={<StrategicProjectsPage />} />
                        <Route path={ROUTES.strategic.socialMedia} element={<SocialMediaPage />} />

                        {/* Financeiro */}
                        <Route path={ROUTES.financial.cashFlow} element={<CashFlowPage />} />
                        <Route path={ROUTES.financial.transactions} element={<TransactionsPage />} />
                        <Route path={ROUTES.financial.categories} element={<CategoriesPage />} />

                        {/* Estúdio de Criação */}
                        <Route path={ROUTES.studio.imageGenerator} element={<ImageGeneratorPage />} />
                        <Route path={ROUTES.studio.videoGenerator} element={<WipPage title="Gerador de Vídeos" />} />
                        <Route path={ROUTES.studio.scriptGenerator} element={<WipPage title="Gerador de Roteiros" />} />
                        <Route path={ROUTES.studio.logos} element={<WipPage title="Logotipos" />} />
                        <Route path={ROUTES.studio.mascot} element={<WipPage title="Mascote" />} />
                        <Route path={ROUTES.studio.gallery} element={<GalleryPage />} />

                        {/* Settings */}
                        <Route path={ROUTES.settings.appearance} element={<AppearancePage />} />

                        <Route path={ROUTES.settings.collaborators} element={<CollaboratorsPage />} />

                        <Route path={ROUTES.settings.root + '/*'} element={<PlaceholderPage title="Configurações" />} />

                        {/* Integrations moved to Debug category */}

                        <Route path={ROUTES.settings.organization} element={<OrganizationPage />} />

                        <Route path={ROUTES.settings.products} element={<ProductsPage />} />

                        <Route path={ROUTES.settings.lossReasons} element={<LossReasonsPage />} />

                        <Route path={ROUTES.settings.sectors} element={<SectorsPage />} />

                        <Route path={ROUTES.settings.roles} element={<RolesPage />} />

                        <Route path={ROUTES.settings.permissions} element={<PermissionsPage />} />

                        <Route path={ROUTES.settings.goals} element={<GoalsPage />} />

                        <Route path={ROUTES.settings.holidays} element={<HolidaysPage />} />

                        <Route path={ROUTES.settings.leadDistribution} element={<LeadDistributionPage />} />

                        <Route path={ROUTES.settings.pipeline} element={<PipelinePage />} />
                    </Route>

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
                </Routes>
            </BrowserRouter>

            {/* Agentation: Ferramenta de feedback visual para agentes de IA */}
            {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
        </>
    );
}
