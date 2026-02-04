/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CHAT HEADER (REFACTORED)
 * Header do chat com canal, status e ações
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Conversation } from '../../types';
import { Button, Tag } from '@/design-system';
import {
    MoreVertical,
    Phone,
    CheckCircle,
    UserPlus,
    User,
    X,
    MessageCircle,
    Star,
    Pin,
    Archive,
    ExternalLink,
    // Icons para canal
    Smartphone
} from 'lucide-react';
import { getInitials, formatPhone } from '@/utils';
import styles from './ChatHeader.module.css';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { UserStatusIndicator } from '@/features/presence/components/UserStatusIndicator';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';

interface ChatHeaderProps {
    conversation: Conversation;
    onAssign?: (userId: string | null) => void;
    onCloseConversation?: () => void;
    onToggleFavorite?: () => void;
    onTogglePin?: () => void;
}

// WhatsApp Icon Component
const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    conversation,
    onAssign,
    onCloseConversation,
    onToggleFavorite,
    onTogglePin
}) => {
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const { sectors, fetchSectors } = useSectorStore();
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
    const teamStatus = useTeamStatus();

    useEffect(() => {
        // Load collaborators and sectors if not loaded
        if (collaborators.length === 0) {
            fetchCollaborators();
        }
        if (sectors.length === 0) {
            fetchSectors();
        }
    }, [fetchCollaborators, fetchSectors]);

    const assignedMember = collaborators.find(m => m.id === conversation.assignedTo);

    // Filter: only sales sector (Vendas) + online or away
    const salesCollaborators = useMemo(() => {
        const salesSectorIds = sectors
            .filter(s => s.name.toLowerCase().includes('vendas'))
            .map(s => s.id);

        return collaborators.filter(member => {
            // Must be active and in sales sector
            if (!member.active || !salesSectorIds.includes(member.sectorId || '')) {
                return false;
            }
            // Must be online or away (not offline)
            const status = member.authUid ? teamStatus[member.authUid]?.state : 'offline';
            return status === 'online' || status === 'idle';
        });
    }, [collaborators, sectors, teamStatus]);

    const handleAssign = (userId: string | null) => {
        if (onAssign) {
            onAssign(userId);
        }
        setShowAssignDropdown(false);
    };

    // Detectar canal baseado no channel da conversation
    const getChannelInfo = () => {
        const channel = conversation.channel || 'whatsapp';
        switch (channel) {
            case 'whatsapp':
                return { icon: <WhatsAppIcon size={14} />, label: 'WhatsApp', color: '#25D366' };
            case 'internal':
                return { icon: <MessageCircle size={14} />, label: 'Interno', color: 'var(--color-text-muted)' };
            default:
                return { icon: <Smartphone size={14} />, label: 'Outro', color: 'var(--color-text-muted)' };
        }
    };

    const channelInfo = getChannelInfo();

    return (
        <div className={styles.header}>
            {/* Avatar */}
            <div className={styles.avatar}>
                {conversation.leadAvatar ? (
                    <img src={conversation.leadAvatar} alt="" className={styles.avatarImg} />
                ) : (
                    getInitials(conversation.leadName)
                )}
                {/* Status indicator */}
                <span className={`${styles.statusDot} ${conversation.status === 'open' ? styles.online : ''}`} />
            </div>

            {/* Info */}
            <div className={styles.info}>
                <div className={styles.nameRow}>
                    <span className={styles.name}>{conversation.leadName}</span>
                    {/* Channel Badge */}
                    <span
                        className={styles.channelBadge}
                        style={{ '--channel-color': channelInfo.color } as React.CSSProperties}
                    >
                        {channelInfo.icon}
                        {channelInfo.label}
                    </span>
                </div>
                <div className={styles.subRow}>
                    <span className={styles.phone}>{formatPhone(conversation.leadPhone || '')}</span>
                    {conversation.leadCompany && (
                        <>
                            <span className={styles.separator}>•</span>
                            <span className={styles.company}>{conversation.leadCompany}</span>
                        </>
                    )}
                    {assignedMember && (
                        <>
                            <span className={styles.separator}>•</span>
                            <span className={styles.assignedTo}>
                                <User size={12} />
                                {assignedMember.name}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Status Tag */}
            <div className={styles.statusSection}>
                {conversation.status === 'open' ? (
                    <Tag variant="success">Aberto</Tag>
                ) : (
                    <Tag variant="default">Fechado</Tag>
                )}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                {/* Favorite Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleFavorite}
                    title={conversation.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className={conversation.isFavorite ? styles.favoriteActive : ''}
                >
                    <Star size={18} fill={conversation.isFavorite ? 'currentColor' : 'none'} />
                </Button>

                {/* Pin Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePin}
                    title={conversation.isPinned ? 'Desafixar' : 'Fixar no topo'}
                    className={conversation.isPinned ? styles.pinActive : ''}
                >
                    <Pin size={18} fill={conversation.isPinned ? 'currentColor' : 'none'} />
                </Button>

                {/* Assign Button */}
                <div className={styles.actionWrapper}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                        title="Atribuir conversa"
                    >
                        <UserPlus size={18} />
                    </Button>

                    {/* Assign Dropdown */}
                    {showAssignDropdown && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <span>Atribuir para:</span>
                                <button
                                    className={styles.dropdownClose}
                                    onClick={() => setShowAssignDropdown(false)}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className={styles.dropdownList}>
                                {/* Remove assignment */}
                                {conversation.assignedTo && (
                                    <button
                                        className={`${styles.dropdownItem} ${styles.dangerItem}`}
                                        onClick={() => handleAssign(null)}
                                    >
                                        <X size={16} />
                                        <span>Remover atribuição</span>
                                    </button>
                                )}

                                {/* Sales team members (online/idle only) */}
                                {salesCollaborators.length === 0 ? (
                                    <div className={styles.dropdownItem} style={{ color: 'var(--color-text-muted)', cursor: 'default' }}>
                                        <span>Nenhum vendedor disponível</span>
                                    </div>
                                ) : (
                                    salesCollaborators.map(member => {
                                        const userStatus = member.authUid ? teamStatus[member.authUid]?.state : 'offline';

                                        return (
                                            <button
                                                key={member.id}
                                                className={`${styles.dropdownItem} ${member.id === conversation.assignedTo ? styles.activeItem : ''}`}
                                                onClick={() => handleAssign(member.id)}
                                            >
                                                <div className={styles.memberAvatar} style={{ position: 'relative' }}>
                                                    {member.photoUrl ? (
                                                        <img src={member.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        member.name.charAt(0)
                                                    )}
                                                    <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                                                        <UserStatusIndicator status={userStatus} size="sm" />
                                                    </div>
                                                </div>
                                                <span>{member.name}</span>
                                                {member.id === conversation.assignedTo && (
                                                    <CheckCircle size={16} className={styles.checkIcon} />
                                                )}
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Close/Open Conversation */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCloseConversation}
                    title={conversation.status === 'open' ? 'Encerrar conversa' : 'Reabrir conversa'}
                >
                    <CheckCircle size={18} />
                </Button>

                <Button variant="ghost" size="sm" title="Ligar">
                    <Phone size={18} />
                </Button>

                <div style={{ position: 'relative' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                        title="Mais opções"
                    >
                        <MoreVertical size={18} />
                    </Button>

                    {showOptionsDropdown && (
                        <div className={styles.dropdown} style={{ right: 0, minWidth: '180px' }}>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    const phone = conversation.leadPhone.replace(/\D/g, '');
                                    window.open(`https://wa.me/${phone}`, '_blank');
                                    setShowOptionsDropdown(false);
                                }}
                            >
                                <ExternalLink size={16} />
                                <span>Abrir no WhatsApp</span>
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    if (onToggleFavorite) onToggleFavorite();
                                    setShowOptionsDropdown(false);
                                }}
                            >
                                <Star size={16} />
                                <span>{conversation.isFavorite ? 'Remover favorito' : 'Favoritar'}</span>
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    if (onTogglePin) onTogglePin();
                                    setShowOptionsDropdown(false);
                                }}
                            >
                                <Pin size={16} />
                                <span>{conversation.isPinned ? 'Desafixar' : 'Fixar no topo'}</span>
                            </button>
                            <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    if (onCloseConversation) onCloseConversation();
                                    setShowOptionsDropdown(false);
                                }}
                            >
                                <Archive size={16} />
                                <span>Arquivar conversa</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
