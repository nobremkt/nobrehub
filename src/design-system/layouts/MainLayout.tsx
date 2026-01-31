
import { Outlet, useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ROUTES } from '@/config';

export function MainLayout() {
    const location = useLocation();

    // Determine if full width based on route
    // Add other full width routes here as needed
    const isFullWidth = location.pathname.startsWith(ROUTES.team.chat) ||
        location.pathname.startsWith(ROUTES.inbox.root);

    return (
        <AppLayout fullWidth={isFullWidth}>
            <Outlet />
        </AppLayout>
    );
}
