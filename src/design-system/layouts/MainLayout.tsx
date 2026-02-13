
import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ROUTES } from '@/config';
import { TeamChatListener } from '@/features/team/components/TeamChatListener';
import { Spinner } from '@/design-system';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';

export function MainLayout() {
    const location = useLocation();

    // Load pipeline stages globally — they're reference data needed by Kanban, Inbox, Lead360
    useEffect(() => {
        useKanbanStore.getState().fetchStages();
    }, []);

    // Determine if full width based on route
    // Add other full width routes here as needed
    const isFullWidth = location.pathname.startsWith(ROUTES.team.chat) ||
        location.pathname.startsWith(ROUTES.inbox.root) ||
        location.pathname.startsWith(ROUTES.production.root) ||
        location.pathname.startsWith(ROUTES.postSales.root) ||
        location.pathname.startsWith(ROUTES.strategic.root);

    return (
        <>
            <TeamChatListener />
            <AppLayout fullWidth={isFullWidth}>
                <Suspense fallback={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px' }}>
                        <Spinner size="lg" />
                    </div>
                }>
                    <Outlet />
                </Suspense>
            </AppLayout>
        </>
    );
}
