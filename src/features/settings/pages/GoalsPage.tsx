/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOALS PAGE (METAS)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Painel universal de metas — Produção, Vendas, Pós-Vendas e Estratégico
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardBody, Input, Button, Spinner } from '@/design-system';
import {
    Target, Save, Package, TrendingUp, DollarSign,
    Users, Briefcase, BarChart3, Zap
} from 'lucide-react';
import { useGoalsStore } from '../stores/useGoalsStore';
import { useProductStore } from '../stores/useProductStore';
import { toast } from 'react-toastify';
import { GoalsService, type GoalsConfig } from '../services/goalsService';

type SectorTab = 'producao' | 'vendas' | 'pos-vendas' | 'estrategico';

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
    const { config, isLoading, isSaving, init, setDailyGoal, setVideoDurationPoints } = useGoalsStore();
    const { products, fetchProducts, updateProductPoints, isLoading: isLoadingProducts } = useProductStore();

    const [activeSector, setActiveSector] = useState<SectorTab>('producao');
    const [tempDailyGoal, setTempDailyGoal] = useState<string>('');

    // Product points state
    const [productPoints, setProductPoints] = useState<Record<string, number>>({});
    const [isSavingPoints, setIsSavingPoints] = useState(false);

    // Sector-specific goals state
    const [salesGoals, setSalesGoals] = useState({
        monthlyRevenue: '',
        leadsConverted: '',
        conversionRate: '',
    });
    const [postSalesGoals, setPostSalesGoals] = useState({
        monthlyClients: '',
        satisfactionRate: '',
        responseTime: '',
    });
    const [strategicGoals, setStrategicGoals] = useState({
        monthlyNotes: '',
        weeklyReviews: '',
    });
    const [isSavingSector, setIsSavingSector] = useState(false);

    // Video duration points state
    const [videoPoints, setVideoPoints] = useState<{ '30s': number; '60s': number; '60plus': number }>({
        '30s': 1, '60s': 2, '60plus': 3
    });

    useEffect(() => {
        init();
        fetchProducts();
    }, [init, fetchProducts]);

    useEffect(() => {
        if (config) {
            setTempDailyGoal(String(config.dailyProductionGoal));
            setVideoPoints({
                '30s': config.videoDurationPoints?.['30s'] ?? 1,
                '60s': config.videoDurationPoints?.['60s'] ?? 2,
                '60plus': config.videoDurationPoints?.['60plus'] ?? 3
            });
            // Load sector goals from config
            if (config.salesGoals) {
                setSalesGoals({
                    monthlyRevenue: String(config.salesGoals.monthlyRevenue || ''),
                    leadsConverted: String(config.salesGoals.leadsConverted || ''),
                    conversionRate: String(config.salesGoals.conversionRate || ''),
                });
            }
            if (config.postSalesGoals) {
                setPostSalesGoals({
                    monthlyClients: String(config.postSalesGoals.monthlyClients || ''),
                    satisfactionRate: String(config.postSalesGoals.satisfactionRate || ''),
                    responseTime: String(config.postSalesGoals.responseTime || ''),
                });
            }
            if (config.strategicGoals) {
                setStrategicGoals({
                    monthlyNotes: String(config.strategicGoals.monthlyNotes || ''),
                    weeklyReviews: String(config.strategicGoals.weeklyReviews || ''),
                });
            }
        }
    }, [config]);

    // Initialize product points from products
    useEffect(() => {
        if (products.length > 0) {
            const pointsMap: Record<string, number> = {};
            products.forEach(p => {
                pointsMap[p.id] = p.points ?? 1;
            });
            setProductPoints(pointsMap);
        }
    }, [products]);

    // Active products only
    const activeProducts = useMemo(() =>
        products.filter(p => p.active).sort((a, b) => a.name.localeCompare(b.name)),
        [products]
    );

    // Check if there are unsaved changes
    const hasPointsChanges = useMemo(() =>
        products.some(p => (p.points ?? 1) !== (productPoints[p.id] ?? 1)),
        [products, productPoints]
    );

    const handleSaveDailyGoal = async () => {
        const goal = Number(tempDailyGoal);
        if (isNaN(goal) || goal <= 0) {
            return;
        }
        await setDailyGoal(goal);
    };

    const handlePointChange = (productId: string, value: string) => {
        const points = parseInt(value) || 0;
        setProductPoints(prev => ({ ...prev, [productId]: points }));
    };

    const handleSavePoints = async () => {
        setIsSavingPoints(true);
        try {
            const updates = activeProducts
                .filter(p => p.category !== 'Vídeo')
                .map(p => ({
                    id: p.id,
                    points: productPoints[p.id] ?? 1
                }));
            await updateProductPoints(updates);
            await setVideoDurationPoints(videoPoints);
            toast.success('Pontos atualizados com sucesso!');
        } catch {
            toast.error('Erro ao salvar pontos.');
        } finally {
            setIsSavingPoints(false);
        }
    };

    const handleSaveSectorGoals = async (sector: SectorTab) => {
        setIsSavingSector(true);
        try {
            const update: Partial<GoalsConfig> = {};
            if (sector === 'vendas') {
                update.salesGoals = {
                    monthlyRevenue: Number(salesGoals.monthlyRevenue) || 0,
                    leadsConverted: Number(salesGoals.leadsConverted) || 0,
                    conversionRate: Number(salesGoals.conversionRate) || 0,
                };
            } else if (sector === 'pos-vendas') {
                update.postSalesGoals = {
                    monthlyClients: Number(postSalesGoals.monthlyClients) || 0,
                    satisfactionRate: Number(postSalesGoals.satisfactionRate) || 0,
                    responseTime: Number(postSalesGoals.responseTime) || 0,
                };
            } else if (sector === 'estrategico') {
                update.strategicGoals = {
                    monthlyNotes: Number(strategicGoals.monthlyNotes) || 0,
                    weeklyReviews: Number(strategicGoals.weeklyReviews) || 0,
                };
            }
            await GoalsService.saveConfig(update);
            toast.success('Metas atualizadas com sucesso!');
        } catch {
            toast.error('Erro ao salvar metas.');
        } finally {
            setIsSavingSector(false);
        }
    };

    // Calculate preview values
    const dailyGoal = Number(tempDailyGoal) || 0;

    if (isLoading) {
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

                {/* ═══════════════ PRODUÇÃO ═══════════════ */}
                {activeSector === 'producao' && (
                    <>
                        {/* Meta Diária Individual */}
                        <Card>
                            <CardHeader
                                title="Meta Individual por Produtor"
                                action={<Target size={20} style={{ color: 'var(--color-primary-500)' }} />}
                            />
                            <CardBody>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Defina quantos <strong>pontos</strong> cada produtor deve entregar por dia útil.
                                        A meta da equipe será calculada automaticamente: <strong>Meta Individual × Nº de Produtores Ativos</strong>.
                                    </p>

                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1, maxWidth: '200px' }}>
                                            <Input
                                                label="Meta diária por produtor (pontos)"
                                                type="number"
                                                value={tempDailyGoal}
                                                onChange={(e) => setTempDailyGoal(e.target.value)}
                                                min="1"
                                            />
                                        </div>
                                        <Button
                                            variant="primary"
                                            leftIcon={isSaving ? <Spinner size="sm" /> : <Save size={18} />}
                                            onClick={handleSaveDailyGoal}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? 'Salvando...' : 'Salvar'}
                                        </Button>
                                    </div>

                                    {/* Preview */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                        gap: '0.75rem',
                                        marginTop: '0.5rem'
                                    }}>
                                        {[
                                            { label: 'Dia', value: dailyGoal, color: 'var(--color-primary-500)' },
                                            { label: 'Semana', value: dailyGoal * 5, color: 'var(--color-info-500)' },
                                            { label: 'Mês', value: dailyGoal * 22, color: 'var(--color-success-500)' },
                                            { label: 'Trimestre', value: dailyGoal * 22 * 3, color: 'var(--color-warning-500)' },
                                        ].map(item => (
                                            <div key={item.label} style={{
                                                padding: '0.75rem',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: item.color }}>
                                                    {item.value}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                    {item.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Pontuação por Produto */}
                        <Card>
                            <CardHeader
                                title="Pontuação por Produto"
                                action={<Package size={20} style={{ color: 'var(--color-info-500)' }} />}
                            />
                            <CardBody>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Defina quantos <strong>pontos</strong> cada produto vale quando entregue pela produção.
                                    </p>

                                    {isLoadingProducts ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                            <Spinner size="md" />
                                        </div>
                                    ) : activeProducts.length === 0 ? (
                                        <div style={{
                                            padding: '2rem',
                                            textAlign: 'center',
                                            color: 'var(--color-text-muted)',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)'
                                        }}>
                                            Nenhum produto ativo cadastrado.
                                            <br />
                                            <span style={{ fontSize: '0.8rem' }}>Cadastre produtos em Configurações → Produtos</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 100px 65px 65px 65px',
                                                gap: '0.5rem',
                                                padding: '0.5rem 0.75rem',
                                                background: 'var(--color-bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                color: 'var(--color-text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                <span>Produto</span>
                                                <span>Categoria</span>
                                                <span style={{ textAlign: 'center' }}>30s</span>
                                                <span style={{ textAlign: 'center' }}>60s</span>
                                                <span style={{ textAlign: 'center' }}>60+</span>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem',
                                                maxHeight: '400px',
                                                overflowY: 'auto'
                                            }}>
                                                {activeProducts.map(product => {
                                                    const isVideo = product.category === 'Vídeo';
                                                    return (
                                                        <div
                                                            key={product.id}
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 100px 65px 65px 65px',
                                                                gap: '0.5rem',
                                                                padding: '0.5rem 0.75rem',
                                                                background: 'var(--color-bg-secondary)',
                                                                borderRadius: 'var(--radius-sm)',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                                                                {product.name}
                                                            </span>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                                {product.category}
                                                            </span>
                                                            {isVideo ? (
                                                                <>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={videoPoints['30s']}
                                                                        onChange={(e) => setVideoPoints(prev => ({ ...prev, '30s': parseInt(e.target.value) || 0 }))}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.375rem 0.25rem',
                                                                            textAlign: 'center',
                                                                            background: 'var(--color-bg-primary)',
                                                                            border: '1px solid var(--color-border)',
                                                                            borderRadius: 'var(--radius-sm)',
                                                                            color: 'var(--color-text-primary)',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: '600'
                                                                        }}
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={videoPoints['60s']}
                                                                        onChange={(e) => setVideoPoints(prev => ({ ...prev, '60s': parseInt(e.target.value) || 0 }))}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.375rem 0.25rem',
                                                                            textAlign: 'center',
                                                                            background: 'var(--color-bg-primary)',
                                                                            border: '1px solid var(--color-border)',
                                                                            borderRadius: 'var(--radius-sm)',
                                                                            color: 'var(--color-text-primary)',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: '600'
                                                                        }}
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={videoPoints['60plus']}
                                                                        onChange={(e) => setVideoPoints(prev => ({ ...prev, '60plus': parseInt(e.target.value) || 0 }))}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.375rem 0.25rem',
                                                                            textAlign: 'center',
                                                                            background: 'var(--color-bg-primary)',
                                                                            border: '1px solid var(--color-border)',
                                                                            borderRadius: 'var(--radius-sm)',
                                                                            color: 'var(--color-text-primary)',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: '600'
                                                                        }}
                                                                    />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={productPoints[product.id] ?? 1}
                                                                        onChange={(e) => handlePointChange(product.id, e.target.value)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.375rem 0.25rem',
                                                                            textAlign: 'center',
                                                                            background: 'var(--color-bg-primary)',
                                                                            border: '1px solid var(--color-border)',
                                                                            borderRadius: 'var(--radius-sm)',
                                                                            color: 'var(--color-text-primary)',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: '600'
                                                                        }}
                                                                    />
                                                                    <span style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>—</span>
                                                                    <span style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>—</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                                <Button
                                                    variant="primary"
                                                    leftIcon={isSavingPoints ? <Spinner size="sm" /> : <Save size={18} />}
                                                    onClick={handleSavePoints}
                                                    disabled={isSavingPoints || !hasPointsChanges}
                                                >
                                                    {isSavingPoints ? 'Salvando...' : 'Salvar Pontos'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Info */}
                        <div style={{
                            padding: '1rem',
                            background: 'var(--color-bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)'
                        }}>
                            <p style={{ margin: '0 0 0.5rem 0' }}>
                                <strong>📊 Como funciona no Dashboard:</strong>
                            </p>
                            <p style={{ margin: 0 }}>
                                A <strong>meta da equipe</strong> é calculada automaticamente multiplicando a meta individual pelo número de produtores ativos no período selecionado.
                                <br /><br />
                                <strong>Fórmula:</strong> Meta Equipe = Meta Individual × Produtores Ativos × Dias do Período
                            </p>
                        </div>
                    </>
                )}

                {/* ═══════════════ VENDAS ═══════════════ */}
                {activeSector === 'vendas' && (
                    <>
                        <Card>
                            <CardHeader
                                title="Metas de Vendas"
                                action={<DollarSign size={20} style={{ color: 'var(--color-success-500)' }} />}
                            />
                            <CardBody>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Configure as metas mensais para o setor de vendas.
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <Input
                                            label="Faturamento Mensal (R$)"
                                            type="number"
                                            value={salesGoals.monthlyRevenue}
                                            onChange={(e) => setSalesGoals(p => ({ ...p, monthlyRevenue: e.target.value }))}
                                            placeholder="Ex: 50000"
                                        />
                                        <Input
                                            label="Leads Convertidos / Mês"
                                            type="number"
                                            value={salesGoals.leadsConverted}
                                            onChange={(e) => setSalesGoals(p => ({ ...p, leadsConverted: e.target.value }))}
                                            placeholder="Ex: 15"
                                        />
                                        <Input
                                            label="Taxa de Conversão (%)"
                                            type="number"
                                            value={salesGoals.conversionRate}
                                            onChange={(e) => setSalesGoals(p => ({ ...p, conversionRate: e.target.value }))}
                                            placeholder="Ex: 30"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="primary"
                                            leftIcon={isSavingSector ? <Spinner size="sm" /> : <Save size={18} />}
                                            onClick={() => handleSaveSectorGoals('vendas')}
                                            disabled={isSavingSector}
                                        >
                                            {isSavingSector ? 'Salvando...' : 'Salvar Metas'}
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Preview card */}
                        <Card variant="elevated">
                            <CardHeader
                                title="Resumo das Metas"
                                action={<TrendingUp size={20} style={{ color: 'var(--color-success-500)' }} />}
                            />
                            <CardBody>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                                            R$ {Number(salesGoals.monthlyRevenue || 0).toLocaleString('pt-BR')}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Faturamento / Mês</div>
                                    </div>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-info-500)' }}>
                                            {salesGoals.leadsConverted || 0}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Leads / Mês</div>
                                    </div>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-warning-500)' }}>
                                            {salesGoals.conversionRate || 0}%
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Conversão</div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </>
                )}

                {/* ═══════════════ PÓS-VENDAS ═══════════════ */}
                {activeSector === 'pos-vendas' && (
                    <>
                        <Card>
                            <CardHeader
                                title="Metas de Pós-Vendas"
                                action={<Users size={20} style={{ color: 'var(--color-warning-500)' }} />}
                            />
                            <CardBody>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Configure as metas mensais para o setor de pós-vendas.
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <Input
                                            label="Clientes Atendidos / Mês"
                                            type="number"
                                            value={postSalesGoals.monthlyClients}
                                            onChange={(e) => setPostSalesGoals(p => ({ ...p, monthlyClients: e.target.value }))}
                                            placeholder="Ex: 50"
                                        />
                                        <Input
                                            label="Taxa de Satisfação (%)"
                                            type="number"
                                            value={postSalesGoals.satisfactionRate}
                                            onChange={(e) => setPostSalesGoals(p => ({ ...p, satisfactionRate: e.target.value }))}
                                            placeholder="Ex: 95"
                                        />
                                        <Input
                                            label="Tempo Médio de Resposta (h)"
                                            type="number"
                                            value={postSalesGoals.responseTime}
                                            onChange={(e) => setPostSalesGoals(p => ({ ...p, responseTime: e.target.value }))}
                                            placeholder="Ex: 4"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="primary"
                                            leftIcon={isSavingSector ? <Spinner size="sm" /> : <Save size={18} />}
                                            onClick={() => handleSaveSectorGoals('pos-vendas')}
                                            disabled={isSavingSector}
                                        >
                                            {isSavingSector ? 'Salvando...' : 'Salvar Metas'}
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Preview */}
                        <Card variant="elevated">
                            <CardHeader
                                title="Resumo das Metas"
                                action={<TrendingUp size={20} style={{ color: 'var(--color-warning-500)' }} />}
                            />
                            <CardBody>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-warning-500)' }}>
                                            {postSalesGoals.monthlyClients || 0}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Clientes / Mês</div>
                                    </div>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                                            {postSalesGoals.satisfactionRate || 0}%
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Satisfação</div>
                                    </div>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-info-500)' }}>
                                            {postSalesGoals.responseTime || 0}h
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>T. Resposta</div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </>
                )}

                {/* ═══════════════ ESTRATÉGICO ═══════════════ */}
                {activeSector === 'estrategico' && (
                    <>
                        <Card>
                            <CardHeader
                                title="Metas Estratégicas"
                                action={<Briefcase size={20} style={{ color: 'var(--color-primary-500)' }} />}
                            />
                            <CardBody>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Configure as metas para o setor estratégico.
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <Input
                                            label="Notas Estratégicas / Mês"
                                            type="number"
                                            value={strategicGoals.monthlyNotes}
                                            onChange={(e) => setStrategicGoals(p => ({ ...p, monthlyNotes: e.target.value }))}
                                            placeholder="Ex: 10"
                                        />
                                        <Input
                                            label="Revisões Semanais"
                                            type="number"
                                            value={strategicGoals.weeklyReviews}
                                            onChange={(e) => setStrategicGoals(p => ({ ...p, weeklyReviews: e.target.value }))}
                                            placeholder="Ex: 2"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="primary"
                                            leftIcon={isSavingSector ? <Spinner size="sm" /> : <Save size={18} />}
                                            onClick={() => handleSaveSectorGoals('estrategico')}
                                            disabled={isSavingSector}
                                        >
                                            {isSavingSector ? 'Salvando...' : 'Salvar Metas'}
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Preview */}
                        <Card variant="elevated">
                            <CardHeader
                                title="Resumo das Metas"
                                action={<BarChart3 size={20} style={{ color: 'var(--color-primary-500)' }} />}
                            />
                            <CardBody>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary-500)' }}>
                                            {strategicGoals.monthlyNotes || 0}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Notas / Mês</div>
                                    </div>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-info-500)' }}>
                                            {strategicGoals.weeklyReviews || 0}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Revisões / Semana</div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <div style={{
                            padding: '1rem',
                            background: 'var(--color-bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <Zap size={18} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
                            <span>
                                As metas estratégicas serão integradas ao módulo Estratégico conforme novas funcionalidades forem implementadas.
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
