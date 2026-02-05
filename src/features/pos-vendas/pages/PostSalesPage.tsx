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

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePostSalesStore } from '../stores/usePostSalesStore';
import { PostSalesSidebar } from '../components/PostSalesSidebar';
import { ClientDistributionList } from '../components/ClientDistributionList';
import { ClientInbox } from '../components/ClientInbox';
import { PERMISSIONS } from '@/config/permissions';
import { Inbox, Users } from 'lucide-react';
import { useState } from 'react';

type PostSalesTab = 'distribution' | 'team';

export const PostSalesPage = () => {
    const { user } = useAuthStore();
    const { setSelectedPostSalesId } = usePostSalesStore();
    const [activeTab, setActiveTab] = useState<PostSalesTab>('team');

    // Verifica se é líder de pós-vendas (pode ver equipe e distribuir)
    const isLeader = user?.permissions?.includes(PERMISSIONS.MANAGE_POST_SALES_DISTRIBUTION) || user?.role === 'admin';

    // Se não é líder, seleciona automaticamente a si mesmo
    useEffect(() => {
        if (!isLeader && user?.id) {
            setSelectedPostSalesId(user.id);
        }
    }, [isLeader, user?.id, setSelectedPostSalesId]);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar só aparece para líderes */}
            {isLeader && (
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
                            onClick={() => setActiveTab('team')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'team'
                                    ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-500/5'
                                    : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary'
                                }`}
                        >
                            <Users size={16} />
                            Equipe
                        </button>
                    </div>

                    {/* Conteúdo da sidebar baseado na tab */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'distribution' ? (
                            <ClientDistributionList />
                        ) : (
                            <PostSalesSidebar />
                        )}
                    </div>
                </div>
            )}

            {/* Main Content - Inbox do atendente selecionado */}
            <div className="flex-1 bg-surface-secondary overflow-hidden">
                <ClientInbox />
            </div>
        </div>
    );
};

export default PostSalesPage;
