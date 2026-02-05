import { useState, useEffect } from 'react';
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
import { DashboardAnalyticsService, SalesMetrics } from '../services/DashboardAnalyticsService';

interface SalesData extends SalesMetrics {
    pipelineStages: { name: string; count: number; value: number }[];
}

function useSalesData() {
    const { dateFilter } = useDashboardStore();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<SalesData | null>(null);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const fetchData = async () => {
            try {
                const metrics = await DashboardAnalyticsService.getSalesMetrics(dateFilter);

                if (isMounted) {
                    // Calculate pipeline stages from status
                    const pipelineStages = calculatePipelineStages(metrics.leadsByStatus);

                    setData({
                        ...metrics,
                        pipelineStages,
                    });
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error fetching sales metrics:', error);
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [dateFilter]);

    return { data, isLoading };
}

// Calculate pipeline stages from status data
function calculatePipelineStages(statusData: { status: string; count: number }[]) {
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
                value: found.count * 2500, // Estimated value per lead - TODO: use real estimatedValue
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
    const { data, isLoading } = useSalesData();

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
                        <PipelineOverview stages={data.pipelineStages} />
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
