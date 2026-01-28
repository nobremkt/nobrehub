/**
 * SectorDashboard
 * 
 * Main dashboard component for sector-specific analytics.
 * Modular design for easy metric customization.
 */

import React, { useState } from 'react';
import {
    BarChart3, Users, Package, Clock, AlertTriangle,
    TrendingUp, DollarSign, MessageSquare, RefreshCcw
} from 'lucide-react';
import MetricCard from './MetricCard';
import { useSectorMetrics } from '../../hooks/useSectorMetrics';
import { SECTORS } from '../../config/permissions';

type SectorType = 'sales' | 'production';

const SECTOR_OPTIONS: { id: SectorType; label: string }[] = [
    { id: 'sales', label: 'Vendas' },
    { id: 'production', label: 'Produção' }
];

const SectorDashboard: React.FC = () => {
    const [selectedSector, setSelectedSector] = useState<SectorType>('production');
    const { metrics, loading, error, refetch } = useSectorMetrics(selectedSector);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard por Setor</h1>
                    <p className="text-slate-500 mt-1">Métricas e indicadores de performance</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sector Selector */}
                    <select
                        value={selectedSector}
                        onChange={e => setSelectedSector(e.target.value as SectorType)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        {SECTOR_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>

                    {/* Refresh Button */}
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-violet-600 hover:border-violet-300 transition-all disabled:opacity-50"
                    >
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {/* Production Metrics */}
            {selectedSector === 'production' && metrics.production && (
                <div className="space-y-6">
                    {/* Status Cards */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">Projetos por Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                icon={Package}
                                title="Backlog"
                                value={metrics.production.projectsByStatus.backlog || 0}
                                color="slate"
                                loading={loading}
                            />
                            <MetricCard
                                icon={Clock}
                                title="Em Progresso"
                                value={metrics.production.projectsByStatus.doing || 0}
                                color="blue"
                                loading={loading}
                            />
                            <MetricCard
                                icon={AlertTriangle}
                                title="Revisão"
                                value={metrics.production.projectsByStatus.review || 0}
                                color="amber"
                                loading={loading}
                            />
                            <MetricCard
                                icon={TrendingUp}
                                title="Concluídos"
                                value={metrics.production.projectsByStatus.done || 0}
                                color="emerald"
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* KPIs */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">Indicadores</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MetricCard
                                icon={AlertTriangle}
                                title="Projetos Atrasados"
                                value={metrics.production.overdueProjects}
                                subtitle={metrics.production.overdueProjects > 0 ? 'Requerem atenção!' : 'Tudo em dia! 🎉'}
                                color={metrics.production.overdueProjects > 0 ? 'rose' : 'emerald'}
                                loading={loading}
                            />
                            <MetricCard
                                icon={Clock}
                                title="SLA Médio"
                                value={`${metrics.production.avgSLADays} dias`}
                                subtitle="Tempo médio até conclusão"
                                color="violet"
                                loading={loading}
                            />
                            <MetricCard
                                icon={Package}
                                title="Total de Projetos"
                                value={metrics.production.totalProjects}
                                color="blue"
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* Projects by Member */}
                    {metrics.production.projectsByMember.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-700 mb-4">Carga por Membro</h2>
                            <div className="bg-white rounded-2xl border border-slate-100 p-5">
                                <div className="space-y-3">
                                    {metrics.production.projectsByMember.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-slate-700">{member.name}</span>
                                                    <span className="text-sm font-semibold text-slate-900">{member.count}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, (member.count / Math.max(...metrics.production!.projectsByMember.map(m => m.count))) * 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sales Metrics */}
            {selectedSector === 'sales' && metrics.sales && (
                <div className="space-y-6">
                    {/* Main KPIs */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">Visão Geral</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                icon={Users}
                                title="Total de Leads"
                                value={metrics.sales.totalLeads}
                                color="blue"
                                loading={loading}
                            />
                            <MetricCard
                                icon={TrendingUp}
                                title="Taxa de Conversão"
                                value={`${metrics.sales.conversionRate}%`}
                                color="emerald"
                                loading={loading}
                            />
                            <MetricCard
                                icon={DollarSign}
                                title="Valor Total Pipeline"
                                value={formatCurrency(metrics.sales.totalPipelineValue)}
                                color="violet"
                                loading={loading}
                            />
                            <MetricCard
                                icon={MessageSquare}
                                title="Leads Fechados"
                                value={metrics.sales.leadsByStage['fechado'] || 0}
                                color="emerald"
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* Leads by Stage */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">Leads por Estágio</h2>
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(metrics.sales.leadsByStage).map(([stage, count]) => (
                                    <div key={stage} className="text-center p-4 bg-slate-50 rounded-xl">
                                        <p className="text-2xl font-bold text-slate-800">{count}</p>
                                        <p className="text-xs text-slate-500 mt-1 capitalize">{stage.replace('_', ' ')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Leads by Source */}
                    {Object.keys(metrics.sales.leadsBySource).length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-700 mb-4">Leads por Origem</h2>
                            <div className="bg-white rounded-2xl border border-slate-100 p-5">
                                <div className="space-y-3">
                                    {Object.entries(metrics.sales.leadsBySource).map(([source, count]) => (
                                        <div key={source} className="flex items-center gap-4">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-slate-700 capitalize">{source}</span>
                                                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, (count / Math.max(...Object.values(metrics.sales!.leadsBySource))) * 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading && !metrics.production && !metrics.sales && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <MetricCard
                            key={i}
                            icon={BarChart3}
                            title=""
                            value=""
                            loading
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SectorDashboard;
