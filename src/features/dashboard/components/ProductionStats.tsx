import { useEffect } from 'react';
import styles from './production/ProductionStats.module.css';
import {
    ProductionGoalCard,

    ProjectsSummaryCard,
    RevisionsCard,
    DailyRankingCard,
    CategoryDistributionCard,
    ProductionHighlights,
    ActiveProducersCard,
    TotalPointsCard,
    PodiumSection,
    AlterationsRankingCard,
} from './production';
import { useDashboardStore } from '../stores/useDashboardStore';
import { Spinner } from '@/design-system';

export function ProductionStats() {
    const { fetchMetrics, isLoading, metrics } = useDashboardStore();

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    if (isLoading && !metrics) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <div className={styles.leftRowTop}>
                        <ProductionGoalCard />
                        <CategoryDistributionCard />
                        <ProductionHighlights />
                    </div>
                    <div className={styles.leftRowBottom}>
                        <DailyRankingCard />
                        <AlterationsRankingCard />
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <ProjectsSummaryCard />
                    <RevisionsCard />
                    <ActiveProducersCard />
                    <TotalPointsCard />
                </div>
            </div>

            <PodiumSection />
        </div>
    );
}

