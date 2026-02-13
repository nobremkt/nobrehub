import React, { useCallback, useEffect, useMemo } from 'react';
import { Conversation, DealStatus } from '../../types';
import { Dropdown } from '@/design-system';
import { Rocket } from 'lucide-react';
import styles from './ProfilePanel.module.css';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';
import { LeadService } from '@/features/crm/services/LeadService';

interface DealSectionProps {
    conversation: Conversation;
    assignedMemberName: string | null;
    onUpdateConversation: (id: string, data: Partial<Conversation>) => Promise<void>;
    onShowLossModal: () => void;
    onShowCreateProject: () => void;
}

export const DealSection: React.FC<DealSectionProps> = ({
    conversation,
    assignedMemberName,
    onUpdateConversation,
    onShowLossModal,
    onShowCreateProject,
}) => {
    const { stages, leads, fetchLeads, updateLead } = useKanbanStore();

    // Fetch leads if not loaded yet (stages are loaded globally in MainLayout)
    useEffect(() => {
        if (leads.length === 0) {
            fetchLeads();
        }
    }, [leads.length, fetchLeads]);

    // Handler: change stage in both Kanban store + DB
    const handleStageChange = useCallback(async (newStageId: string) => {
        // Update conversation (Inbox side)
        onUpdateConversation(conversation.id, { stage: newStageId });
        // Update lead in Kanban store (CRM side)
        updateLead(conversation.leadId, { status: newStageId });
        // Persist to DB
        try {
            await LeadService.updateLead(conversation.leadId, { status: newStageId });
        } catch (error) {
            console.error('Erro ao atualizar etapa do lead:', error);
        }
    }, [conversation.id, conversation.leadId, onUpdateConversation, updateLead]);

    // Get the lead's actual stage from the Kanban store (source of truth)
    const leadStageId = useMemo(() => {
        const lead = leads.find(l => l.id === conversation.leadId);
        return lead?.status || conversation.stage || '';
    }, [leads, conversation.leadId, conversation.stage]);

    // Filter stages dynamically by pipeline, excluding system stages
    const stageOptions = useMemo(() => {
        const pipeline = conversation.pipeline || 'high-ticket';
        return stages
            .filter(s => s.pipeline === pipeline && !['Ganho', 'Perdido'].includes(s.name))
            .sort((a, b) => a.order - b.order)
            .map(s => ({ label: s.name, value: s.id }));
    }, [stages, conversation.pipeline]);

    const pipelineLabel = conversation.pipeline === 'low-ticket' ? 'Vendas LT' : 'Vendas HT';

    // Find current stage name from the stages array using the lead's actual stage
    const currentStageName = useMemo(() => {
        const stage = stages.find(s => s.id === leadStageId);
        return stage?.name || null;
    }, [stages, leadStageId]);

    return (
        <>
            {/* Selected Deal */}
            <div className={styles.dealSection}>
                <div className={styles.dealPipeline}>
                    <span className={styles.dealLabel}>Pipeline</span>
                    <span className={styles.dealValue}>{pipelineLabel}</span>
                </div>
                <div className={styles.dealStage}>
                    <span className={styles.dealLabel}>Etapa</span>
                    <Dropdown
                        options={stageOptions}
                        value={leadStageId}
                        onChange={(val) => handleStageChange(val as string)}
                        placeholder="Selecione a etapa"
                        noSound
                    />
                </div>
                <div className={styles.dealStatus}>
                    <button
                        className={`${styles.statusButton} ${styles.won} ${conversation.dealStatus === 'won' ? styles.active : ''}`}
                        onClick={() => onUpdateConversation(conversation.id, { dealStatus: 'won' as DealStatus, status: 'closed' })}
                    >
                        Ganho
                    </button>
                    <button
                        className={`${styles.statusButton} ${styles.lost} ${conversation.dealStatus === 'lost' ? styles.active : ''}`}
                        onClick={onShowLossModal}
                    >
                        Perdido
                    </button>
                    <button
                        className={`${styles.statusButton} ${styles.open} ${(!conversation.dealStatus || conversation.dealStatus === 'open') ? styles.active : ''}`}
                        onClick={() => onUpdateConversation(conversation.id, { dealStatus: 'open' as DealStatus, status: 'open' })}
                    >
                        Aberto
                    </button>
                </div>

                {/* CTA Criar Projeto — only when deal is won */}
                {conversation.dealStatus === 'won' && (
                    <div className={styles.createProjectBanner}>
                        <div className={styles.bannerHeader}>
                            <span className={styles.bannerEmoji}>🎉</span>
                            <span className={styles.bannerText}>Venda ganha!</span>
                        </div>
                        <button
                            className={styles.createProjectBtn}
                            onClick={onShowCreateProject}
                        >
                            <Rocket size={16} />
                            Criar Projeto
                        </button>
                    </div>
                )}
            </div>

            {/* Deal Details */}
            <div className={styles.fieldList} style={{ marginTop: 'var(--spacing-3)' }}>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>Origem</span>
                    <span className={styles.fieldValue}>{conversation.channel === 'whatsapp' ? 'WhatsApp' : 'Interno'}</span>
                </div>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>Valor</span>
                    <span className={styles.fieldValue}>R$ 0,00</span>
                </div>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>Etapa</span>
                    <span className={styles.fieldValue}>
                        {currentStageName || 'Não definida'}
                    </span>
                </div>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>Dono</span>
                    <span className={styles.fieldValue}>
                        {assignedMemberName || 'Não atribuído'}
                    </span>
                </div>
            </div>
        </>
    );
};
