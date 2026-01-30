
import { Lead } from '@/types/lead.types';
import { Briefcase, DollarSign } from 'lucide-react';
import styles from './NegociosTab.module.css';
import { formatCurrency } from '../../utils/helpers';

interface NegociosTabProps {
    lead: Lead;
}

export function NegociosTab({ lead }: NegociosTabProps) {
    return (
        <div className={styles.tabContent}>
            <h3 className={styles.sectionTitle}>
                <Briefcase size={18} />
                Oportunidades e Negócios
            </h3>

            <div className={styles.sectionCard}>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Valor do Negócio</span>
                        <span className={styles.infoValue} style={{ color: '#16a34a', fontWeight: 600 }}>
                            {formatCurrency(lead.estimatedValue)}
                        </span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Status</span>
                        <span className={styles.infoValue}>{lead.status}</span>
                    </div>
                </div>
            </div>

            <div className={styles.emptyState}>
                <DollarSign size={48} />
                <p>Histórico de negócios será exibido aqui.</p>
            </div>
        </div>
    );
}
