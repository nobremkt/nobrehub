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
    Loader2,
    Target,
    Trophy,
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseGetDashboardStats, DashboardStats } from '../services/supabaseApi';
import { useFirebase } from '../contexts/FirebaseContext';
import { toast } from 'sonner';

const MONTHLY_GOAL = 100000; // R$ 100k goal

const Analytics: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { subscribeToNewLeads, subscribeToLeadUpdates } = useFirebase({ userId: 'dashboard-viewer' });
    const [dateFilter, setDateFilter] = useState('Este Mês');

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

    // Firebase realtime updates
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
    const goalPercentage = Math.min((stats.totalValue / MONTHLY_GOAL) * 100, 100);

    return (
        <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 h-full overflow-y-auto custom-scrollbar">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Dashboard</h1>
                    <p className="text-slate-500 font-medium mt-1">Visão geral de performance e leads</p>
                </div>

                {/* Date Filter Dropdown */}
                <div className="relative">
                    <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                        <Calendar size={16} className="text-indigo-500" />
                        {dateFilter}
                    </button>
                    {/* Only visual for now */}
                </div>
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
                    title="Receita Conquistada"
                    value={`R$ ${stats.totalValue.toLocaleString('pt-BR')}`}
                    icon={<DollarSign size={24} className="text-white" />}
                    color="bg-rose-500"
                    trend="+8%"
                />
                <StatCard
                    title="Taxa de Conversão"
                    value={`${stats.totalLeads ? (((stats.closedLeads || 0) / stats.totalLeads) * 100).toFixed(1) : 0}%`}
                    icon={<TrendingUp size={24} className="text-white" />}
                    color="bg-amber-500"
                    trend="-2%"
                    trendDown
                />
            </div>

            {/* Monthly Goal Widget */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8 relative overflow-hidden"
            >
                <div className="absolute right-0 top-0 p-8 opacity-5">
                    <Target size={120} className="text-emerald-500" />
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                <Trophy size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 uppercase tracking-tight">Meta Mensal</h3>
                        </div>
                        <p className="text-slate-500 text-sm">Progresso atual baseado em vendas fechadas</p>
                    </div>
                    <div className="text-right mt-4 md:mt-0">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                            {goalPercentage.toFixed(1)}%
                        </span>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atingido</p>
                    </div>
                </div>

                <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goalPercentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    />
                </div>

                <div className="flex justify-between mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>R$ 0</span>
                    <span>Meta: R$ {MONTHLY_GOAL.toLocaleString('pt-BR')}</span>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Charts Section - Takes 2/3 */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Pipeline Distribution */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg text-slate-800 mb-6">Distribuição de Pipeline</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pipelineData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40}>
                                        {pipelineData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.type === 'High Ticket' ? '#4f46e5' : '#ec4899'} />
                                        ))}
                                    </Bar>
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
                                    <Tooltip
                                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            {revenueData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                    <span className="text-sm font-medium text-slate-600">
                                        {entry.name} ({stats.totalValue > 0 ? ((entry.value / stats.totalValue) * 100).toFixed(0) : 0}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Feed - Takes 1/3 */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Últimas Vendas</h3>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[600px] overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>

                            <AnimatePresence mode='popLayout'>
                                {(stats.recentSales || []).length > 0 ? (
                                    stats.recentSales?.map((sale) => (
                                        <motion.div
                                            key={sale.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                                            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sale.status === 'High Ticket' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                    <DollarSign size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm truncate max-w-[120px]" title={sale.name}>
                                                        {sale.name}
                                                    </p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">
                                                        {sale.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-black text-slate-900 text-sm">
                                                    R$ {sale.value.toLocaleString('pt-BR')}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-400 text-sm">
                                        Nenhuma venda recente.
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
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
