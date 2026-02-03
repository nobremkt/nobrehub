import { Users, Package, TrendingUp, Calendar } from 'lucide-react';
import { StatCard } from './StatCard';
import styles from '../pages/DashboardPage.module.css'; // Reusing grid styles for now, or we define local grid

export function GeneralStats() {
    return (
        <div className={styles.statsGrid}>
            <StatCard
                title="Clientes Ativos"
                value={124}
                change="+4 este mês"
                changeType="positive"
                icon={<Users size={20} />}
            />
            <StatCard
                title="Projetos Entregues"
                value={45}
                change="+12% vs. mês anterior"
                changeType="positive"
                icon={<Package size={20} />}
            />
            <StatCard
                title="Faturamento (Prev)"
                value="R$ 125k"
                change="Meta: R$ 150k"
                changeType="neutral"
                icon={<TrendingUp size={20} />}
            />
            <StatCard
                title="Prazos Próximos"
                value={3}
                change="Para esta semana"
                changeType="neutral"
                icon={<Calendar size={20} />}
            />
        </div>
    );
}
