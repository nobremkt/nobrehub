import React from 'react';
import { Conversation } from '../../types';
import { Modal } from '@/design-system';
import { getInitials } from '@/utils';
import { UserStatusIndicator } from '@/features/presence/components/UserStatusIndicator';

interface TransferableCollaborator {
    id: string;
    name: string;
    photoUrl?: string;
    authUid?: string;
}

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation;
    transferableCollaborators: TransferableCollaborator[];
    teamStatus: Record<string, { state: string }>;
    onTransfer: (userId: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
    isOpen,
    onClose,
    conversation,
    transferableCollaborators,
    teamStatus,
    onTransfer,
}) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Transferir Conversa"
        size="auto"
    >
        <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
            Selecione um membro de Vendas ou Pós-Vendas:
        </p>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '300px',
            overflowY: 'auto'
        }}>
            {transferableCollaborators.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                    Nenhum membro disponível no momento
                </p>
            ) : (
                transferableCollaborators.map(member => {
                    const userStatus = member.authUid ? teamStatus[member.authUid]?.state : 'offline';
                    const isCurrentAssigned = member.id === conversation.assignedTo;

                    return (
                        <button
                            key={member.id}
                            onClick={() => onTransfer(member.id)}
                            disabled={isCurrentAssigned}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                background: isCurrentAssigned ? 'var(--color-primary-500)' : 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: isCurrentAssigned ? 'not-allowed' : 'pointer',
                                opacity: isCurrentAssigned ? 0.7 : 1,
                                transition: 'all 0.15s ease',
                                width: '100%',
                                textAlign: 'left'
                            }}
                        >
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'var(--color-primary-500)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '14px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {member.photoUrl ? (
                                    <img src={member.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    getInitials(member.name)
                                )}
                                <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                                    <UserStatusIndicator status={userStatus as 'online' | 'idle' | 'offline'} size="sm" />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                    {member.name}
                                </div>
                                {isCurrentAssigned && (
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                                        Atribuído atualmente
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })
            )}
        </div>
    </Modal>
);
