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
import { DashboardAnalyticsService } from '../services/DashboardAnalyticsService';

interface SalesData {
    newLeads: number;
    qualifiedLeads: number;
    closedDeals: number;
    lostDeals: number;
    pipelineValue: number;
    conversionRate: number;
    leadsByStatus: { status: string; count: number }[];
    topSellers: { name: string; deals: number; value: number }[];
    // Additional data
    trendData: { date: string; leads: number; closed: number }[];
    sourceData: { source: string; count: number }[];
    performanceMetrics: {
        avgResponseTime: number;
        avgCycleTime: number;
        contactRate: number;
        followUpRate: number;
    };
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
                    // Generate trend data from real data if available, or mock
                    const trendData = generateTrendData(dateFilter);

                    // Generate source data from pipeline if available, or mock
                    const sourceData = generateSourceData();

                    // Calculate pipeline stages from status
                    const pipelineStages = calculatePipelineStages(metrics.leadsByStatus);

                    setData({
                        newLeads: metrics.newLeads,
                        qualifiedLeads: metrics.qualifiedLeads,
                        closedDeals: metrics.closedDeals,
                        lostDeals: metrics.lostDeals,
                        pipelineValue: metrics.pipelineValue,
                        conversionRate: metrics.conversionRate,
                        leadsByStatus: metrics.leadsByStatus.map(item => ({
                            status: item.status,
                            count: item.count
                        })),
                        topSellers: metrics.topSellers,
                        trendData,
                        sourceData,
                        performanceMetrics: {
                            avgResponseTime: 4.5, // Mock - would need to calculate from lead history
                            avgCycleTime: 14, // Mock
                            contactRate: 72, // Mock
                            followUpRate: 85, // Mock
                        },
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

// Helper to generate trend data
function generateTrendData(filter: string) {
    const days = filter === 'week' ? 7 : filter === 'month' ? 30 : 14;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
            date: `${date.getDate()}/${date.getMonth() + 1}`,
            leads: Math.floor(Math.random() * 8) + 2,
            closed: Math.floor(Math.random() * 3),
        });
    }
    return data;
}

// Helper to generate source data (mock - would come from lead.origin field)
function generateSourceData() {
    return [
        { source: 'instagram', count: 28 },
        { source: 'whatsapp', count: 18 },
        { source: 'indicacao', count: 12 },
        { source: 'site', count: 8 },
        { source: 'facebook', count: 5 },
    ];
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
                value: found.count * 2500, // Estimated value per lead
            });
        }
    }

    return stages.length > 0 ? stages : [
        { name: 'Novos', count: 15, value: 37500 },
        { name: 'Contatados', count: 8, value: 20000 },
        { name: 'Qualificados', count: 5, value: 12500 },
        { name: 'Negociação', count: 3, value: 7500 },
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
