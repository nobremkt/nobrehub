import { Landmark, TrendingDown, PieChart, Activity } from 'lucide-react';
import { StatCard } from './StatCard';
import styles from '../pages/DashboardPage.module.css';

export function AdminStats() {
    return (
        <div className={styles.statsGrid}>
            <StatCard
                title="Receita Recorrente"
                value="R$ 85k"
                change="+R$ 5k MRR"
                changeType="positive"
                icon={<Landmark size={20} />}
            />
            <StatCard
                title="Custos Operacionais"
                value="R$ 32k"
                change="Dentro do budget"
                changeType="neutral"
                icon={<TrendingDown size={20} />}
            />
            <StatCard
                title="Margem Líquida"
                value="35%"
                change="+2% vs. ano passado"
                changeType="positive"
                icon={<PieChart size={20} />}
            />
            <StatCard
                title="Produtividade Equipe"
                value="92%"
                change="Alta performance"
                changeType="positive"
                icon={<Activity size={20} />}
            />
        </div>
    );
}
