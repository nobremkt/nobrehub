
import { Lead } from '@/types/lead.types';
import { History, Clock } from 'lucide-react';
import styles from './HistoricoTab.module.css';
import { formatDate } from '../../utils/helpers';

interface HistoricoTabProps {
    lead: Lead;
}

export function HistoricoTab({ lead }: HistoricoTabProps) {
    const timeline = [
        {
            id: '1',
            title: 'Lead criado',
            description: 'Lead adicionado ao sistema',
            time: lead.createdAt,
        },
        {
            id: '2',
            title: 'Última atualização',
            description: 'Informações do lead foram atualizadas',
            time: lead.updatedAt,
        },
    ];

    return (
        <div className={styles.tabContent}>
            <h3 className={styles.sectionTitle}>
                <History size={18} />
                Linha do Tempo
            </h3>

            <div className={styles.timeline}>
                {timeline.map((item) => (
                    <div key={item.id} className={styles.timelineItem}>
                        <div className={styles.timelineDot} />
                        <div className={styles.timelineContent}>
                            <h4 className={styles.timelineTitle}>{item.title}</h4>
                            <p className={styles.timelineDescription}>{item.description}</p>
                            <span className={styles.timelineTime}>
                                <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                {formatDate(item.time)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
