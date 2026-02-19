import { useNavigate } from 'react-router-dom';
import { Lead } from '@/types/lead.types';
import {
    Phone,
    MessageSquare,
    Mail,
    Star,
    Pin,
    Rocket
} from 'lucide-react';
import styles from './LeadHeader.module.css';
import { getInitials } from '../../utils/helpers';
import { useInboxStore } from '@/features/inbox/stores/useInboxStore';
import { useLossReasonStore } from '@/features/settings/stores/useLossReasonStore';
import { CreateProjectModal } from '@/features/production/components/CreateProjectModal';
import { Modal, Button } from '@/design-system';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';

interface LeadHeaderProps {
    lead: Lead;
    onStatusChange?: (status: 'won' | 'lost' | 'open', lossReasonId?: string) => void;
    onLeadUpdated?: () => void;
    tabsNav?: import('react').ReactNode;
}

// Normaliza telefone para comparação
const normalizePhone = (phone: string): string => {
    return phone?.replace(/\D/g, '') || '';
};

export function LeadHeader({ lead, onStatusChange, onLeadUpdated, tabsNav }: LeadHeaderProps) {
    const navigate = useNavigate();
    const { conversations, selectConversation, init } = useInboxStore();
    const { lossReasons, fetchLossReasons } = useLossReasonStore();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [showLostModal, setShowLostModal] = useState(false);
    const [selectedLossReason, setSelectedLossReason] = useState('');

    // Carrega motivos de perda
    useEffect(() => {
        if (lossReasons.length === 0) fetchLossReasons();
    }, [lossReasons.length, fetchLossReasons]);

    // Motivos ativos e ordenados
    const LOSS_REASONS = [...lossReasons]
        .filter(r => r.active)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map(r => ({ value: r.id, label: r.name }));

    // Verifica se o deal está ganho
    const isDealWon = lead.dealStatus === 'won';

    // Verifica se o deal está perdido
    const isDealLost = lead.dealStatus === 'lost';

    // Verifica se o deal está aberto
    const isDealOpen = !lead.dealStatus || lead.dealStatus === 'open';

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

    // Handler para Ganho
    const handleWon = () => {
        onStatusChange?.('won');
        toast.success('Lead marcado como GANHO!');
    };

    // Handler para Aberto
    const handleOpen = () => {
        onStatusChange?.('open');
        toast.info('Lead marcado como ABERTO!');
    };

    // Handler para Perdido — abre modal de motivo
    const handleLostClick = () => {
        setShowLostModal(true);
    };

    // Confirma o motivo de perda
    const handleLostConfirm = () => {
        if (!selectedLossReason) return;

        onStatusChange?.('lost', selectedLossReason);

        const reasonName = LOSS_REASONS.find(r => r.value === selectedLossReason)?.label || 'Perdido';
        toast.info(`Lead marcado como perdido: ${reasonName}`);

        setShowLostModal(false);
        setSelectedLossReason('');
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerMain}>
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

                {tabsNav ? <div className={styles.tabsInline}>{tabsNav}</div> : null}

                {/* Separator */}
                <div className={styles.separator} />

                {/* Status Buttons - Ganho/Perdido */}
                <div className={styles.statusButtons}>
                    <button
                        className={`${styles.wonBtn} ${isDealWon ? styles.active : ''}`}
                        onClick={handleWon}
                        title="Marcar como Ganho"
                    >
                        <span>Ganho</span>
                    </button>
                    <button
                        className={`${styles.lostBtn} ${isDealLost ? styles.active : ''}`}
                        onClick={handleLostClick}
                        title="Marcar como Perdido"
                    >
                        <span>Perdido</span>
                    </button>
                    <button
                        className={`${styles.openBtn} ${isDealOpen ? styles.active : ''}`}
                        onClick={handleOpen}
                        title="Marcar como Aberto"
                    >
                        <span>Aberto</span>
                    </button>

                    {/* CTA Criar Projeto - aparece quando deal é ganho */}
                    {isDealWon && (
                        <>
                            <div className={styles.separator} />
                            <button
                                className={styles.createProjectBtn}
                                onClick={() => setShowCreateProjectModal(true)}
                                title="Criar Projeto na Produção"
                            >
                                <Rocket size={16} />
                                <span>Criar Projeto</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Motivo de Perda */}
            <Modal
                isOpen={showLostModal}
                onClose={() => {
                    setShowLostModal(false);
                    setSelectedLossReason('');
                }}
                title="Motivo da Perda"
                size="auto"
                footer={
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowLostModal(false);
                                setSelectedLossReason('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!selectedLossReason}
                            onClick={handleLostConfirm}
                        >
                            Confirmar
                        </Button>
                    </div>
                }
            >
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Selecione o motivo pelo qual este lead foi perdido:
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                }}>
                    {LOSS_REASONS.map((reason) => (
                        <Button
                            key={reason.value}
                            variant={selectedLossReason === reason.value ? 'primary' : 'ghost'}
                            onClick={() => setSelectedLossReason(reason.value)}
                            fullWidth
                            style={{
                                height: '60px',
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                opacity: selectedLossReason && selectedLossReason !== reason.value ? 0.5 : 1,
                                border: selectedLossReason === reason.value
                                    ? 'none'
                                    : '1px solid var(--color-border)',
                                boxShadow: selectedLossReason === reason.value
                                    ? '0 4px 12px rgba(220, 38, 38, 0.4)'
                                    : 'none',
                            }}
                        >
                            {reason.label}
                        </Button>
                    ))}
                </div>
            </Modal>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={showCreateProjectModal}
                onClose={() => setShowCreateProjectModal(false)}
                leadId={lead.id}
                leadName={lead.name}
                onProjectCreated={(projectId) => {
                    toast.success(`Projeto criado com sucesso! ID: ${projectId}`);
                    onLeadUpdated?.();
                }}
            />
        </header>
    );
}
