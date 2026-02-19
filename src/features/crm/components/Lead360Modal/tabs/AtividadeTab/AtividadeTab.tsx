
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Checkbox, Spinner } from '@/design-system';
import styles from './AtividadeTab.module.css';
import { toast } from 'react-toastify';
import { Lead } from '@/types/lead.types';
import { useInboxStore } from '@/features/inbox/stores/useInboxStore';
import { useKanbanStore } from '@/features/crm/stores/useKanbanStore';
import { usePlaybookStore } from '@/features/crm/stores/usePlaybookStore';
import { ACTIVITY_TYPE_META } from '@/features/crm/types/playbook.types';
import type { PlaybookBlock } from '@/features/crm/types/playbook.types';
import {
    MessageBlock,
    ChecklistBlock,
    TipBlock,
    QuestionBlock,
} from './PlaybookBlocks';

interface AtividadeTabProps {
    lead: Lead;
    onClose: () => void;
    onTemplateSelect?: (message: string) => void;
}

export function AtividadeTab({ lead, onClose, onTemplateSelect }: AtividadeTabProps) {
    const navigate = useNavigate();
    const { conversations, messages: inboxMessages, selectedConversationId, selectConversation, setDraftMessage } = useInboxStore();
    const getStagesByPipeline = useKanbanStore(s => s.getStagesByPipeline);
    const allKanbanStages = useKanbanStore(s => s.stages);

    const {
        activities,
        progress,
        loading,
        selectedActivityId,
        loadPlaybook,
        selectActivity,
        toggleActivity,
        updateScriptChecks,
    } = usePlaybookStore();

    // Derive pipeline from the lead's stage (lead.status holds stage_id)
    const pipeline = (() => {
        if (lead.status) {
            const stage = allKanbanStages.find(s => s.id === lead.status);
            if (stage) return stage.pipeline;
        }
        return lead.pipeline || 'high-ticket';
    })();

    // Load playbook data on mount
    useEffect(() => {
        loadPlaybook(lead.id, pipeline);
    }, [lead.id, pipeline, loadPlaybook]);

    // ─── Computed ────────────────────────────────────────────────────
    const completedSet = new Set(progress?.completedActivities ?? []);
    const selectedActivity = activities.find(a => a.id === selectedActivityId);

    // Timeline stages (from KanbanStore, excluding Ganho/Perdido)
    const allStages = getStagesByPipeline(pipeline as 'high-ticket' | 'low-ticket');
    const timelineStages = allStages.filter(s =>
        s.name !== 'Ganho' && s.name !== 'Perdido'
    );

    // Progress calculation: which stage is the lead currently progressing through?
    const getStageProgress = () => {
        if (activities.length === 0 || timelineStages.length === 0) return 0;

        // Find first incomplete activity
        const firstIncomplete = activities.find(a => !completedSet.has(a.id));
        if (!firstIncomplete) return timelineStages.length - 1; // All done

        // Find which stage this activity belongs to
        const stageIndex = timelineStages.findIndex(s => s.id === firstIncomplete.stageId);
        return Math.max(0, stageIndex);
    };

    const displayStageIndex = getStageProgress();
    const progressPercent = timelineStages.length <= 1
        ? 0
        : (displayStageIndex / (timelineStages.length - 1)) * 100;

    // ─── Handlers ───────────────────────────────────────────────────

    const handleStageClick = (stageId: string) => {
        const firstActivityOfStage = activities.find(a => a.stageId === stageId);
        if (firstActivityOfStage) {
            selectActivity(firstActivityOfStage.id);
        }
    };

    const handleToggleActivity = useCallback(async (activityId: string) => {
        await toggleActivity(lead.id, activityId, pipeline);
    }, [lead.id, pipeline, toggleActivity]);

    const handleChecklistToggle = useCallback(async (activityId: string, blockContent: string, index: number) => {
        let items: string[];
        try {
            items = JSON.parse(blockContent);
        } catch {
            items = blockContent.split('\n').filter(Boolean);
        }

        const currentChecks = progress?.scriptChecks?.[activityId] ?? new Array(items.length).fill(false);
        const newChecks = [...currentChecks];
        newChecks[index] = !newChecks[index];
        await updateScriptChecks(lead.id, activityId, newChecks, pipeline);
    }, [lead.id, pipeline, progress?.scriptChecks, updateScriptChecks]);

    const handleCopy = useCallback((text: string) => {
        const message = text
            .replace(/\{NOME\}/g, lead.name || '{NOME}')
            .replace(/\{EMPRESA\}/g, lead.company || '{EMPRESA}');
        navigator.clipboard.writeText(message);
        toast.success('Texto copiado!');
    }, [lead.name, lead.company]);

    const handleSendToChat = useCallback((text: string) => {
        const message = text
            .replace(/\{NOME\}/g, lead.name || '{NOME}')
            .replace(/\{EMPRESA\}/g, lead.company || '{EMPRESA}');

        if (onTemplateSelect) {
            onTemplateSelect(message);
            onClose();
            return;
        }

        const normalizePhone = (value?: string) => value?.replace(/\D/g, '') || '';
        const phone = normalizePhone(lead.phone);

        const selectedConversation = selectedConversationId
            ? conversations.find(c => c.id === selectedConversationId)
            : null;

        const existingConversation =
            conversations.find(c => lead.id && c.leadId === lead.id) ||
            (phone
                ? conversations.find(c => normalizePhone(c.leadPhone) === phone && c.channel === 'whatsapp')
                : null) ||
            selectedConversation ||
            null;

        if (!existingConversation && !phone && !lead.id) {
            toast.error('Lead sem telefone e sem conversa vinculada');
            return;
        }

        // Check if WhatsApp 24h window is expired before sending free-text
        if (existingConversation?.channel === 'whatsapp') {
            const convMessages = inboxMessages[existingConversation.id] || [];
            const inboundMsgs = convMessages.filter(m => m.direction === 'in');
            const lastInbound = inboundMsgs.length > 0
                ? new Date(inboundMsgs[inboundMsgs.length - 1].createdAt)
                : null;
            const hoursSince = lastInbound
                ? (Date.now() - lastInbound.getTime()) / (1000 * 60 * 60)
                : Infinity;

            if (hoursSince >= 24) {
                toast.warning('Janela de 24h expirada — envie um template para reabrir a conversa');
                return;
            }
        }

        setDraftMessage(message);
        onClose();

        if (existingConversation) {
            selectConversation(existingConversation.id);
            navigate(`/inbox/${existingConversation.id}`);
            return;
        }

        // No existing conversation — navigate to inbox (InboxService will handle new conversation creation)
        navigate('/inbox');
    }, [lead, onClose, onTemplateSelect, conversations, inboxMessages, selectedConversationId, selectConversation, setDraftMessage, navigate]);

    // ─── Block Renderer ─────────────────────────────────────────────

    const renderBlock = (block: PlaybookBlock) => {
        const activityId = block.activityId;

        switch (block.blockType) {
            case 'message':
                return (
                    <MessageBlock
                        key={block.id}
                        block={block}
                        onCopy={handleCopy}
                        onSendToChat={handleSendToChat}
                    />
                );
            case 'checklist': {
                let items: string[];
                try {
                    items = JSON.parse(block.content);
                } catch {
                    items = block.content.split('\n').filter(Boolean);
                }
                const checks = progress?.scriptChecks?.[activityId] ?? new Array(items.length).fill(false);
                return (
                    <ChecklistBlock
                        key={block.id}
                        block={block}
                        checks={checks}
                        onToggle={(index) => handleChecklistToggle(activityId, block.content, index)}
                    />
                );
            }
            case 'tip':
                return <TipBlock key={block.id} block={block} />;
            case 'question':
                return <QuestionBlock key={block.id} block={block} />;
            default:
                return null;
        }
    };

    // ─── Loading State ──────────────────────────────────────────────

    if (loading) {
        return (
            <div className={styles.tabContent} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    // ─── Render ──────────────────────────────────────────────────────

    return (
        <div className={styles.tabContent}>
            {/* Pipeline Timeline */}
            <div className={styles.pipelineTimeline}>
                <div className={styles.pipelineTrack}>
                    <div
                        className={styles.pipelineProgress}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {timelineStages.map((stage, index) => (
                    <button
                        key={stage.id}
                        className={`${styles.pipelineStage} ${index <= displayStageIndex ? styles.pipelineStageActive : ''} ${index === displayStageIndex ? styles.pipelineStageCurrent : ''}`}
                        onClick={() => handleStageClick(stage.id)}
                    >
                        <span className={styles.pipelineDot}>{index + 1}</span>
                        <span className={styles.pipelineLabel}>{stage.name}</span>
                    </button>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className={styles.activityColumns}>
                {/* Left Column: Activities Checklist */}
                <div className={styles.activitiesSection}>
                    <div className={styles.activitiesList}>
                        <h3 className={styles.sectionTitle}>
                            <Activity size={18} />
                            Próximas Atividades
                        </h3>
                        <div className={styles.activitiesListInner}>
                            {activities.map((activity, activityIndex) => {
                                const isCompleted = completedSet.has(activity.id);
                                const isSelected = activity.id === selectedActivityId;
                                const typeMeta = ACTIVITY_TYPE_META[activity.activityType];

                                return (
                                    <div
                                        key={activity.id}
                                        className={`${styles.activityItem} ${isCompleted ? styles.activityCompleted : ''} ${isSelected ? styles.activityCurrent : ''}`}
                                        onClick={() => selectActivity(activity.id)}
                                    >
                                        <span className={styles.stageBadge}>
                                            {activityIndex + 1}
                                        </span>
                                        <div onClick={(e) => e.stopPropagation()} className={styles.checkboxContainer}>
                                            <Checkbox
                                                checked={isCompleted}
                                                onChange={() => handleToggleActivity(activity.id)}
                                                noSound={false}
                                            />
                                        </div>
                                        <span
                                            className={styles.activityTypeIcon}
                                            title={typeMeta.label}
                                            style={{ color: typeMeta.color }}
                                        >
                                            {typeMeta.icon}
                                        </span>
                                        <span className={styles.activityLabel}>{activity.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Script Panel with Blocks */}
                <div className={styles.scriptSection}>
                    {selectedActivity ? (
                        <div className={styles.scriptCard}>
                            <h4 className={styles.scriptTitle}>
                                <span
                                    className={styles.activityTypeIcon}
                                    style={{ color: ACTIVITY_TYPE_META[selectedActivity.activityType].color }}
                                >
                                    {ACTIVITY_TYPE_META[selectedActivity.activityType].icon}
                                </span>
                                {selectedActivity.label}
                            </h4>

                            {/* Render blocks */}
                            <div className={styles.scriptContent}>
                                {selectedActivity.blocks.map(renderBlock)}
                            </div>

                            {/* Internal instruction hint (if no message blocks) */}
                            {!selectedActivity.blocks.some(b => b.blockType === 'message') && (
                                <div className={styles.internalInstructionHint}>
                                    Esta atividade é uma instrução interna do playbook e não envia mensagem ao lead.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.scriptCard}>
                            <div className={styles.internalInstructionHint}>
                                Selecione uma atividade para ver o conteúdo.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
