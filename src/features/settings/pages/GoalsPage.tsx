/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOALS PAGE (METAS)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Painel universal de metas — Produção, Vendas, Pós-Vendas e Estratégico
 */

import React, { useState } from 'react';
import { Spinner } from '@/design-system';
import { Package, DollarSign, Users, Briefcase } from 'lucide-react';
import { useGoalsForm, type SectorTab } from './useGoalsForm';
import { ProducaoGoalsTab } from './ProducaoGoalsTab';
import { VendasGoalsTab, PosVendasGoalsTab, EstrategicoGoalsTab } from './SectorGoalsTabs';

interface SectorTabItem {
    id: SectorTab;
    label: string;
    icon: React.ReactNode;
    color: string;
}

const SECTOR_TABS: SectorTabItem[] = [
    { id: 'producao', label: 'Produção', icon: <Package size={16} />, color: 'var(--color-info-500)' },
    { id: 'vendas', label: 'Vendas', icon: <DollarSign size={16} />, color: 'var(--color-success-500)' },
    { id: 'pos-vendas', label: 'Pós-Vendas', icon: <Users size={16} />, color: 'var(--color-warning-500)' },
    { id: 'estrategico', label: 'Estratégico', icon: <Briefcase size={16} />, color: 'var(--color-primary-500)' },
];

export const GoalsPage: React.FC = () => {
    const form = useGoalsForm();
    const [activeSector, setActiveSector] = useState<SectorTab>('producao');

    if (form.isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    🎯 Metas
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Configure as metas de cada setor da equipe.
                </p>
            </div>

            {/* Sector Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.25rem',
                padding: '4px',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.5rem',
                overflowX: 'auto',
            }}>
                {SECTOR_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSector(tab.id)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: activeSector === tab.id ? '600' : '500',
                            color: activeSector === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            background: activeSector === tab.id ? 'var(--color-surface)' : 'transparent',
                            boxShadow: activeSector === tab.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span style={{ color: activeSector === tab.id ? tab.color : 'inherit' }}>
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content per sector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {activeSector === 'producao' && (
                    <ProducaoGoalsTab
                        tempDailyGoal={form.tempDailyGoal}
                        setTempDailyGoal={form.setTempDailyGoal}
                        dailyGoal={form.dailyGoal}
                        isSaving={form.isSaving}
                        handleSaveDailyGoal={form.handleSaveDailyGoal}
                        isLoadingProducts={form.isLoadingProducts}
                        activeProducts={form.activeProducts}
                        productPoints={form.productPoints}
                        handlePointChange={form.handlePointChange}
                        videoPoints={form.videoPoints}
                        setVideoPoints={form.setVideoPoints}
                        isSavingPoints={form.isSavingPoints}
                        hasPointsChanges={form.hasPointsChanges}
                        handleSavePoints={form.handleSavePoints}
                    />
                )}

                {activeSector === 'vendas' && (
                    <VendasGoalsTab
                        salesGoals={form.salesGoals}
                        setSalesGoals={form.setSalesGoals}
                        isSavingSector={form.isSavingSector}
                        handleSaveSectorGoals={form.handleSaveSectorGoals}
                    />
                )}

                {activeSector === 'pos-vendas' && (
                    <PosVendasGoalsTab
                        postSalesGoals={form.postSalesGoals}
                        setPostSalesGoals={form.setPostSalesGoals}
                        isSavingSector={form.isSavingSector}
                        handleSaveSectorGoals={form.handleSaveSectorGoals}
                    />
                )}

                {activeSector === 'estrategico' && (
                    <EstrategicoGoalsTab
                        strategicGoals={form.strategicGoals}
                        setStrategicGoals={form.setStrategicGoals}
                        isSavingSector={form.isSavingSector}
                        handleSaveSectorGoals={form.handleSaveSectorGoals}
                    />
                )}
            </div>
        </div>
    );
};
