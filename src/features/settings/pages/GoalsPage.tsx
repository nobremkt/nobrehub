/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOALS PAGE (METAS)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Configuração de metas de produção
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardBody, Input, Button, Spinner } from '@/design-system';
import { Target, Save, Calendar, Calculator, Package } from 'lucide-react';
import { useGoalsStore } from '../stores/useGoalsStore';
import { useProductStore } from '../stores/useProductStore';
import { toast } from 'react-toastify';

export const GoalsPage: React.FC = () => {
    const { config, isLoading, isSaving, init, setDailyGoal, setWorkdays, setVideoDurationPoints } = useGoalsStore();
    const { products, fetchProducts, updateProductPoints, isLoading: isLoadingProducts } = useProductStore();

    const [tempDailyGoal, setTempDailyGoal] = useState<string>('');
    const [tempWorkdaysWeek, setTempWorkdaysWeek] = useState<string>('');
    const [tempWorkdaysMonth, setTempWorkdaysMonth] = useState<string>('');

    // Product points state
    const [productPoints, setProductPoints] = useState<Record<string, number>>({});
    const [isSavingPoints, setIsSavingPoints] = useState(false);

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
            setTempWorkdaysWeek(String(config.workdaysPerWeek));
            setTempWorkdaysMonth(String(config.workdaysPerMonth));
            // Initialize video duration points from config
            setVideoPoints({
                '30s': config.videoDurationPoints?.['30s'] ?? 1,
                '60s': config.videoDurationPoints?.['60s'] ?? 2,
                '60plus': config.videoDurationPoints?.['60plus'] ?? 3
            });
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

    const handleSaveWorkdays = async () => {
        const week = Number(tempWorkdaysWeek);
        const month = Number(tempWorkdaysMonth);
        if (isNaN(week) || isNaN(month) || week <= 0 || month <= 0) {
            return;
        }
        await setWorkdays(week, month);
    };

    const handlePointChange = (productId: string, value: string) => {
        const points = parseInt(value) || 0;
        setProductPoints(prev => ({ ...prev, [productId]: points }));
    };

    const handleSavePoints = async () => {
        setIsSavingPoints(true);
        try {
            // Save product points (non-video)
            const updates = activeProducts
                .filter(p => p.category !== 'Vídeo')
                .map(p => ({
                    id: p.id,
                    points: productPoints[p.id] ?? 1
                }));
            await updateProductPoints(updates);

            // Save video duration points globally
            await setVideoDurationPoints(videoPoints);

            toast.success('Pontos atualizados com sucesso!');
        } catch {
            toast.error('Erro ao salvar pontos.');
        } finally {
            setIsSavingPoints(false);
        }
    };

    // Calculate preview values
    const dailyGoal = Number(tempDailyGoal) || 0;
    const workdaysWeek = Number(tempWorkdaysWeek) || 5;
    const workdaysMonth = Number(tempWorkdaysMonth) || 22;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    🎯 Metas
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Configure as metas de produção da equipe.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

                            {/* Example calculation */}
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.8125rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                <strong>Exemplo:</strong> Se a meta individual é <strong>{dailyGoal} pts/dia</strong> e há <strong>8 produtores</strong> ativos,
                                a meta diária da equipe será <strong>{dailyGoal * 8} pts</strong>.
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Dias Úteis */}
                <Card>
                    <CardHeader
                        title="Dias Úteis"
                        action={<Calendar size={20} style={{ color: 'var(--color-text-secondary)' }} />}
                    />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Configure quantos dias úteis são considerados para cálculo das metas semanais e mensais.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ width: '150px' }}>
                                    <Input
                                        label="Por semana"
                                        type="number"
                                        value={tempWorkdaysWeek}
                                        onChange={(e) => setTempWorkdaysWeek(e.target.value)}
                                        min="1"
                                        max="7"
                                    />
                                </div>
                                <div style={{ width: '150px' }}>
                                    <Input
                                        label="Por mês"
                                        type="number"
                                        value={tempWorkdaysMonth}
                                        onChange={(e) => setTempWorkdaysMonth(e.target.value)}
                                        min="1"
                                        max="31"
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    leftIcon={isSaving ? <Spinner size="sm" /> : <Save size={18} />}
                                    onClick={handleSaveWorkdays}
                                    disabled={isSaving}
                                >
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Preview das Metas */}
                <Card variant="elevated">
                    <CardHeader
                        title="Pré-visualização das Metas (Individual)"
                        action={<Calculator size={20} style={{ color: 'var(--color-success-500)' }} />}
                    />
                    <CardBody>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                            Meta <strong>por produtor</strong> baseada em <strong>{dailyGoal} pontos/dia</strong>:
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary-500)' }}>
                                    {dailyGoal}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Dia</div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-info-500)' }}>
                                    {dailyGoal * workdaysWeek}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Semana</div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                                    {dailyGoal * workdaysMonth}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mês</div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-warning-500)' }}>
                                    {dailyGoal * workdaysMonth * 3}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Trimestre</div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Pontuação por Produto */}
                <Card>
                    <CardHeader
                        title="Pontuação por Produto (Produção)"
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
            </div>
        </div>
    );
};
