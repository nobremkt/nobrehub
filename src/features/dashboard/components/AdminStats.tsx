import { useState, useEffect } from 'react';
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

interface TeamMember {
    id: string;
    name: string;
    role: string;
    sector: string;
    photoUrl?: string;
    isOnline: boolean;
    productivity: number;
}

interface SectorMetric {
    name: string;
    productivity: number;
    trend: 'up' | 'down' | 'stable';
    members: number;
}

interface AdminMetrics {
    teamSize: number;
    activeMembers: number;
    avgWorkload: number;
    goalsMet: number;
    efficiency: number;
    members: TeamMember[];
    productivityData: { name: string; productivity: number; projects: number }[];
    sectors: SectorMetric[];
}

function useAdminData() {
    const { dateFilter } = useDashboardStore();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<AdminMetrics | null>(null);

    useEffect(() => {
        setIsLoading(true);

        const timeout = setTimeout(() => {
            // Mock data - replace with Firebase fetch later
            const mockData: AdminMetrics = {
                teamSize: 12,
                activeMembers: 8,
                avgWorkload: 7.5,
                goalsMet: 85,
                efficiency: 88,
                members: [
                    { id: '1', name: 'João Silva', role: 'Designer', sector: 'Produção', isOnline: true, productivity: 92 },
                    { id: '2', name: 'Maria Santos', role: 'Designer', sector: 'Produção', isOnline: true, productivity: 88 },
                    { id: '3', name: 'Pedro Costa', role: 'Designer', sector: 'Produção', isOnline: false, productivity: 76 },
                    { id: '4', name: 'Ana Oliveira', role: 'Vendedor', sector: 'Comercial', isOnline: true, productivity: 94 },
                    { id: '5', name: 'Carlos Lima', role: 'Vendedor', sector: 'Comercial', isOnline: true, productivity: 82 },
                    { id: '6', name: 'Julia Ferreira', role: 'Atendimento', sector: 'Suporte', isOnline: true, productivity: 91 },
                    { id: '7', name: 'Lucas Almeida', role: 'Designer', sector: 'Produção', isOnline: false, productivity: 85 },
                    { id: '8', name: 'Fernanda Rocha', role: 'Gerente', sector: 'Administrativo', isOnline: true, productivity: 96 },
                ],
                productivityData: [
                    { name: 'Fernanda R.', productivity: 96, projects: 15 },
                    { name: 'Ana O.', productivity: 94, projects: 22 },
                    { name: 'João S.', productivity: 92, projects: 18 },
                    { name: 'Julia F.', productivity: 91, projects: 12 },
                    { name: 'Maria S.', productivity: 88, projects: 16 },
                    { name: 'Lucas A.', productivity: 85, projects: 14 },
                    { name: 'Carlos L.', productivity: 82, projects: 19 },
                    { name: 'Pedro C.', productivity: 76, projects: 11 },
                ],
                sectors: [
                    { name: 'Produção', productivity: 88, trend: 'up', members: 4 },
                    { name: 'Comercial', productivity: 85, trend: 'stable', members: 3 },
                    { name: 'Suporte', productivity: 91, trend: 'up', members: 2 },
                    { name: 'Administrativo', productivity: 96, trend: 'up', members: 3 },
                ],
            };

            setData(mockData);
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timeout);
    }, [dateFilter]);

    return { data, isLoading };
}

export function AdminStats() {
    const { data, isLoading } = useAdminData();

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

    return (
        <div className={styles.container}>
            <div className={styles.mainGrid}>
                {/* Left Column: Charts and Team */}
                <div className={styles.leftColumn}>
                    <div className={styles.leftRowTop}>
                        <ProductivityChart data={data.productivityData} />
                        <SectorPerformance sectors={data.sectors} />
                    </div>
                    <TeamOverview members={data.members} />
                </div>

                {/* Right Column: Summary Cards */}
                <div className={styles.rightColumn}>
                    <TeamSizeCard count={data.teamSize} activeCount={data.activeMembers} />
                    <AvgWorkloadCard hours={data.avgWorkload} />
                    <GoalsMetCard percentage={data.goalsMet} />
                    <EfficiencyCard score={data.efficiency} />
                </div>
            </div>
        </div>
    );
}
