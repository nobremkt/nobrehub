import { useNavigate } from 'react-router-dom';
import { Lead } from '@/types/lead.types';
import { Tag } from '@/design-system/components/Tag/Tag';
import { Phone, MessageSquare, Mail, CalendarClock, StickyNote, Building2 } from 'lucide-react';
import styles from './LeadHeader.module.css';
import { getInitials, getTagVariant } from '../../utils/helpers';
import { useInboxStore } from '@/features/inbox/stores/useInboxStore';
import { toast } from 'react-toastify';

interface LeadHeaderProps {
    lead: Lead;
}

// Normaliza telefone para comparação
const normalizePhone = (phone: string): string => {
    return phone?.replace(/\D/g, '') || '';
};

export function LeadHeader({ lead }: LeadHeaderProps) {
    const navigate = useNavigate();
    const { conversations, selectConversation, init } = useInboxStore();

    // Handler para ligar
    const handleCall = () => {
        if (lead.phone) {
            window.open(`tel:${lead.phone}`, '_self');
        } else {
            toast.warning('Telefone não cadastrado');
        }
    };

    // Handler para WhatsApp - vai para conversa existente ou abre WhatsApp Web
    const handleWhatsApp = () => {
        if (!lead.phone) {
            toast.warning('Telefone não cadastrado');
            return;
        }

        // Inicializa store se necessário
        if (conversations.length === 0) {
            init();
        }

        // Procura conversa existente
        const leadPhone = normalizePhone(lead.phone);
        const existingConversation = conversations.find(c =>
            normalizePhone(c.leadPhone) === leadPhone && c.channel === 'whatsapp'
        );

        if (existingConversation) {
            // Vai para conversa existente no Inbox
            selectConversation(existingConversation.id);
            navigate('/inbox');
        } else {
            // Abre WhatsApp Web
            const phone = normalizePhone(lead.phone);
            window.open(`https://wa.me/${phone}`, '_blank');
        }
    };

    // Handler para email
    const handleEmail = () => {
        if (lead.email) {
            window.open(`mailto:${lead.email}`, '_self');
        } else {
            toast.warning('Email não cadastrado');
        }
    };

    // Handler para agendar
    const handleSchedule = () => {
        toast.info('Funcionalidade de agendamento em breve!');
    };

    // Handler para notas
    const handleNotes = () => {
        toast.info('Funcionalidade de notas em breve!');
    };

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
                            onClick={handleCall}
                        >
                            <Phone size={18} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.whatsapp}`}
                            data-tooltip="WhatsApp"
                            onClick={handleWhatsApp}
                        >
                            <MessageSquare size={18} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.email}`}
                            data-tooltip="Enviar Email"
                            onClick={handleEmail}
                        >
                            <Mail size={18} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.schedule}`}
                            data-tooltip="Agendar"
                            onClick={handleSchedule}
                        >
                            <CalendarClock size={18} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.notes}`}
                            data-tooltip="Notas"
                            onClick={handleNotes}
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
