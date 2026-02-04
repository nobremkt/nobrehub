import { useNavigate } from 'react-router-dom';
import { Lead } from '@/types/lead.types';
import { Dropdown } from '@/design-system';
import {
    Phone,
    MessageSquare,
    Mail,
    Star,
    Pin,
    Grid3X3,
    Maximize2
} from 'lucide-react';
import styles from './LeadHeader.module.css';
import { getInitials } from '../../utils/helpers';
import { useInboxStore } from '@/features/inbox/stores/useInboxStore';
import { toast } from 'react-toastify';
import { useState } from 'react';

interface LeadHeaderProps {
    lead: Lead;
    onStatusChange?: (status: 'won' | 'lost' | 'open') => void;
}

// Normaliza telefone para comparação
const normalizePhone = (phone: string): string => {
    return phone?.replace(/\D/g, '') || '';
};

export function LeadHeader({ lead, onStatusChange }: LeadHeaderProps) {
    const navigate = useNavigate();
    const { conversations, selectConversation, init } = useInboxStore();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

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

    // Handler para favorito
    const handleFavorite = () => {
        setIsFavorite(!isFavorite);
        toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    };

    // Handler para fixar
    const handlePin = () => {
        setIsPinned(!isPinned);
        toast.success(isPinned ? 'Fixação removida' : 'Contato fixado');
    };

    // Status options
    const statusOptions = [
        { value: 'won', label: 'Ganho' },
        { value: 'lost', label: 'Perdido' },
        { value: 'open', label: 'Aberto' },
    ];

    return (
        <header className={styles.header}>
            {/* Avatar */}
            <div className={styles.avatar}>
                <div className={styles.avatarImage}>
                    {getInitials(lead.name)}
                </div>
                <div className={styles.onlineIndicator} />
            </div>

            {/* Lead Name */}
            <h1 className={styles.leadName}>{lead.name}</h1>

            {/* Quick Action Icons */}
            <div className={styles.actionIcons}>
                <button
                    className={styles.iconBtn}
                    onClick={handleCall}
                    title="Ligar"
                >
                    <Phone size={16} />
                </button>
                <button
                    className={styles.iconBtn}
                    onClick={handleWhatsApp}
                    title="WhatsApp"
                >
                    <MessageSquare size={16} />
                </button>
                <button
                    className={styles.iconBtn}
                    onClick={handleEmail}
                    title="Email"
                >
                    <Mail size={16} />
                </button>
                <button
                    className={`${styles.iconBtn} ${isFavorite ? styles.active : ''}`}
                    onClick={handleFavorite}
                    title="Favorito"
                >
                    <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                    className={`${styles.iconBtn} ${isPinned ? styles.active : ''}`}
                    onClick={handlePin}
                    title="Fixar"
                >
                    <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Separator */}
            <div className={styles.separator} />

            {/* Status Dropdowns */}
            <div className={styles.statusSection}>
                <Dropdown
                    options={statusOptions}
                    value={lead.status || 'open'}
                    onChange={(val) => onStatusChange?.(val as 'won' | 'lost' | 'open')}
                    placeholder="Status"
                    noSound
                />
            </div>

            {/* Separator */}
            <div className={styles.separator} />

            {/* Grid/Expand Icons */}
            <div className={styles.viewIcons}>
                <button className={styles.iconBtn} title="Visualização em Grade">
                    <Grid3X3 size={16} />
                </button>
                <button className={styles.iconBtn} title="Expandir">
                    <Maximize2 size={16} />
                </button>
            </div>
        </header>
    );
}
