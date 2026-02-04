import { useState, useEffect } from 'react';
import { Spinner } from '@/design-system';
import styles from './financial/FinancialStats.module.css';
import {
    RevenueCard,
    ExpensesCard,
    ProfitCard,
    AvgTicketCard,
    CashFlowChart,
    OperationalCostsChart,
    AccountsOverview,
} from './financial';
import { useDashboardStore } from '../stores/useDashboardStore';

// Mock data for financial metrics (replace with real data from Firebase later)
function useFinancialData() {
    const { dateFilter } = useDashboardStore();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<FinancialMetrics | null>(null);

    useEffect(() => {
        // Simulate API call - replace with real Firebase fetch
        setIsLoading(true);

        const timeout = setTimeout(() => {
            // Mock data based on filter
            const mockData: FinancialMetrics = {
                revenue: dateFilter === 'month' ? 85000 : dateFilter === 'week' ? 21250 : 4250,
                previousRevenue: dateFilter === 'month' ? 78000 : dateFilter === 'week' ? 19500 : 3900,
                expenses: dateFilter === 'month' ? 52000 : dateFilter === 'week' ? 13000 : 2600,
                profit: dateFilter === 'month' ? 33000 : dateFilter === 'week' ? 8250 : 1650,
                margin: 38.8,
                avgTicket: 2125,
                cashFlow: [
                    { month: 'Set', revenue: 72000, expenses: 48000, balance: 24000 },
                    { month: 'Out', revenue: 78000, expenses: 51000, balance: 27000 },
                    { month: 'Nov', revenue: 81000, expenses: 49000, balance: 32000 },
                    { month: 'Dez', revenue: 95000, expenses: 58000, balance: 37000 },
                    { month: 'Jan', revenue: 78000, expenses: 52000, balance: 26000 },
                    { month: 'Fev', revenue: 85000, expenses: 52000, balance: 33000 },
                ],
                operationalCosts: [
                    { name: 'Salários', value: 28000, color: '#3b82f6' },
                    { name: 'Ferramentas', value: 8500, color: '#8b5cf6' },
                    { name: 'Marketing', value: 6000, color: '#f59e0b' },
                    { name: 'Infra', value: 4500, color: '#06b6d4' },
                    { name: 'Impostos', value: 3500, color: '#ef4444' },
                    { name: 'Outros', value: 1500, color: '#6b7280' },
                ],
                accounts: {
                    receivable: 42500,
                    payable: 18750,
                    overdue: 5200,
                },
            };

            setData(mockData);
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timeout);
    }, [dateFilter]);

    return { data, isLoading };
}

interface FinancialMetrics {
    revenue: number;
    previousRevenue: number;
    expenses: number;
    profit: number;
    margin: number;
    avgTicket: number;
    cashFlow: { month: string; revenue: number; expenses: number; balance: number }[];
    operationalCosts: { name: string; value: number; color: string }[];
    accounts: {
        receivable: number;
        payable: number;
        overdue: number;
    };
}

export function FinancialStats() {
    const { data, isLoading } = useFinancialData();

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
                        <AccountsOverview data={data.accounts} />
                    </div>
                </div>

                {/* Right Column: Summary Cards */}
                <div className={styles.rightColumn}>
                    <RevenueCard revenue={data.revenue} previousRevenue={data.previousRevenue} />
                    <ExpensesCard expenses={data.expenses} />
                    <ProfitCard profit={data.profit} margin={data.margin} />
                    <AvgTicketCard avgTicket={data.avgTicket} />
                </div>
            </div>
        </div>
    );
}
