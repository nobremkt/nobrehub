
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore } from '../stores/useProductionStore';
import { ProducersSidebar } from '../components/ProducersSidebar';
import { ProjectBoard } from '../components/ProjectBoard';
import { DistributionList } from '../components/DistributionList';
import { PERMISSIONS } from '@/config/permissions';
import { Inbox, LayoutGrid } from 'lucide-react';
import { SidebarWithTabs } from '@/design-system';
import type { SidebarTab } from '@/design-system';

type ProductionTab = 'distribution' | 'board';

export const ProductionPage = () => {
    const { user } = useAuthStore();
    const { setSelectedProducerId } = useProductionStore();
    const [activeTab, setActiveTab] = useState<ProductionTab>('board');

    const hasViewAllPermission = user?.permissions?.includes(PERMISSIONS.MANAGE_PROJECTS) || user?.email === 'debug@debug.com';

    useEffect(() => {
        // Se não tem permissão de ver tudo, seleciona automaticamente a si mesmo
        if (!hasViewAllPermission && user?.id) {
            setSelectedProducerId(user.id);
        }
    }, [hasViewAllPermission, user?.id, setSelectedProducerId]);

    const tabs: SidebarTab[] = [
        {
            key: 'distribution',
            label: 'Distribuir',
            icon: <Inbox size={16} />,
            content: <DistributionList />,
        },
        {
            key: 'board',
            label: 'Equipe',
            icon: <LayoutGrid size={16} />,
            content: <ProducersSidebar />,
        },
    ];

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar só aparece se tiver permissão */}
            {hasViewAllPermission && (
                <SidebarWithTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={(key) => setActiveTab(key as ProductionTab)}
                />
            )}

            <div className="flex-1 bg-surface-secondary overflow-hidden">
                <ProjectBoard />
            </div>
        </div>
    );
};
