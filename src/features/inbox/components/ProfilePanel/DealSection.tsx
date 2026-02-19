import React, { useCallback, useEffect, useMemo } from 'react';
import { Conversation, DealStatus } from '../../types';
import { Dropdown } from '@/design-system';
import { Rocket } from 'lucide-react';
import styles from './ProfilePanel.module.css';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';

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
    const { stages, leads, fetchLeads, moveLead, updateLead } = useKanbanStore();

    // Fetch leads if not loaded yet (stages are loaded globally in MainLayout)
    useEffect(() => {
        if (leads.length === 0) {
            fetchLeads();
        }
    }, [leads.length, fetchLeads]);

    // kanbanStore lead = source of truth para deal data
    const kanbanLead = useMemo(() => {
        return leads.find(l => l.id === conversation.leadId) || null;
    }, [leads, conversation.leadId]);

    // Stage UUID: do kanbanStore (source of truth)
    const leadStageId = kanbanLead?.status || '';

    // Pipeline: do kanbanStore (source of truth)
    const pipeline = kanbanLead?.pipeline || 'high-ticket';

    // DealStatus: do kanbanStore (source of truth)
    const dealStatus = kanbanLead?.dealStatus || conversation.dealStatus || 'open';

    // Filter stages dynamically by pipeline, excluding system stages
    const stageOptions = useMemo(() => {
        return stages
            .filter(s => s.pipeline === pipeline && !['Ganho', 'Perdido'].includes(s.name))
            .sort((a, b) => a.order - b.order)
            .map(s => ({ label: s.name, value: s.id }));
    }, [stages, pipeline]);

    // Pipeline options for the switcher
    const pipelineOptions = [
        { label: 'Vendas HT', value: 'high-ticket' },
        { label: 'Vendas LT', value: 'low-ticket' },
    ];

    // Find current stage name from the stages array using the lead's actual stage
    const currentStageName = useMemo(() => {
        const stage = stages.find(s => s.id === leadStageId);
        return stage?.name || null;
    }, [stages, leadStageId]);

    // Handler: change stage via kanbanStore.moveLead (single source of truth)
    const handleStageChange = useCallback(async (newStageId: string) => {
        if (!conversation.leadId) return;
        try {
            await moveLead(conversation.leadId, newStageId);
        } catch (error) {
            console.error('Erro ao atualizar etapa do lead:', error);
        }
    }, [conversation.leadId, moveLead]);

    // Handler: switch pipeline — move lead to first stage of new pipeline
    const handlePipelineChange = useCallback(async (newPipeline: string) => {
        if (!conversation.leadId || newPipeline === pipeline) return;
        const firstStage = stages
            .filter(s => s.pipeline === newPipeline && !['Ganho', 'Perdido'].includes(s.name))
            .sort((a, b) => a.order - b.order)[0];
        if (!firstStage) return;

        try {
            await updateLead(conversation.leadId, { pipeline: newPipeline as 'high-ticket' | 'low-ticket' });
            await moveLead(conversation.leadId, firstStage.id);
            await onUpdateConversation(conversation.id, {
                pipeline: newPipeline,
                dealStatus: 'open' as DealStatus,
                status: 'open',
            });
        } catch (error) {
            console.error('Erro ao trocar pipeline:', error);
        }
    }, [conversation.leadId, conversation.id, pipeline, stages, updateLead, moveLead, onUpdateConversation]);

    // Ganho: move lead to "Ganho" stage + sync conversation.deal_status
    const handleWon = useCallback(async () => {
        const ganhoStage = stages.find(s => s.pipeline === pipeline && s.name === 'Ganho');
        if (!ganhoStage || !conversation.leadId) return;

        try {
            await moveLead(conversation.leadId, ganhoStage.id);
            await onUpdateConversation(conversation.id, {
                dealStatus: 'won' as DealStatus,
                status: 'closed',
                lossReason: undefined,
            });
        } catch (error) {
            console.error('Erro ao marcar como ganho:', error);
        }
    }, [conversation.id, conversation.leadId, stages, pipeline, moveLead, onUpdateConversation]);

    // Aberto: move lead back to first non-system stage + sync conversation.deal_status
    const handleOpen = useCallback(async () => {
        const firstStage = stages
            .filter(s => s.pipeline === pipeline && !['Ganho', 'Perdido'].includes(s.name))
            .sort((a, b) => a.order - b.order)[0];
        if (!firstStage || !conversation.leadId) return;

        try {
            await moveLead(conversation.leadId, firstStage.id);
            await onUpdateConversation(conversation.id, {
                dealStatus: 'open' as DealStatus,
                status: 'open',
                lossReason: undefined,
            });
        } catch (error) {
            console.error('Erro ao reabrir lead:', error);
        }
    }, [conversation.id, conversation.leadId, stages, pipeline, moveLead, onUpdateConversation]);

    return (
        <>
            {/* Selected Deal */}
            <div className={styles.dealSection}>
                <div className={styles.dealStage}>
                    <span className={styles.dealLabel}>Pipeline</span>
                    <Dropdown
                        options={pipelineOptions}
                        value={pipeline}
                        onChange={(val) => handlePipelineChange(val as string)}
                        placeholder="Pipeline"
                        noSound
                    />
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
                        className={`${styles.statusButton} ${styles.won} ${dealStatus === 'won' ? styles.active : ''}`}
                        onClick={handleWon}
                    >
                        Ganho
                    </button>
                    <button
                        className={`${styles.statusButton} ${styles.lost} ${dealStatus === 'lost' ? styles.active : ''}`}
                        onClick={onShowLossModal}
                    >
                        Perdido
                    </button>
                    <button
                        className={`${styles.statusButton} ${styles.open} ${(!dealStatus || dealStatus === 'open') ? styles.active : ''}`}
                        onClick={handleOpen}
                    >
                        Aberto
                    </button>
                </div>

                {/* CTA Criar Projeto — only when deal is won */}
                {dealStatus === 'won' && (
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
