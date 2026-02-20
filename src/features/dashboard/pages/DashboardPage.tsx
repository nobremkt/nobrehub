import { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores';
import { Button, Checkbox } from '@/design-system';
import { RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { GeneralStats, SalesStats, ProductionStats, AdminStats, FinancialStats, PostSalesStats } from '../components';
import { useDashboardStore } from '../stores/useDashboardStore';
import { useUISound } from '@/hooks';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/config/permissions';
import styles from './DashboardPage.module.css';


const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const QUICK_FILTERS = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês' },
    { value: 'quarter', label: 'Trimestre' },
] as const;

export function DashboardPage() {
    const { user } = useAuthStore();
    const { can } = usePermission();
    const { dateFilter, setDateFilter, fetchMetrics } = useDashboardStore();
    const { playSound } = useUISound();

    // Determine the currently selected year for month navigation
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(() => {
        // If dateFilter is a year like '2025' or a month like '2025-06', extract the year
        if (/^\d{4}$/.test(dateFilter)) return parseInt(dateFilter);
        if (/^\d{4}-\d{2}$/.test(dateFilter)) return parseInt(dateFilter.split('-')[0]);
        return currentYear;
    });

    // Check if isYearView mode (shows month pills)
    const isYearOrMonthFilter = /^\d{4}(-\d{2})?$/.test(dateFilter);

    // Permission checks for each section
    const permissions = useMemo(() => ({
        sales: can(PERMISSIONS.VIEW_DASHBOARD_SALES),
        production: can(PERMISSIONS.VIEW_DASHBOARD_PRODUCTION),
        financial: can(PERMISSIONS.VIEW_DASHBOARD_FINANCIAL),
        admin: can(PERMISSIONS.VIEW_DASHBOARD_ADMIN),
        postSales: can(PERMISSIONS.VIEW_DASHBOARD_POST_SALES),
    }), [can]);

    // Section visibility state
    const [visibleSections, setVisibleSections] = useState({
        general: true,
        sales: true,
        production: true,
        financial: true,
        admin: true,
        postSales: true,
    });

    const [showSectionFilter, setShowSectionFilter] = useState(false);

    const handleFilterChange = useCallback((value: string) => {
        playSound('click');
        setDateFilter(value as any);
    }, [setDateFilter, playSound]);

    const handleYearClick = useCallback((year: number) => {
        playSound('click');
        setSelectedYear(year);
        setDateFilter(String(year) as any);
    }, [setDateFilter, playSound]);

    const handleMonthClick = useCallback((monthIndex: number) => {
        playSound('click');
        const key = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
        setDateFilter(key as any);
    }, [setDateFilter, selectedYear, playSound]);

    const handleYearNav = useCallback((delta: number) => {
        playSound('click');
        const newYear = selectedYear + delta;
        setSelectedYear(newYear);
        // If currently on a year filter, update it
        if (dateFilter === String(selectedYear)) {
            setDateFilter(String(newYear) as any);
        }
        // If on a month filter, update to same month in new year
        if (/^\d{4}-\d{2}$/.test(dateFilter)) {
            const month = dateFilter.split('-')[1];
            setDateFilter(`${newYear}-${month}` as any);
        }
    }, [dateFilter, selectedYear, setDateFilter, playSound]);

    const handleRefresh = useCallback(() => {
        fetchMetrics(true);
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

    // Check if a quick filter is active
    const isQuickFilterActive = (value: string) => dateFilter === value;

    // Check if a specific month is active
    const isMonthActive = (monthIndex: number) => {
        const key = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
        return dateFilter === key;
    };

    // Check if year is active (whole year, not a specific month)
    const isYearActive = dateFilter === String(selectedYear);

    // Determine active filter label for the subtitle
    const getActiveLabel = () => {
        const quick = QUICK_FILTERS.find(f => f.value === dateFilter);
        if (quick) return quick.label;
        if (/^\d{4}$/.test(dateFilter)) return dateFilter;
        if (/^\d{4}-\d{2}$/.test(dateFilter)) {
            const [y, m] = dateFilter.split('-');
            return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
        }
        return 'Mês';
    };

    const hasAnySectionPermission = permissions.sales || permissions.production || permissions.financial || permissions.admin || permissions.postSales;

    return (
        <div className={styles.dashboard}>
            {/* Welcome Header */}
            <div className={styles.welcome}>
                <div>
                    <h1 className={styles.welcomeTitle}>
                        Olá, {user?.name?.split(' ')[0] || 'Visitante'}! 👋
                    </h1>
                    <p className={styles.welcomeSubtitle}>
                        Visão geral das métricas • <span className={styles.activePeriod}>{getActiveLabel()}</span>
                    </p>
                </div>

                <div className={styles.headerActions}>
                    {/* Section Visibility Filter */}
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
                                    <div className={styles.sectionOption}>
                                        <Checkbox
                                            checked={visibleSections.general}
                                            onChange={() => toggleSection('general')}
                                            label="Visão Geral"
                                        />
                                    </div>
                                    {permissions.sales && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox checked={visibleSections.sales} onChange={() => toggleSection('sales')} label="Vendas" />
                                        </div>
                                    )}
                                    {permissions.production && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox checked={visibleSections.production} onChange={() => toggleSection('production')} label="Produção" />
                                        </div>
                                    )}
                                    {permissions.financial && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox checked={visibleSections.financial} onChange={() => toggleSection('financial')} label="Financeiro" />
                                        </div>
                                    )}
                                    {permissions.admin && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox checked={visibleSections.admin} onChange={() => toggleSection('admin')} label="Administração" />
                                        </div>
                                    )}
                                    {permissions.postSales && (
                                        <div className={styles.sectionOption}>
                                            <Checkbox checked={visibleSections.postSales} onChange={() => toggleSection('postSales')} label="Pós-Venda" />
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

            {/* ──── FILTER BAR ──── */}
            <div className={styles.filterBar}>
                {/* Row 1: Quick filters + Year buttons */}
                <div className={styles.filterRow}>
                    <div className={styles.filterPillGroup}>
                        {QUICK_FILTERS.map(f => (
                            <button
                                key={f.value}
                                className={`${styles.filterPill} ${isQuickFilterActive(f.value) ? styles.filterPillActive : ''}`}
                                onClick={() => handleFilterChange(f.value)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.filterDivider} />

                    <div className={styles.filterPillGroup}>
                        <button
                            className={`${styles.filterPill} ${styles.filterPillYear} ${isYearOrMonthFilter && selectedYear === 2025 ? styles.filterPillActive : ''}`}
                            onClick={() => handleYearClick(2025)}
                        >
                            2025
                        </button>
                        <button
                            className={`${styles.filterPill} ${styles.filterPillYear} ${isYearOrMonthFilter && selectedYear === 2026 ? styles.filterPillActive : ''}`}
                            onClick={() => handleYearClick(2026)}
                        >
                            2026
                        </button>
                    </div>
                </div>

                {/* Row 2: Month pills (only visible when year/month filter is active) */}
                {isYearOrMonthFilter && (
                    <div className={styles.filterRow}>
                        <div className={styles.yearNav}>
                            <button className={styles.yearNavBtn} onClick={() => handleYearNav(-1)}>
                                <ChevronLeft size={14} />
                            </button>
                            <span className={styles.yearNavLabel}>
                                <Calendar size={14} />
                                {selectedYear}
                            </span>
                            <button className={styles.yearNavBtn} onClick={() => handleYearNav(1)} disabled={selectedYear >= currentYear}>
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className={styles.filterDivider} />

                        <div className={styles.monthPillGroup}>
                            <button
                                className={`${styles.monthPill} ${isYearActive ? styles.monthPillActive : ''}`}
                                onClick={() => handleYearClick(selectedYear)}
                            >
                                Ano todo
                            </button>
                            {MONTH_SHORT.map((m, i) => (
                                <button
                                    key={i}
                                    className={`${styles.monthPill} ${isMonthActive(i) ? styles.monthPillActive : ''}`}
                                    onClick={() => handleMonthClick(i)}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* General Stats - always visible */}
            {visibleSections.general && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Visão Geral</h2>
                    <GeneralStats />
                </section>
            )}

            {/* Sales Stats - permission required */}
            {permissions.sales && visibleSections.sales && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Vendas</h2>
                    <SalesStats />
                </section>
            )}

            {/* Production Stats - permission required */}
            {permissions.production && visibleSections.production && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Produção</h2>
                    <ProductionStats />
                </section>
            )}

            {/* Financial Stats - permission required */}
            {permissions.financial && visibleSections.financial && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Financeiro</h2>
                    <FinancialStats />
                </section>
            )}

            {/* Post-Sales Stats - permission required */}
            {permissions.postSales && visibleSections.postSales && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Pós-Venda</h2>
                    <PostSalesStats />
                </section>
            )}

            {/* Admin Stats - permission required */}
            {permissions.admin && visibleSections.admin && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Administração</h2>
                    <AdminStats />
                </section>
            )}
        </div>
    );
}
