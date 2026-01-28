
import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Users,
    DollarSign,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import { supabaseGetDashboardStats, DashboardStats } from '../services/supabaseApi';
import { useFirebase } from '../contexts/FirebaseContext';
import { toast } from 'sonner';

const Analytics: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { subscribeToNewLeads, subscribeToLeadUpdates, isConnected } = useFirebase({ userId: 'dashboard-viewer' });

    const loadStats = async () => {
        try {
            const data = await supabaseGetDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
            toast.error('Erro ao carregar dados do dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    // Firebase realtime updates: Refetch when leads change
    useEffect(() => {
        const handleUpdate = () => {
            console.log('🔥 Lead change detected, refreshing dashboard...');
            loadStats();
        };

        const unsubNewLeads = subscribeToNewLeads(handleUpdate);
        const unsubLeadUpdates = subscribeToLeadUpdates(handleUpdate);

        return () => {
            unsubNewLeads();
            unsubLeadUpdates();
        };
    }, [subscribeToNewLeads, subscribeToLeadUpdates]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!stats) return null;

    // Data transformation for charts
    const pipelineData = [
        ...stats.highTicket.map(s => ({ name: `HT: ${s.status}`, value: s.count, type: 'High Ticket' })),
        ...stats.lowTicket.map(s => ({ name: `LT: ${s.status}`, value: s.count, type: 'Low Ticket' }))
    ];

    const revenueData = [
        { name: 'High Ticket', value: stats.highTicket.reduce((acc, curr) => acc + curr.value, 0) },
        { name: 'Low Ticket', value: stats.lowTicket.reduce((acc, curr) => acc + curr.value, 0) }
    ];

    const COLORS = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b'];

    return (
        <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Dashboard</h1>
                <p className="text-slate-500 font-medium mt-1">Visão geral de performance e leads</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total de Leads"
                    value={stats.totalLeads}
                    icon={<Users size={24} className="text-white" />}
                    color="bg-indigo-500"
                    trend="+12%"
                />
                <StatCard
                    title="Vendas (Hoje)"
                    value={stats.closedLeads}
                    icon={<Activity size={24} className="text-white" />}
                    color="bg-emerald-500"
                    trend="+5%"
                />
                <StatCard
                    title="Receita Total"
                    value={`R$ ${stats.totalValue.toLocaleString('pt-BR')}`}
                    icon={<DollarSign size={24} className="text-white" />}
                    color="bg-rose-500"
                    trend="+8%"
                />
                <StatCard
                    title="Taxa de Conversão"
                    value={`${(((stats.closedLeads || 0) / (stats.totalLeads || 1)) * 100).toFixed(1)}%`}
                    icon={<TrendingUp size={24} className="text-white" />}
                    color="bg-amber-500"
                    trend="-2%"
                    trendDown
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Pipeline Distribution */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">Distribuição de Pipeline</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">Receita por Produto</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {revenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        {revenueData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                <span className="text-sm font-medium text-slate-600">
                                    {entry.name} ({((entry.value / stats.totalValue) * 100).toFixed(0)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity Mock (To be implemented real API later) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Atividade Recente</h3>
                    <button className="text-sm text-indigo-600 font-bold hover:text-indigo-700">Ver tudo</button>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Nova venda realizada</p>
                                    <p className="text-xs text-slate-500">Lead High Ticket finalizado com sucesso</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-400">Há 2h</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Sub-component for Cards
const StatCard = ({ title, value, icon, color, trend, trendDown = false }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color.replace('bg-', 'text-')}`}>
            {icon}
        </div>
        <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl shadow-lg shadow-indigo-500/20 ${color}`}>
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendDown ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {trendDown ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    {trend}
                </div>
            )}
        </div>
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        </div>
    </div>
);

export default Analytics;
