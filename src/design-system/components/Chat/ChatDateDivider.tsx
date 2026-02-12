import styles from './ChatDateDivider.module.css';

interface ChatDateDividerProps {
    label: string;
}

export const ChatDateDivider = ({ label }: ChatDateDividerProps) => {
    return (
        <div className={styles.dateDivider}>
            <span className={styles.dateDividerLabel}>{label}</span>
        </div>
    );
};
