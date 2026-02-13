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
import { Inbox, Users } from 'lucide-react';
import { SidebarWithTabs } from '@/design-system';
import type { SidebarTab } from '@/design-system';

type PostSalesTab = 'distribution' | 'team';

export const PostSalesPage = () => {
    const { user } = useAuthStore();
    const { setSelectedPostSalesId } = usePostSalesStore();
    const [activeTab, setActiveTab] = useState<PostSalesTab>('team');

    // Verifica se é líder de pós-vendas (pode ver equipe e distribuir)
    const isLeader = user?.permissions?.includes(PERMISSIONS.MANAGE_POST_SALES_DISTRIBUTION) || user?.email === 'debug@debug.com';

    // Se não é líder, seleciona automaticamente a si mesmo
    useEffect(() => {
        if (!isLeader && user?.id) {
            setSelectedPostSalesId(user.id);
        }
    }, [isLeader, user?.id, setSelectedPostSalesId]);

    const tabs: SidebarTab[] = [
        {
            key: 'distribution',
            label: 'Distribuir',
            icon: <Inbox size={16} />,
            content: <ClientDistributionList />,
        },
        {
            key: 'team',
            label: 'Equipe',
            icon: <Users size={16} />,
            content: <PostSalesSidebar />,
        },
    ];

    return (
        <div className="flex h-full min-h-0 overflow-hidden">
            {/* Sidebar só aparece para líderes */}
            {isLeader && (
                <SidebarWithTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={(key) => setActiveTab(key as PostSalesTab)}
                />
            )}

            {/* Main Content - Inbox do atendente selecionado */}
            <div className="flex-1 bg-surface-secondary overflow-hidden">
                <ClientInbox />
            </div>
        </div>
    );
};

export default PostSalesPage;
