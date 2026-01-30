
import { Lead } from '@/types/lead.types';
import { Tag } from '@/design-system/components/Tag/Tag';
import { Phone, MessageSquare, Mail, CalendarClock, StickyNote, Building2 } from 'lucide-react';
import styles from './LeadHeader.module.css';
import { getInitials, getTagVariant } from '../../utils/helpers';

interface LeadHeaderProps {
    lead: Lead;
}

export function LeadHeader({ lead }: LeadHeaderProps) {
    return (
        <header className={styles.header}>
            {/* Avatar */}
            <div className={styles.avatar}>
                <div className={styles.avatarImage}>
                    {getInitials(lead.name)}
                </div>
                <div className={styles.onlineIndicator} />
            </div>

            {/* Lead Info */}
            <div className={styles.leadInfo}>
                <div className={styles.leadNameRow}>
                    <h1 className={styles.leadName}>{lead.name}</h1>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        <button
                            className={`${styles.actionBtn} ${styles.call}`}
                            data-tooltip="Ligar"
                        >
                            <Phone size={18} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.whatsapp}`}
                            data-tooltip="WhatsApp"
                        >
                            <MessageSquare size={18} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.email}`}
                            data-tooltip="Enviar Email"
                        >
                            <Mail size={18} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.schedule}`}
                            data-tooltip="Agendar"
                        >
                            <CalendarClock size={18} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.notes}`}
                            data-tooltip="Notas"
                        >
                            <StickyNote size={18} />
                        </button>
                    </div>
                </div>

                {lead.company && (
                    <div className={styles.leadCompany}>
                        <Building2 size={16} />
                        {lead.company}
                    </div>
                )}

                {/* Tags */}
                <div className={styles.tagsContainer}>
                    {lead.tags.map((tag, index) => (
                        <Tag key={index} variant={getTagVariant(tag)} size="sm">
                            {tag}
                        </Tag>
                    ))}
                </div>
            </div>
        </header>
    );
}
