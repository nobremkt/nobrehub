/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TypingIndicator Component
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Shows animated "fulano está digitando..." indicator.
 *
 * Display logic:
 *   - 1 user:  "Beatriz está digitando..."
 *   - 2 users: "Beatriz e João estão digitando..."
 *   - 3+:      "3 pessoas estão digitando..."
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
    typingUsers: string[];
}

export const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
    const isVisible = typingUsers.length > 0;

    const getText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0]} está digitando`;
        }
        if (typingUsers.length === 2) {
            return `${typingUsers[0]} e ${typingUsers[1]} estão digitando`;
        }
        return `${typingUsers.length} pessoas estão digitando`;
    };

    return (
        <div
            className={styles.container}
            data-visible={isVisible}
            aria-live="polite"
            aria-label={isVisible ? getText() : undefined}
        >
            {isVisible && (
                <>
                    <span className={styles.dots}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                    </span>
                    <span className={styles.text}>{getText()}</span>
                </>
            )}
        </div>
    );
};
