
import { Outlet, useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ROUTES } from '@/config';
import { TeamChatListener } from '@/features/team/components/TeamChatListener';

export function MainLayout() {
    const location = useLocation();

    // Determine if full width based on route
    // Add other full width routes here as needed
    const isFullWidth = location.pathname.startsWith(ROUTES.team.chat) ||
        location.pathname.startsWith(ROUTES.inbox.root) ||
        location.pathname.startsWith(ROUTES.production.root) ||
        location.pathname.startsWith(ROUTES.postSales.root);

    return (
        <>
            <TeamChatListener />
            <AppLayout fullWidth={isFullWidth}>
                <Outlet />
            </AppLayout>
        </>
    );
}
