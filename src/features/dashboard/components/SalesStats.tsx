import { DollarSign, UserPlus, Percent, Briefcase } from 'lucide-react';
import { StatCard } from './StatCard';
import styles from '../pages/DashboardPage.module.css';

export function SalesStats() {
    return (
        <div className={styles.statsGrid}>
            <StatCard
                title="Leads Criados"
                value={42}
                change="+5 hoje"
                changeType="positive"
                icon={<UserPlus size={20} />}
            />
            <StatCard
                title="Vendas Fechadas"
                value={8}
                change="2 a mais que ontem"
                changeType="positive"
                icon={<Briefcase size={20} />}
            />
            <StatCard
                title="Taxa Conversão"
                value="19%"
                change="-2% vs. média"
                changeType="negative"
                icon={<Percent size={20} />}
            />
            <StatCard
                title="Ticket Médio"
                value="R$ 3.200"
                change="+R$ 200"
                changeType="positive"
                icon={<DollarSign size={20} />}
            />
        </div>
    );
}
