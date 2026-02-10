
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore } from '../stores/useProductionStore';
import { ProducersSidebar } from '../components/ProducersSidebar';
import { ProjectBoard } from '../components/ProjectBoard';
import { DistributionList } from '../components/DistributionList';
import { PERMISSIONS } from '@/config/permissions';
import { Inbox, LayoutGrid } from 'lucide-react';

type ProductionTab = 'distribution' | 'board';

export const ProductionPage = () => {
    const { user } = useAuthStore();
    const { setSelectedProducerId } = useProductionStore();
    const [activeTab, setActiveTab] = useState<ProductionTab>('board');

    const hasViewAllPermission = user?.permissions?.includes(PERMISSIONS.MANAGE_PROJECTS) || user?.role === 'admin';

    useEffect(() => {
        // Se não tem permissão de ver tudo, seleciona automaticamente a si mesmo
        if (!hasViewAllPermission && user?.id) {
            setSelectedProducerId(user.id);
        }
    }, [hasViewAllPermission, user?.id, setSelectedProducerId]);

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar só aparece se tiver permissão */}
            {hasViewAllPermission && (
                <div className="flex flex-col w-64 border-r border-border bg-surface-primary">
                    {/* Tabs de navegação */}
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActiveTab('distribution')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'distribution'
                                ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-500/5'
                                : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary'
                                }`}
                        >
                            <Inbox size={16} />
                            Distribuir
                        </button>
                        <button
                            onClick={() => setActiveTab('board')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'board'
                                ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-500/5'
                                : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary'
                                }`}
                        >
                            <LayoutGrid size={16} />
                            Equipe
                        </button>
                    </div>

                    {/* Conteúdo da sidebar baseado na tab */}
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
