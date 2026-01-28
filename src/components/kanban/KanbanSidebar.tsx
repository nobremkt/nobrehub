import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Factory,
    HeartHandshake,
    Layers,
    Globe,
    Instagram,
    MessageCircle,
    Users,
    ChevronRight,
    ChevronDown,
    Sparkles,
    User
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { canSeeAllUsersInSector } from '../../config/permissions';

interface UserBoard {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    leadCount: number;
}

interface KanbanSidebarProps {
    currentPipeline: 'sales' | 'production' | 'post_sales';
    salesSubPipeline: 'high_ticket' | 'low_ticket';
    onPipelineChange: (pipeline: 'sales' | 'production' | 'post_sales') => void;
    onSubPipelineChange: (sub: 'high_ticket' | 'low_ticket') => void;
    pipelineCounts: {
        high_ticket: number;
        low_ticket: number;
        production: number;
        post_sales: number;
    };
    sourceFilters: { source: string; count: number }[];
    activeSourceFilter: string;
    onSourceFilterChange: (source: string) => void;
    // New props for board filtering
    currentUser: { id: string; role: string } | null;
    selectedUserId: string | null;
    onUserFilterChange: (userId: string | null) => void;
    isCollapsed?: boolean;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
    instagram: <Instagram size={14} />,
    whatsapp: <MessageCircle size={14} />,
    website: <Globe size={14} />,
    indicacao: <Users size={14} />,
    outro: <Sparkles size={14} />,
};

