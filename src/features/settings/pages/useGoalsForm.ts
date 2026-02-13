/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * useGoalsForm — Hook for GoalsPage state and handlers
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useGoalsStore } from '../stores/useGoalsStore';
import { useProductStore } from '../stores/useProductStore';
import { toast } from 'react-toastify';
import { GoalsService, type GoalsConfig } from '../services/goalsService';

export type SectorTab = 'producao' | 'vendas' | 'pos-vendas' | 'estrategico';

export function useGoalsForm() {
    const { config, isLoading, isSaving, init, setDailyGoal, setVideoDurationPoints } = useGoalsStore();
    const { products, fetchProducts, updateProductPoints, isLoading: isLoadingProducts } = useProductStore();

    const [tempDailyGoal, setTempDailyGoal] = useState<string>('');
    const [productPoints, setProductPoints] = useState<Record<string, number>>({});
    const [isSavingPoints, setIsSavingPoints] = useState(false);

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

    useEffect(() => {
        if (products.length > 0) {
            const pointsMap: Record<string, number> = {};
            products.forEach(p => {
                pointsMap[p.id] = p.points ?? 1;
            });
            setProductPoints(pointsMap);
        }
    }, [products]);

    const activeProducts = useMemo(() =>
        products.filter(p => p.active).sort((a, b) => a.name.localeCompare(b.name)),
        [products]
    );

    const hasPointsChanges = useMemo(() =>
        products.some(p => (p.points ?? 1) !== (productPoints[p.id] ?? 1)),
        [products, productPoints]
    );

    const dailyGoal = Number(tempDailyGoal) || 0;

    const handleSaveDailyGoal = useCallback(async () => {
        const goal = Number(tempDailyGoal);
        if (isNaN(goal) || goal <= 0) return;
        await setDailyGoal(goal);
    }, [tempDailyGoal, setDailyGoal]);

    const handlePointChange = useCallback((productId: string, value: string) => {
        const points = parseInt(value) || 0;
        setProductPoints(prev => ({ ...prev, [productId]: points }));
    }, []);

    const handleSavePoints = useCallback(async () => {
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
    }, [activeProducts, productPoints, videoPoints, updateProductPoints, setVideoDurationPoints]);

    const handleSaveSectorGoals = useCallback(async (sector: SectorTab) => {
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
    }, [salesGoals, postSalesGoals, strategicGoals]);

    return {
        // Loading states
        isLoading,
        isSaving,
        isSavingPoints,
        isSavingSector,
        isLoadingProducts,
        // Production
        tempDailyGoal,
        setTempDailyGoal,
        dailyGoal,
        productPoints,
        activeProducts,
        hasPointsChanges,
        videoPoints,
        setVideoPoints,
        handleSaveDailyGoal,
        handlePointChange,
        handleSavePoints,
        // Sales
        salesGoals,
        setSalesGoals,
        // Post-Sales
        postSalesGoals,
        setPostSalesGoals,
        // Strategic
        strategicGoals,
        setStrategicGoals,
        // Sector save
        handleSaveSectorGoals,
    };
}
