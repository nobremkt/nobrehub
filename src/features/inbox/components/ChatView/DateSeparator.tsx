import React from 'react';
import styles from './DateSeparator.module.css';

interface DateSeparatorProps {
    date: Date;
}

/**
 * Formats date as "Hoje", "Ontem", or "DD de Mês"
 */
const formatDateLabel = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
        return 'Hoje';
    }

    if (messageDate.getTime() === yesterday.getTime()) {
        return 'Ontem';
    }

    // Format as "15 de Janeiro"
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return `${date.getDate()} de ${months[date.getMonth()]}`;
};

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
    return (
        <div className={styles.container}>
            <div className={styles.line} />
            <span className={styles.label}>{formatDateLabel(date)}</span>
            <div className={styles.line} />
        </div>
    );
};
