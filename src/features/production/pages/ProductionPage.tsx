
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore } from '../stores/useProductionStore';
import { ProducersSidebar } from '../components/ProducersSidebar';
import { ProjectBoard } from '../components/ProjectBoard';
import { DistributionList } from '../components/DistributionList';
import { PERMISSIONS } from '@/config/permissions';
import { Tabs } from '@/design-system';
import { Inbox, LayoutGrid } from 'lucide-react';

type ProductionTab = 'distribution' | 'board';

export const ProductionPage = () => {
    const { user } = useAuthStore();
    const { setSelectedProducerId } = useProductionStore();
    const [activeTab, setActiveTab] = useState<ProductionTab>('board');

    const hasViewAllPermission = user?.permissions?.includes(PERMISSIONS.MANAGE_PROJECTS) || user?.role === 'admin';

    useEffect(() => {
        if (!hasViewAllPermission && user?.id) {
            setSelectedProducerId(user.id);
        }
    }, [hasViewAllPermission, user?.id, setSelectedProducerId]);

    return (
        <div className="flex h-full overflow-hidden">
            {hasViewAllPermission && (
                <div className="flex flex-col w-64 border-r border-border bg-surface-primary">
                    <Tabs
                        value={activeTab}
                        onChange={(v) => setActiveTab(v as ProductionTab)}
                        variant="underline"
                        size="sm"
                        fullWidth
                        items={[
                            { value: 'distribution', label: 'Distribuir', icon: <Inbox size={16} /> },
                            { value: 'board', label: 'Equipe', icon: <LayoutGrid size={16} /> },
                        ]}
                    />
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'distribution' ? (
                            <DistributionList />
                        ) : (
                            <ProducersSidebar />
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 bg-surface-secondary overflow-hidden">
                <ProjectBoard />
            </div>
        </div>
    );
};
