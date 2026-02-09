/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - ADMIN STATS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Dashboard section for administrative metrics - uses real Firebase data
 */

import { useEffect } from 'react';
import { Spinner } from '@/design-system';
import styles from './admin/AdminStats.module.css';
import {
    TeamSizeCard,
    AvgWorkloadCard,
    GoalsMetCard,
    EfficiencyCard,
    TeamOverview,
    ProductivityChart,
    SectorPerformance,
} from './admin';
import { useDashboardStore } from '../stores/useDashboardStore';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';

export function AdminStats() {
    const { unifiedMetrics, isLoading, fetchMetrics } = useDashboardStore();
    const teamStatus = useTeamStatus();

    // Fetch metrics on mount if not already loaded
    useEffect(() => {
        if (!unifiedMetrics) {
            fetchMetrics();
        }
    }, [unifiedMetrics, fetchMetrics]);

    const adminData = unifiedMetrics?.admin;

    if (isLoading && !adminData) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (!adminData) {
        return null;
    }

    // Enrich members with online status from presence system
    const membersWithStatus = adminData.members.map(member => ({
        ...member,
        isOnline: teamStatus[member.id]?.state === 'online',
        productivity: Math.min(100, Math.round((member.pointsEarned / Math.max(member.projectsDelivered, 1)) * 10))
    }));

    return (
        <div className={styles.container}>
            <div className={styles.mainGrid}>
                {/* Left Column: Charts and Team */}
                <div className={styles.leftColumn}>
                    <div className={styles.leftRowTop}>
                        <ProductivityChart data={adminData.productivityData} />
                        <SectorPerformance sectors={adminData.sectors} />
                    </div>
                    <TeamOverview members={membersWithStatus} />
                </div>

                {/* Right Column: Summary Cards */}
                <div className={styles.rightColumn}>
                    <TeamSizeCard count={adminData.teamSize} activeCount={adminData.activeMembers} />
                    <AvgWorkloadCard projectsPerMember={adminData.avgWorkload} />
                    <GoalsMetCard percentage={adminData.goalsMet} />
                    <EfficiencyCard score={adminData.efficiency} />
                </div>
            </div>
        </div>
    );
}
