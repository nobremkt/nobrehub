/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FINANCIAL STATS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Dashboard section for financial metrics - derives data from sales/leads
 * Dashboard section for financial metrics - real data from Supabase
 */

import { useEffect } from 'react';
import { Spinner } from '@/design-system';
import styles from './financial/FinancialStats.module.css';
import {
    RevenueCard,
    ExpensesCard,
    ProfitCard,
    AvgTicketCard,
    CashFlowChart,
    OperationalCostsChart,
    FinancialKPIs,
} from './financial';
import { useDashboardStore } from '../stores/useDashboardStore';

export function FinancialStats() {
    const { unifiedMetrics, isLoading, fetchMetrics } = useDashboardStore();

    // Fetch metrics on mount if not already loaded
    useEffect(() => {
        if (!unifiedMetrics) {
            fetchMetrics();
        }
    }, [unifiedMetrics, fetchMetrics]);

    const data = unifiedMetrics?.financial;

    if (isLoading && !data) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const totalCosts = data.operationalCosts.reduce((sum, c) => sum + c.value, 0);

    return (
        <div className={styles.container}>
            <div className={styles.mainGrid}>
                {/* Left Column: Charts */}
                <div className={styles.leftColumn}>
                    <div className={styles.leftRowTop}>
                        <CashFlowChart data={data.cashFlow} />
                        <OperationalCostsChart
                            data={data.operationalCosts}
                            totalCosts={totalCosts}
                        />
                    </div>
                    <div className={styles.leftRowMiddle}>
                        <FinancialKPIs
                            revenue={data.revenue}
                            expenses={data.expenses}
                            margin={data.margin}
                            operationalCosts={data.operationalCosts}
                        />
                    </div>
                </div>

                {/* Right Column: Summary Cards */}
                <div className={styles.rightColumn}>
                    <RevenueCard revenue={data.revenue} previousRevenue={data.previousRevenue} contractedRevenue={data.contractedRevenue} />
                    <ExpensesCard expenses={data.expenses} />
                    <ProfitCard profit={data.profit} margin={data.margin} />
                    <AvgTicketCard avgTicket={data.avgTicket} />
                </div>
            </div>
        </div>
    );
}
