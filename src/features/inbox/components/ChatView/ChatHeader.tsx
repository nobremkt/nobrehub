import React, { useState } from 'react';
import { Conversation } from '../../types';
import { Button, Tag } from '@/design-system';
import { MoreVertical, Phone, CheckCircle, UserPlus, User, X } from 'lucide-react';
import styles from './ChatView.module.css';

interface ChatHeaderProps {
    conversation: Conversation;
    onAssign?: (userId: string | null) => void;
    onCloseConversation?: () => void;
}

// Mock team members - in production, fetch from backend
const TEAM_MEMBERS = [
    { id: 'user1', name: 'João Silva', avatar: null },
    { id: 'user2', name: 'Maria Santos', avatar: null },
    { id: 'user3', name: 'Carlos Oliveira', avatar: null },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    conversation,
    onAssign,
    onCloseConversation
}) => {
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);

    const assignedMember = TEAM_MEMBERS.find(m => m.id === conversation.assignedTo);

    const handleAssign = (userId: string | null) => {
        if (onAssign) {
            onAssign(userId);
        }
        setShowAssignDropdown(false);
    };

    return (
        <div className={styles.header}>
            <div className={styles.headerLeft}>
                <div className={styles.headerInfo}>
                    <span className={styles.headerName}>{conversation.leadName}</span>
                    <span className={styles.headerStatus}>
                        {conversation.leadCompany ? `${conversation.leadCompany} • ` : ''}
                        {conversation.leadPhone}
                        {assignedMember && (
                            <span style={{
                                marginLeft: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'var(--color-primary-100)',
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 11
                            }}>
                                <User size={12} />
                                {assignedMember.name}
                            </span>
                        )}
                    </span>
                </div>
            </div>

            <div className={styles.headerRight}>
                {conversation.status === 'open' ? (
                    <Tag variant="success" size="sm">Aberto</Tag>
                ) : (
                    <Tag variant="default" size="sm">Fechado</Tag>
                )}

                <div className={styles.actions} style={{ position: 'relative' }}>
                    {/* Assign Button */}
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
                        <div className={styles.assignDropdown}>
                            <div style={{
                                padding: 'var(--space-2) var(--space-3)',
                                fontWeight: 600,
                                fontSize: 12,
                                color: 'var(--color-text-muted)',
                                borderBottom: '1px solid var(--color-border)',
                                marginBottom: 'var(--space-1)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>Atribuir para:</span>
                                <Button variant="ghost" size="sm" onClick={() => setShowAssignDropdown(false)}>
                                    <X size={14} />
                                </Button>
                            </div>

                            {/* Remove assignment */}
                            {conversation.assignedTo && (
                                <div
                                    className={styles.assignItem}
                                    onClick={() => handleAssign(null)}
                                    style={{ color: 'var(--color-danger-500)' }}
                                >
                                    <X size={16} />
                                    <span>Remover atribuição</span>
                                </div>
                            )}

                            {/* Team members */}
                            {TEAM_MEMBERS.map(member => (
                                <div
                                    key={member.id}
                                    className={`${styles.assignItem} ${member.id === conversation.assignedTo ? styles.assignItemActive : ''}`}
                                    onClick={() => handleAssign(member.id)}
                                >
                                    <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: 'var(--color-primary-500)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: 12,
                                        fontWeight: 600
                                    }}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <span>{member.name}</span>
                                    {member.id === conversation.assignedTo && (
                                        <CheckCircle size={16} style={{ marginLeft: 'auto', color: 'var(--color-success-500)' }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

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

                    <Button variant="ghost" size="sm">
                        <MoreVertical size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
