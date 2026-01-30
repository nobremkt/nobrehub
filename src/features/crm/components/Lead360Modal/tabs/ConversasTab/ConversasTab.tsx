
import { MessageSquare } from 'lucide-react';
import styles from './ConversasTab.module.css';

export function ConversasTab() {
    return (
        <div className={styles.tabContent}>
            <h3 className={styles.sectionTitle}>
                <MessageSquare size={18} />
                Histórico de Conversas
            </h3>

            <div className={styles.emptyState}>
                <MessageSquare size={48} />
                <p>Nenhuma conversa registrada com este lead.</p>
            </div>
        </div>
    );
}
