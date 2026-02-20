import { useMemo, useEffect } from 'react';
import { Spinner } from '@/design-system';
import styles from './sales/SalesStats.module.css';
import {
    LeadsCard,
    ClosedDealsCard,
    ConversionRateCard,
    PipelineValueCard,
    SalesFunnelChart,
    TopSellersRanking,
    SalesTrendChart,
    LeadSourceChart,
    SalesPerformanceMetrics,
    PipelineOverview,
} from './sales';
import { useDashboardStore } from '../stores/useDashboardStore';

// Calculate pipeline stages from status data
function calculatePipelineStages(statusData: { status: string; count: number; value: number }[]) {
    const stageOrder = ['new', 'contacted', 'qualified', 'negotiation', 'proposal'];
    const stageLabels: Record<string, string> = {
        'new': 'Novos',
        'contacted': 'Contatados',
        'qualified': 'Qualificados',
        'negotiation': 'Negociação',
        'proposal': 'Proposta',
    };

    const stages: { name: string; count: number; value: number }[] = [];

    for (const stage of stageOrder) {
        const found = statusData.find(s => s.status === stage);
        if (found) {
            stages.push({
                name: stageLabels[stage] || stage,
                count: found.count,
                value: found.value,
            });
        }
    }

    return stages.length > 0 ? stages : [
        { name: 'Novos', count: 0, value: 0 },
        { name: 'Contatados', count: 0, value: 0 },
        { name: 'Qualificados', count: 0, value: 0 },
        { name: 'Negociação', count: 0, value: 0 },
    ];
}

export function SalesStats() {
    const { unifiedMetrics, isLoading, fetchMetrics } = useDashboardStore();

    // Fetch metrics on mount if not already loaded
    useEffect(() => {
        if (!unifiedMetrics) {
            fetchMetrics();
        }
    }, [unifiedMetrics, fetchMetrics]);

    const data = unifiedMetrics?.sales;

    // Calculate pipeline stages from status data (memoized)
    const pipelineStages = useMemo(
        () => data ? calculatePipelineStages(data.leadsByStatus) : [],
        [data]
    );

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

    // Transform leadsByStatus for funnel chart
    const funnelData = data.leadsByStatus.map(item => ({
        stage: item.status,
        count: item.count
    }));

    return (
        <div className={styles.container}>
            <div className={styles.mainGrid}>
                {/* Left Column: Charts */}
                <div className={styles.leftColumn}>
                    {/* Row 1: Trend + Performance */}
                    <div className={styles.leftRowTop}>
                        <SalesTrendChart data={data.trendData} />
                        <SalesPerformanceMetrics data={data.performanceMetrics} />
                    </div>

                    {/* Row 2: Funnel + Sources */}
                    <div className={styles.leftRowMiddle}>
                        <SalesFunnelChart data={funnelData} />
                        <LeadSourceChart data={data.sourceData} />
                    </div>

                    {/* Row 3: Pipeline + Top Sellers */}
                    <div className={styles.leftRowBottom}>
                        <PipelineOverview stages={pipelineStages} />
                        <TopSellersRanking sellers={data.topSellers} />
                    </div>
                </div>

                {/* Right Column: Summary Cards */}
                <div className={styles.rightColumn}>
                    <LeadsCard count={data.newLeads} qualified={data.qualifiedLeads} />
                    <ClosedDealsCard closed={data.closedDeals} lost={data.lostDeals} />
                    <ConversionRateCard rate={data.conversionRate} />
                    <PipelineValueCard value={data.pipelineValue} />
                </div>
            </div>
        </div>
    );
}
