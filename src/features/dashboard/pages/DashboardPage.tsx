import { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores';
import { Button, Dropdown, Checkbox } from '@/design-system';
import { RefreshCw } from 'lucide-react';
import { GeneralStats, SalesStats, ProductionStats, AdminStats, FinancialStats } from '../components';
import { useDashboardStore } from '../stores/useDashboardStore';
import { useUISound } from '@/hooks';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/config/permissions';
import styles from './DashboardPage.module.css';

const DATE_FILTER_OPTIONS = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês atual' },
    { value: 'quarter', label: 'Últimos 3 meses' },
    { value: 'year', label: 'Último ano' },
    { value: 'janeiro_2026', label: '📊 Janeiro 2026 (Importado)' },
];

export function DashboardPage() {
    const { user } = useAuthStore();
    const { can } = usePermission();
    const { dateFilter, setDateFilter, fetchMetrics } = useDashboardStore();

    // Permission checks for each section
    const permissions = useMemo(() => ({
        sales: can(PERMISSIONS.VIEW_DASHBOARD_SALES),
        production: can(PERMISSIONS.VIEW_DASHBOARD_PRODUCTION),
        financial: can(PERMISSIONS.VIEW_DASHBOARD_FINANCIAL),
        admin: can(PERMISSIONS.VIEW_DASHBOARD_ADMIN),
    }), [can]);

    // Section visibility state (only for sections user has permission to see)
    const [visibleSections, setVisibleSections] = useState({
        general: true,
        sales: true,
        production: true,
        financial: true,
        admin: true,
    });

    const [showSectionFilter, setShowSectionFilter] = useState(false);
    const { playSound } = useUISound();

    const handleDateChange = useCallback((value: string | number) => {
        if (value === 'custom') {
            // TODO: Open date picker modal
            return;
        }
        setDateFilter(value as any);
    }, [setDateFilter]);

    const handleRefresh = useCallback(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const handleSectionToggle = useCallback(() => {
        setShowSectionFilter(prev => !prev);
    }, []);

    const toggleSection = useCallback((section: keyof typeof visibleSections) => {
        playSound('click');
        setVisibleSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, [playSound]);

    // Check if user has any dashboard section permissions
    const hasAnySectionPermission = permissions.sales || permissions.production || permissions.financial || permissions.admin;

    return (
        <div className={styles.dashboard}>
            {/* Welcome Header */}
            <div className={styles.welcome}>
                <div>
                    <h1 className={styles.welcomeTitle}>
                        Olá, {user?.name?.split(' ')[0] || 'Visitante'}! 👋
                    </h1>
                    <p className={styles.welcomeSubtitle}>
                        Visão geral das métricas
                    </p>
                </div>

                <div className={styles.filters}>
                    {/* Date Filter */}
                    <div className={styles.filterGroup}>
                        <Dropdown
                            options={DATE_FILTER_OPTIONS}
                            value={dateFilter}
                            onChange={handleDateChange}
                            placeholder="Período"
                        />
                    </div>

                    {/* Section Visibility Filter - only show if user has any section permissions */}
                    {hasAnySectionPermission && (
                        <div className={styles.filterGroup}>
                            <Button
                                variant="ghost"
                                className={styles.sectionTrigger}
                                onClick={handleSectionToggle}
                                rightIcon={
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: showSectionFilter ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                }
                            >
                                Seções
                            </Button>

                            {showSectionFilter && (
                                <div className={styles.sectionDropdown}>
                                    {/* Visão Geral - always available */}
                                    <div className={styles.sectionOption}>
                                        <Checkbox
                                            checked={visibleSections.general}
                                            onChange={() => toggleSection('general')}
                                            label="Visão Geral"
                                        />
                                    </div>

                                    {/* Sales - permission required */}
                                    {permissions.sales && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox
                                                checked={visibleSections.sales}
                                                onChange={() => toggleSection('sales')}
                                                label="Vendas"
                                            />
                                        </div>
                                    )}

                                    {/* Production - permission required */}
                                    {permissions.production && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox
                                                checked={visibleSections.production}
                                                onChange={() => toggleSection('production')}
                                                label="Produção"
                                            />
                                        </div>
                                    )}

                                    {/* Financial - permission required */}
                                    {permissions.financial && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox
                                                checked={visibleSections.financial}
                                                onChange={() => toggleSection('financial')}
                                                label="Financeiro"
                                            />
                                        </div>
                                    )}

                                    {/* Admin - permission required */}
                                    {permissions.admin && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox
                                                checked={visibleSections.admin}
                                                onChange={() => toggleSection('admin')}
                                                label="Administração"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Refresh Button */}
                    <Button variant="ghost" size="sm" onClick={handleRefresh}>
                        <RefreshCw size={16} />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* General Stats - always visible */}
            <section className={`${styles.section} ${styles.animatedSection} ${visibleSections.general ? styles.visible : styles.hidden}`}>
                <h2 className={styles.sectionTitle}>Visão Geral</h2>
                <GeneralStats />
            </section>

            {/* Sales Stats - permission required */}
            {permissions.sales && (
                <section className={`${styles.section} ${styles.animatedSection} ${visibleSections.sales ? styles.visible : styles.hidden}`}>
                    <h2 className={styles.sectionTitle}>Vendas</h2>
                    <SalesStats />
                </section>
            )}

            {/* Production Stats - permission required */}
            {permissions.production && (
                <section className={`${styles.section} ${styles.animatedSection} ${visibleSections.production ? styles.visible : styles.hidden}`}>
                    <h2 className={styles.sectionTitle}>Produção</h2>
                    <ProductionStats />
                </section>
            )}

            {/* Financial Stats - permission required */}
            {permissions.financial && (
                <section className={`${styles.section} ${styles.animatedSection} ${visibleSections.financial ? styles.visible : styles.hidden}`}>
                    <h2 className={styles.sectionTitle}>Financeiro</h2>
                    <FinancialStats />
                </section>
            )}

            {/* Admin Stats - permission required */}
            {permissions.admin && (
                <section className={`${styles.section} ${styles.animatedSection} ${visibleSections.admin ? styles.visible : styles.hidden}`}>
                    <h2 className={styles.sectionTitle}>Administração</h2>
                    <AdminStats />
                </section>
            )}
        </div>
    );
}