export const KanbanSidebar: React.FC<KanbanSidebarProps> = ({
    currentPipeline,
    salesSubPipeline,
    onPipelineChange,
    onSubPipelineChange,
    pipelineCounts,
    sourceFilters,
    activeSourceFilter,
    onSourceFilterChange,
    currentUser,
    selectedUserId,
    onUserFilterChange,
    isCollapsed = false,
}) => {
    // State for user boards
    const [htUsers, setHtUsers] = useState<UserBoard[]>([]);
    const [ltUsers, setLtUsers] = useState<UserBoard[]>([]);
    const [productionUsers, setProductionUsers] = useState<UserBoard[]>([]);
    const [postSalesUsers, setPostSalesUsers] = useState<UserBoard[]>([]);

    // Expansion state
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        sales: true,
        high_ticket: true,
        low_ticket: true,
        production: false,
        post_sales: false
    });

    const canSeeAllUsers = currentUser ? canSeeAllUsersInSector(currentUser.role) : false;

    // Fetch users by pipeline type
    useEffect(() => {
        async function fetchUsers() {
            try {
                // Fetch all active users
                const { data: users, error } = await supabase
                    .from('users')
                    .select('id, name, avatar, role')
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;

                // Fetch lead counts
                const { data: leadCounts } = await supabase
                    .from('leads')
                    .select('assigned_to, pipeline');

                const countMap: Record<string, Record<string, number>> = {};
                (leadCounts || []).forEach((l: any) => {
                    if (!l.assigned_to) return;
                    if (!countMap[l.assigned_to]) countMap[l.assigned_to] = {};
                    countMap[l.assigned_to][l.pipeline] = (countMap[l.assigned_to][l.pipeline] || 0) + 1;
                });

                // Fetch project counts for production
                const { data: projectCounts } = await supabase
                    .from('projects')
                    .select('assigned_to');

                const projectCountMap: Record<string, number> = {};
                (projectCounts || []).forEach((p: any) => {
                    if (p.assigned_to) {
                        projectCountMap[p.assigned_to] = (projectCountMap[p.assigned_to] || 0) + 1;
                    }
                });

                // Group by role
                const ht: UserBoard[] = [];
                const lt: UserBoard[] = [];
                const prod: UserBoard[] = [];
                const post: UserBoard[] = [];

                (users || []).forEach((u: any) => {
                    const userBoard: UserBoard = {
                        id: u.id,
                        name: u.name || 'Sem nome',
                        avatar: u.avatar,
                        role: u.role,
                        leadCount: 0
                    };

                    // HT users (closer_ht, sdr, manager_sales)
                    if (['closer_ht', 'sdr', 'manager_sales'].includes(u.role)) {
                        ht.push({
                            ...userBoard,
                            leadCount: countMap[u.id]?.high_ticket || 0
                        });
                    }

                    // LT users (closer_lt, sdr, manager_sales) 
                    if (['closer_lt', 'sdr', 'manager_sales'].includes(u.role)) {
                        lt.push({
                            ...userBoard,
                            leadCount: countMap[u.id]?.low_ticket || 0
                        });
                    }

                    // Production users
                    if (['production', 'manager_production'].includes(u.role)) {
                        prod.push({
                            ...userBoard,
                            leadCount: projectCountMap[u.id] || 0
                        });
                    }

                    // Post-sales users
                    if (['post_sales'].includes(u.role)) {
                        post.push({
                            ...userBoard,
                            leadCount: countMap[u.id]?.post_sales || 0
                        });
                    }
                });

                setHtUsers(ht);
                setLtUsers(lt);
                setProductionUsers(prod);
                setPostSalesUsers(post);
            } catch (err) {
                console.error('Failed to fetch users for sidebar:', err);
            }
        }

        fetchUsers();
    }, []);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const colorClasses = {
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', activeBg: 'bg-rose-100', hoverBg: 'hover:bg-rose-50' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', activeBg: 'bg-blue-100', hoverBg: 'hover:bg-blue-50' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-100', hoverBg: 'hover:bg-amber-50' },
    };

    // Render user list for a pipeline
    const renderUserList = (users: UserBoard[], pipeline: string) => {
        // Filter users if not admin/manager
        let visibleUsers = users;
        if (!canSeeAllUsers && currentUser) {
            visibleUsers = users.filter(u => u.id === currentUser.id);
        }

        if (visibleUsers.length === 0) return null;

        return (
            <div className="ml-4 mt-1 space-y-0.5">
                {/* Ver Todos option */}
                {canSeeAllUsers && (
                    <button
                        onClick={() => onUserFilterChange(null)}
                        className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm',
                            selectedUserId === null && currentPipeline === (pipeline === 'high_ticket' || pipeline === 'low_ticket' ? 'sales' : pipeline)
                                ? 'bg-violet-100 text-violet-700 font-medium'
                                : 'text-slate-500 hover:bg-slate-50'
                        )}
                    >
                        <Globe size={14} />
                        <span className="flex-1 text-left">Ver Todos</span>
                    </button>
                )}

                {/* User boards */}
                {visibleUsers.map(user => (
                    <button
                        key={user.id}
                        onClick={() => onUserFilterChange(user.id)}
                        className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm',
                            selectedUserId === user.id
                                ? 'bg-violet-100 text-violet-700 font-medium'
                                : 'text-slate-500 hover:bg-slate-50'
                        )}
                    >
                        {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                            <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                                <User size={12} className="text-slate-500" />
                            </div>
                        )}
                        <span className="flex-1 text-left truncate">{user.name}</span>
                        <span className="text-xs font-medium text-slate-400">{user.leadCount}</span>
                    </button>
                ))}
            </div>
        );
    };

    if (isCollapsed) {
        return (
            <aside className="w-16 bg-white border-r border-slate-200 flex flex-col py-6 gap-2">
                <button
                    onClick={() => onPipelineChange('sales')}
                    className={cn(
                        'mx-2 p-3 rounded-xl transition-all flex items-center justify-center',
                        currentPipeline === 'sales' ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:bg-rose-50'
                    )}
                    title="Vendas"
                >
                    <DollarSign size={18} />
                </button>
                <button
                    onClick={() => onPipelineChange('production')}
                    className={cn(
                        'mx-2 p-3 rounded-xl transition-all flex items-center justify-center',
                        currentPipeline === 'production' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-blue-50'
                    )}
                    title="Produção"
                >
                    <Factory size={18} />
                </button>
                <button
                    onClick={() => onPipelineChange('post_sales')}
                    className={cn(
                        'mx-2 p-3 rounded-xl transition-all flex items-center justify-center',
                        currentPipeline === 'post_sales' ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-amber-50'
                    )}
                    title="Pós-Venda"
                >
                    <HeartHandshake size={18} />
                </button>
            </aside>
        );
    }

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
            {/* Header */}
            <div className="px-5 py-6 border-b border-slate-100">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Boards</h2>
            </div>

            {/* Board List */}
            <div className="flex-1 overflow-y-auto py-3">
                <nav className="space-y-1 px-3">
                    {/* VENDAS Section */}
                    <div>
                        <button
                            onClick={() => {
                                onPipelineChange('sales');
                                toggleSection('sales');
                            }}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group',
                                currentPipeline === 'sales'
                                    ? 'bg-rose-100 text-rose-600'
                                    : 'text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            <span className={cn(
                                'p-2 rounded-lg transition-colors',
                                currentPipeline === 'sales' ? 'bg-rose-50' : 'bg-slate-100 group-hover:bg-slate-200'
                            )}>
                                <DollarSign size={18} />
                            </span>
                            <span className="flex-1 text-left text-sm font-semibold">Vendas</span>
                            <span className={cn(
                                'text-xs font-bold px-2 py-0.5 rounded-full',
                                currentPipeline === 'sales' ? 'bg-white/50' : 'bg-slate-100 text-slate-500'
                            )}>
                                {pipelineCounts.high_ticket + pipelineCounts.low_ticket}
                            </span>
                            {expandedSections.sales ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {/* HT/LT Sub-pipelines */}
                        {expandedSections.sales && (
                            <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                {/* High Ticket */}
                                <div>
                                    <button
                                        onClick={() => {
                                            onPipelineChange('sales');
                                            onSubPipelineChange('high_ticket');
                                            toggleSection('high_ticket');
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                                            currentPipeline === 'sales' && salesSubPipeline === 'high_ticket'
                                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20'
                                                : 'text-slate-500 hover:bg-slate-50'
                                        )}
                                    >
                                        <Layers size={14} />
                                        <span className="flex-1 text-left font-medium">High Ticket</span>
                                        <span className={cn(
                                            'text-xs font-bold px-2 py-0.5 rounded-full',
                                            currentPipeline === 'sales' && salesSubPipeline === 'high_ticket' ? 'bg-white/20' : 'bg-slate-100'
                                        )}>
                                            {pipelineCounts.high_ticket}
                                        </span>
                                        {expandedSections.high_ticket ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </button>

                                    {/* HT Users */}
                                    {expandedSections.high_ticket && currentPipeline === 'sales' && salesSubPipeline === 'high_ticket' && (
                                        renderUserList(htUsers, 'high_ticket')
                                    )}
                                </div>

                                {/* Low Ticket */}
                                <div>
                                    <button
                                        onClick={() => {
                                            onPipelineChange('sales');
                                            onSubPipelineChange('low_ticket');
                                            toggleSection('low_ticket');
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                                            currentPipeline === 'sales' && salesSubPipeline === 'low_ticket'
                                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20'
                                                : 'text-slate-500 hover:bg-slate-50'
                                        )}
                                    >
                                        <Layers size={14} />
                                        <span className="flex-1 text-left font-medium">Low Ticket</span>
                                        <span className={cn(
                                            'text-xs font-bold px-2 py-0.5 rounded-full',
                                            currentPipeline === 'sales' && salesSubPipeline === 'low_ticket' ? 'bg-white/20' : 'bg-slate-100'
                                        )}>
                                            {pipelineCounts.low_ticket}
                                        </span>
                                        {expandedSections.low_ticket ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </button>

                                    {/* LT Users */}
                                    {expandedSections.low_ticket && currentPipeline === 'sales' && salesSubPipeline === 'low_ticket' && (
                                        renderUserList(ltUsers, 'low_ticket')
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PRODUÇÃO Section */}
                    <div>
                        <button
                            onClick={() => {
                                onPipelineChange('production');
                                toggleSection('production');
                            }}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group',
                                currentPipeline === 'production'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            <span className={cn(
                                'p-2 rounded-lg transition-colors',
                                currentPipeline === 'production' ? 'bg-blue-50' : 'bg-slate-100 group-hover:bg-slate-200'
                            )}>
                                <Factory size={18} />
                            </span>
                            <span className="flex-1 text-left text-sm font-semibold">Produção</span>
                            <span className={cn(
                                'text-xs font-bold px-2 py-0.5 rounded-full',
                                currentPipeline === 'production' ? 'bg-white/50' : 'bg-slate-100 text-slate-500'
                            )}>
                                {pipelineCounts.production}
                            </span>
                            {expandedSections.production ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {/* Production Users */}
                        {expandedSections.production && currentPipeline === 'production' && (
                            renderUserList(productionUsers, 'production')
                        )}
                    </div>

                    {/* PÓS-VENDA Section */}
                    <div>
                        <button
                            onClick={() => {
                                onPipelineChange('post_sales');
                                toggleSection('post_sales');
                            }}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group',
                                currentPipeline === 'post_sales'
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            <span className={cn(
                                'p-2 rounded-lg transition-colors',
                                currentPipeline === 'post_sales' ? 'bg-amber-50' : 'bg-slate-100 group-hover:bg-slate-200'
                            )}>
                                <HeartHandshake size={18} />
                            </span>
                            <span className="flex-1 text-left text-sm font-semibold">Pós-Venda</span>
                            <span className={cn(
                                'text-xs font-bold px-2 py-0.5 rounded-full',
                                currentPipeline === 'post_sales' ? 'bg-white/50' : 'bg-slate-100 text-slate-500'
                            )}>
                                {pipelineCounts.post_sales}
                            </span>
                            {expandedSections.post_sales ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {/* Post-sales Users */}
                        {expandedSections.post_sales && currentPipeline === 'post_sales' && (
                            renderUserList(postSalesUsers, 'post_sales')
                        )}
                    </div>
                </nav>

                {/* Divider */}
                <div className="my-5 mx-5 border-t border-slate-100" />

                {/* Quick Filters: Sources */}
                <div className="px-5">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        Filtro por Origem
                    </h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => onSourceFilterChange('')}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                                activeSourceFilter === ''
                                    ? 'bg-slate-100 text-slate-900 font-semibold'
                                    : 'text-slate-500 hover:bg-slate-50'
                            )}
                        >
                            <Globe size={14} />
                            <span className="flex-1 text-left">Todas as origens</span>
                        </button>
                        {sourceFilters.slice(0, 5).map(source => {
                            const isActive = activeSourceFilter === source.source;
                            return (
                                <button
                                    key={source.source}
                                    onClick={() => onSourceFilterChange(source.source)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                                        isActive
                                            ? 'bg-violet-100 text-violet-700 font-semibold'
                                            : 'text-slate-500 hover:bg-slate-50'
                                    )}
                                >
                                    {SOURCE_ICONS[source.source.toLowerCase()] || <Globe size={14} />}
                                    <span className="flex-1 text-left capitalize">{source.source}</span>
                                    <span className="text-xs font-medium text-slate-400">{source.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Total no funil</span>
                    <span className="text-slate-900 font-bold">
                        {pipelineCounts.high_ticket + pipelineCounts.low_ticket + pipelineCounts.production + pipelineCounts.post_sales} leads
                    </span>
                </div>
            </div>
        </aside>
    );
};

export default KanbanSidebar;
