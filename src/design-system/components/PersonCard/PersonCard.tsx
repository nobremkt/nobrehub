
import React from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import styles from './PersonCard.module.css';

export interface PersonCardProps {
    /** Name of the person */
    name: string;
    /** Role or Title */
    role: string;
    /** URL of the profile image */
    imageUrl: string;
    /** Whether the user is online */
    isOnline?: boolean;
    /** Callback when "Ver perfil" is clicked */
    onViewProfile?: () => void;
    /** Custom class name */
    className?: string;
    /** Style overrides */
    style?: React.CSSProperties;
}

export const PersonCard: React.FC<PersonCardProps> = ({
    name,
    role,
    imageUrl,
    isOnline = true,
    onViewProfile,
    className,
    style
}) => {
    return (
        <div className={`${styles.card} ${className || ''}`} style={style}>
            {/* Background Image */}
            <img src={imageUrl} alt={name} className={styles.image} />

            {/* Gradient Overlay */}
            <div className={styles.overlay} />

            {/* Content */}
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.nameRow}>
                        <h2 className={styles.name}>{name}</h2>
                        <div className={styles.verifiedBadge}>
                            <BadgeCheck size={28} fill="white" className="text-black" strokeWidth={1.5} />
                        </div>
                    </div>
                    <p className={styles.role}>{role}</p>
                </div>

                <div className={styles.footer}>
                    {/* Status Pill */}
                    {isOnline && (
                        <div className={styles.status}>
                            <div className={styles.statusDot} />
                            <span className={styles.statusText}>Online</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <button onClick={onViewProfile} className={styles.button}>
                        Ver perfil
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
