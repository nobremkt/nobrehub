/**
 * ProducaoGoalsTab — Production goals sector tab
 */

import React from 'react';
import { Card, CardHeader, CardBody, Input, Button, Spinner } from '@/design-system';
import { Target, Save, Package } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    category: string;
    active: boolean;
    points?: number;
}

interface ProducaoGoalsTabProps {
    tempDailyGoal: string;
    setTempDailyGoal: (val: string) => void;
    dailyGoal: number;
    isSaving: boolean;
    handleSaveDailyGoal: () => void;
    isLoadingProducts: boolean;
    activeProducts: Product[];
    productPoints: Record<string, number>;
    handlePointChange: (productId: string, value: string) => void;
    videoPoints: { '30s': number; '60s': number; '60plus': number };
    setVideoPoints: React.Dispatch<React.SetStateAction<{ '30s': number; '60s': number; '60plus': number }>>;
    isSavingPoints: boolean;
    hasPointsChanges: boolean;
    handleSavePoints: () => void;
}

export const ProducaoGoalsTab: React.FC<ProducaoGoalsTabProps> = ({
    tempDailyGoal, setTempDailyGoal, dailyGoal,
    isSaving, handleSaveDailyGoal,
    isLoadingProducts, activeProducts, productPoints,
    handlePointChange, videoPoints, setVideoPoints,
    isSavingPoints, hasPointsChanges, handleSavePoints,
}) => (
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
                                    const inputStyle = {
                                        width: '100%',
                                        padding: '0.375rem 0.25rem',
                                        textAlign: 'center' as const,
                                        background: 'var(--color-bg-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '0.875rem',
                                        fontWeight: '600'
                                    };
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
                                                        type="number" min="0"
                                                        value={videoPoints['30s']}
                                                        onChange={(e) => setVideoPoints(prev => ({ ...prev, '30s': parseInt(e.target.value) || 0 }))}
                                                        style={inputStyle}
                                                    />
                                                    <input
                                                        type="number" min="0"
                                                        value={videoPoints['60s']}
                                                        onChange={(e) => setVideoPoints(prev => ({ ...prev, '60s': parseInt(e.target.value) || 0 }))}
                                                        style={inputStyle}
                                                    />
                                                    <input
                                                        type="number" min="0"
                                                        value={videoPoints['60plus']}
                                                        onChange={(e) => setVideoPoints(prev => ({ ...prev, '60plus': parseInt(e.target.value) || 0 }))}
                                                        style={inputStyle}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <input
                                                        type="number" min="0"
                                                        value={productPoints[product.id] ?? 1}
                                                        onChange={(e) => handlePointChange(product.id, e.target.value)}
                                                        style={inputStyle}
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
);
