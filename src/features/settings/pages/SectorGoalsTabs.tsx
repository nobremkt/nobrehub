/**
 * SectorGoalsTab — Vendas, Pós-Vendas, Estratégico goal tabs
 */

import React from 'react';
import { Card, CardHeader, CardBody, Input, Button, Spinner } from '@/design-system';
import {
    Save, DollarSign, TrendingUp, Users,
    Briefcase, BarChart3, Zap
} from 'lucide-react';
import type { SectorTab } from './useGoalsForm';

// ─── Shared types ────────────────────────────────────────────────────

type SalesGoalsState = { monthlyRevenue: string; leadsConverted: string; conversionRate: string };
type PostSalesGoalsState = { monthlyClients: string; satisfactionRate: string; responseTime: string };
type StrategicGoalsState = { monthlyNotes: string; weeklyReviews: string };

// ─── Vendas ──────────────────────────────────────────────────────────

interface VendasGoalsTabProps {
    salesGoals: SalesGoalsState;
    setSalesGoals: React.Dispatch<React.SetStateAction<SalesGoalsState>>;
    isSavingSector: boolean;
    handleSaveSectorGoals: (sector: SectorTab) => void;
}

export const VendasGoalsTab: React.FC<VendasGoalsTabProps> = ({
    salesGoals, setSalesGoals, isSavingSector, handleSaveSectorGoals,
}) => (
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
                            label="Faturamento Mensal (R$)" type="number"
                            value={salesGoals.monthlyRevenue}
                            onChange={(e) => setSalesGoals(p => ({ ...p, monthlyRevenue: e.target.value }))}
                            placeholder="Ex: 50000"
                        />
                        <Input
                            label="Leads Convertidos / Mês" type="number"
                            value={salesGoals.leadsConverted}
                            onChange={(e) => setSalesGoals(p => ({ ...p, leadsConverted: e.target.value }))}
                            placeholder="Ex: 15"
                        />
                        <Input
                            label="Taxa de Conversão (%)" type="number"
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

        {/* Preview */}
        <Card variant="elevated">
            <CardHeader title="Resumo das Metas" action={<TrendingUp size={20} style={{ color: 'var(--color-success-500)' }} />} />
            <CardBody>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                            R$ {Number(salesGoals.monthlyRevenue || 0).toLocaleString('pt-BR')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Faturamento / Mês</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-info-500)' }}>
                            {salesGoals.leadsConverted || 0}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Leads / Mês</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-warning-500)' }}>
                            {salesGoals.conversionRate || 0}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Conversão</div>
                    </div>
                </div>
            </CardBody>
        </Card>
    </>
);

// ─── Pós-Vendas ──────────────────────────────────────────────────────

interface PosVendasGoalsTabProps {
    postSalesGoals: PostSalesGoalsState;
    setPostSalesGoals: React.Dispatch<React.SetStateAction<PostSalesGoalsState>>;
    isSavingSector: boolean;
    handleSaveSectorGoals: (sector: SectorTab) => void;
}

export const PosVendasGoalsTab: React.FC<PosVendasGoalsTabProps> = ({
    postSalesGoals, setPostSalesGoals, isSavingSector, handleSaveSectorGoals,
}) => (
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
                            label="Clientes Atendidos / Mês" type="number"
                            value={postSalesGoals.monthlyClients}
                            onChange={(e) => setPostSalesGoals(p => ({ ...p, monthlyClients: e.target.value }))}
                            placeholder="Ex: 50"
                        />
                        <Input
                            label="Taxa de Satisfação (%)" type="number"
                            value={postSalesGoals.satisfactionRate}
                            onChange={(e) => setPostSalesGoals(p => ({ ...p, satisfactionRate: e.target.value }))}
                            placeholder="Ex: 95"
                        />
                        <Input
                            label="Tempo Médio de Resposta (h)" type="number"
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
            <CardHeader title="Resumo das Metas" action={<TrendingUp size={20} style={{ color: 'var(--color-warning-500)' }} />} />
            <CardBody>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-warning-500)' }}>
                            {postSalesGoals.monthlyClients || 0}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Clientes / Mês</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                            {postSalesGoals.satisfactionRate || 0}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Satisfação</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-info-500)' }}>
                            {postSalesGoals.responseTime || 0}h
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>T. Resposta</div>
                    </div>
                </div>
            </CardBody>
        </Card>
    </>
);

// ─── Estratégico ─────────────────────────────────────────────────────

interface EstrategicoGoalsTabProps {
    strategicGoals: StrategicGoalsState;
    setStrategicGoals: React.Dispatch<React.SetStateAction<StrategicGoalsState>>;
    isSavingSector: boolean;
    handleSaveSectorGoals: (sector: SectorTab) => void;
}

export const EstrategicoGoalsTab: React.FC<EstrategicoGoalsTabProps> = ({
    strategicGoals, setStrategicGoals, isSavingSector, handleSaveSectorGoals,
}) => (
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
                            label="Notas Estratégicas / Mês" type="number"
                            value={strategicGoals.monthlyNotes}
                            onChange={(e) => setStrategicGoals(p => ({ ...p, monthlyNotes: e.target.value }))}
                            placeholder="Ex: 10"
                        />
                        <Input
                            label="Revisões Semanais" type="number"
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
            <CardHeader title="Resumo das Metas" action={<BarChart3 size={20} style={{ color: 'var(--color-primary-500)' }} />} />
            <CardBody>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary-500)' }}>
                            {strategicGoals.monthlyNotes || 0}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Notas / Mês</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
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
);
