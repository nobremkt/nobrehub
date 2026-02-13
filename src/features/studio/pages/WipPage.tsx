import { Construction } from 'lucide-react';
import styles from './WipPage.module.css';

interface WipPageProps {
    title: string;
    description?: string;
}

export function WipPage({ title, description }: WipPageProps) {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <Construction size={36} />
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>
                {description || 'Esta funcionalidade está sendo desenvolvida e estará disponível em breve.'}
            </p>
            <span className={styles.badge}>
                <Construction size={12} />
                Em breve
            </span>
        </div>
    );
}
