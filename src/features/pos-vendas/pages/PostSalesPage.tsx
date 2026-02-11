/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - POST SALES PAGE (REFATORADA)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Página principal de pós-vendas
 * 
 * LÍDERES (MANAGE_POST_SALES_DISTRIBUTION):
 *   - Sidebar com tabs: Distribuir | Equipe
 *   - Pode ver inbox de qualquer atendente
 *   - Pode distribuir clientes pendentes
 * 
 * ATENDENTES:
 *   - Só veem seu próprio inbox
 *   - Sem sidebar, vai direto para seus clientes
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePostSalesStore } from '../stores/usePostSalesStore';
import { PostSalesSidebar } from '../components/PostSalesSidebar';
import { ClientDistributionList } from '../components/ClientDistributionList';
import { ClientInbox } from '../components/ClientInbox';
import { PERMISSIONS } from '@/config/permissions';
import { Tabs } from '@/design-system';
import { Inbox, Users } from 'lucide-react';

type PostSalesTab = 'distribution' | 'team';

export const PostSalesPage = () => {
    const { user } = useAuthStore();
    const { setSelectedPostSalesId } = usePostSalesStore();
    const [activeTab, setActiveTab] = useState<PostSalesTab>('team');

    const isLeader = user?.permissions?.includes(PERMISSIONS.MANAGE_POST_SALES_DISTRIBUTION) || user?.role === 'admin';

    useEffect(() => {
        if (!isLeader && user?.id) {
            setSelectedPostSalesId(user.id);
        }
    }, [isLeader, user?.id, setSelectedPostSalesId]);

    return (
        <div className="flex h-full min-h-0 overflow-hidden">
            {isLeader && (
                <div className="flex flex-col w-64 border-r border-border bg-surface-primary">
                    <Tabs
                        value={activeTab}
                        onChange={(v) => setActiveTab(v as PostSalesTab)}
                        variant="underline"
                        size="sm"
                        fullWidth
                        items={[
                            { value: 'distribution', label: 'Distribuir', icon: <Inbox size={16} /> },
                            { value: 'team', label: 'Equipe', icon: <Users size={16} /> },
                        ]}
                    />
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'distribution' ? (
                            <ClientDistributionList />
                        ) : (
                            <PostSalesSidebar />
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 bg-surface-secondary overflow-hidden">
                <ClientInbox />
            </div>
        </div>
    );
};

export default PostSalesPage;

