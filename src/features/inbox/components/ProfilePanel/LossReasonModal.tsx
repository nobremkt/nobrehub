import React, { useState } from 'react';
import { Conversation, DealStatus } from '../../types';
import { Modal, Button } from '@/design-system';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';

interface LossReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation;
    lossReasons: { value: string; label: string }[];
    onUpdateConversation: (id: string, data: Partial<Conversation>) => Promise<void>;
}

export const LossReasonModal: React.FC<LossReasonModalProps> = ({
    isOpen,
    onClose,
    conversation,
    lossReasons,
    onUpdateConversation,
}) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const { stages, moveLead, updateLead } = useKanbanStore();

    const handleClose = () => {
        onClose();
        setSelectedReason('');
    };

    const handleConfirm = async () => {
        // Find 'Perdido' stage for the lead's pipeline
        const lead = useKanbanStore.getState().leads.find(l => l.id === conversation.leadId);
        const pipeline = lead?.pipeline || 'high-ticket';
        const perdidoStage = stages.find(s => s.pipeline === pipeline && s.name === 'Perdido');

        if (perdidoStage && conversation.leadId) {
            try {
                // Move lead to 'Perdido' stage in kanbanStore + DB
                await moveLead(conversation.leadId, perdidoStage.id);
                // Set lostReason on lead
                await updateLead(conversation.leadId, { lostReason: selectedReason });
            } catch (error) {
                console.error('Erro ao marcar lead como perdido:', error);
            }
        }

        // Sync denormalized conversation data
        onUpdateConversation(conversation.id, {
            dealStatus: 'lost' as DealStatus,
            lossReason: selectedReason,
            status: 'closed'
        });
        handleClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Motivo da Perda"
            size="auto"
            footer={
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        disabled={!selectedReason}
                        onClick={handleConfirm}
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
                {lossReasons.map((reason) => (
                    <Button
                        key={reason.value}
                        variant={selectedReason === reason.value ? 'primary' : 'ghost'}
                        onClick={() => setSelectedReason(reason.value)}
                        fullWidth
                        style={{
                            height: '60px',
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            opacity: selectedReason && selectedReason !== reason.value ? 0.5 : 1,
                            border: selectedReason === reason.value
                                ? 'none'
                                : '1px solid var(--color-border)',
                            boxShadow: selectedReason === reason.value
                                ? '0 4px 12px rgba(220, 38, 38, 0.4)'
                                : 'none',
                        }}
                    >
                        {reason.label}
                    </Button>
                ))}
            </div>
        </Modal>
    );
};
