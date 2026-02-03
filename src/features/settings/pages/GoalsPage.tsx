/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - GOALS PAGE (METAS)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Configuração de metas de produção
 */

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Input, Button, Spinner } from '@/design-system';
import { Target, Save, Calendar, Calculator } from 'lucide-react';
import { useGoalsStore } from '../stores/useGoalsStore';

export const GoalsPage: React.FC = () => {
    const { config, isLoading, isSaving, init, setDailyGoal, setWorkdays } = useGoalsStore();

    const [tempDailyGoal, setTempDailyGoal] = useState<string>('');
    const [tempWorkdaysWeek, setTempWorkdaysWeek] = useState<string>('');
    const [tempWorkdaysMonth, setTempWorkdaysMonth] = useState<string>('');

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        if (config) {
            setTempDailyGoal(String(config.dailyProductionGoal));
            setTempWorkdaysWeek(String(config.workdaysPerWeek));
            setTempWorkdaysMonth(String(config.workdaysPerMonth));
        }
    }, [config]);

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
