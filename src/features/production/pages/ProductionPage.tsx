
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore } from '../stores/useProductionStore';
import { ProducersSidebar } from '../components/ProducersSidebar';
import { ProjectBoard } from '../components/ProjectBoard'; // Fixed import path
import { PERMISSIONS } from '@/config/permissions';

export const ProductionPage = () => {
    const { user } = useAuthStore();
    const { setSelectedProducerId } = useProductionStore();

    const hasViewAllPermission = user?.permissions?.includes(PERMISSIONS.MANAGE_PROJECTS) || user?.role === 'admin'; // Fallback for admin if permission logic is strict

    useEffect(() => {
        // Se não tem permissão de ver tudo, seleciona automaticamente a si mesmo
        if (!hasViewAllPermission && user?.id) {
            setSelectedProducerId(user.id);
        }
    }, [hasViewAllPermission, user?.id, setSelectedProducerId]);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar só aparece se tiver permissão */}
            {hasViewAllPermission && <ProducersSidebar />}

            <div className="flex-1 bg-surface-secondary overflow-hidden">
                <ProjectBoard />
            </div>
        </div>
    );
};
