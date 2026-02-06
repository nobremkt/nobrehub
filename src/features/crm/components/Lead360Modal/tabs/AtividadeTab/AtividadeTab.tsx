
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Copy, Send } from 'lucide-react';
import { Checkbox } from '@/design-system';
import styles from './AtividadeTab.module.css';
import { PIPELINE_STAGES, ACTIVITIES, SCRIPTS } from './data';
import { toast } from 'react-toastify';
import { Lead } from '@/types/lead.types';
import { LeadService } from '@/features/crm/services/LeadService';
import { useInboxStore } from '@/features/inbox/stores/useInboxStore';

interface AtividadeTabProps {
    lead: Lead;
    onClose: () => void;
    onTemplateSelect?: (message: string) => void;
}

// Helper to get stage number from stage id
const getStageNumber = (stageId: string) => {
    const index = PIPELINE_STAGES.findIndex(s => s.id === stageId);
    return index !== -1 ? index + 1 : null;
};

// Helper to highlight variables in script content
const highlightVariables = (content: string) => {
    // Match patterns like [NOME], [EMPRESA], [BENEFÍCIO], etc.
    const regex = /\[([A-ZÁÉÍÓÚÂÊÔÀÃÕÇ\/\s]+)\]/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
        // Odd indices are matches (variable names)
        if (index % 2 === 1) {
            return (
                <span key={index} className={styles.variable}>
                    {'{'}{part}{'}'}
                </span>
            );
        }
        return part;
    });
};


export function AtividadeTab({ lead, onClose, onTemplateSelect }: AtividadeTabProps) {
    const navigate = useNavigate();
    const { conversations, selectConversation, init, setDraftMessage } = useInboxStore();

    // Carregar progresso do lead.customFields ou iniciar em 0
    const initialProgress = (lead.customFields?.playbookProgress as number) || 0;
    const [completedActivities, setCompletedActivities] = useState(initialProgress);
    // Estado para controlar qual atividade está selecionada para visualização (script)
    const [selectedActivityId, setSelectedActivityId] = useState<number>(initialProgress + 1 || 1);

    // O script exibido baseia-se na atividade explicitamente selecionada OU na próxima atividade lógica
    const activeId = selectedActivityId || (completedActivities + 1);
    const currentScript = SCRIPTS[activeId] || SCRIPTS[1];

    // LÓGICA DE PROGRESSO VISUAL (Timeline)
    // O estágio ativo na timeline deve ser baseado na PRÓXIMA atividade a fazer (completedActivities + 1)
    const nextActivityId = completedActivities + 1;
    const nextActivity = ACTIVITIES.find(a => a.id === nextActivityId);

    // Se não houver próxima (tudo completo), o progresso vai até o fim.
    const currentRealStageId = nextActivity ? nextActivity.stage : PIPELINE_STAGES[PIPELINE_STAGES.length - 1].id;
    const currentRealStageIndex = PIPELINE_STAGES.findIndex(s => s.id === currentRealStageId);

    // Se tudo estiver concluído, podemos querer mostrar tudo cheio ou manter no último estágio
    const displayStageIndex = currentRealStageIndex !== -1 ? currentRealStageIndex : (PIPELINE_STAGES.length - 1);

    const handleStageClick = (index: number) => {
        // Clicar no estágio foca a primeira atividade daquele estágio para leitura, sem alterar progresso
        const stageId = PIPELINE_STAGES[index].id;
        const firstActivityOfStage = ACTIVITIES.findIndex(a => a.stage === stageId);
        if (firstActivityOfStage !== -1) {
            setSelectedActivityId(ACTIVITIES[firstActivityOfStage].id);
        }
    };

    const toggleCompletion = useCallback(async (activityId: number) => {
        // Usar o estado atual, não closure stale
        setCompletedActivities(prev => {
            const newProgress = activityId <= prev ? activityId - 1 : activityId;

            // Persist to Firebase (fire and forget para evitar problema de closure)
            LeadService.updateLead(lead.id, {
                customFields: {
                    ...lead.customFields,
                    playbookProgress: newProgress,
                }
            }).catch(error => {
                console.error('Erro ao salvar progresso:', error);
                toast.error('Erro ao salvar progresso');
            });

            return newProgress;
        });

        setSelectedActivityId(activityId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lead.id]);

    const selectActivity = (activityId: number) => {
        setSelectedActivityId(activityId);
        // Não altera mais o progresso visual (timeline)
    };

    // Calculate progress width based on displayStageIndex (Completed Activities)
    const totalStages = PIPELINE_STAGES.length;
    const progressPercent = displayStageIndex === 0 ? 0 : (displayStageIndex / (totalStages - 1)) * 100;

    return (
        <div className={styles.tabContent}>
            {/* Pipeline Timeline */}
            <div className={styles.pipelineTimeline}>
                {/* Track Line & Progress */}
                <div className={styles.pipelineTrack}>
                    <div
                        className={styles.pipelineProgress}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Usando displayStageIndex para classes ativas */}
                {PIPELINE_STAGES.map((stage, index) => (
                    <button
                        key={stage.id}
                        className={`${styles.pipelineStage} ${index <= displayStageIndex ? styles.pipelineStageActive : ''} ${index === displayStageIndex ? styles.pipelineStageCurrent : ''}`}
                        onClick={() => handleStageClick(index)}
                    >
                        <span className={styles.pipelineDot}>{index + 1}</span>
                        <span className={styles.pipelineLabel}>{stage.label}</span>
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
                            {ACTIVITIES.map((activity) => {
                                const isCompleted = activity.id <= completedActivities;
                                // isCurrent agora reflete a atividade SELECIONADA (focada), não necessariamente a próxima a fazer
                                const isSelected = activity.id === activeId;

                                // Verifica se é a próxima a ser feita para dar destaque visual diferenciado se necessário
                                // (Opcional, mas mantém a lógica visual de 'current' do CSS original se quisermos usar isSelected ali)
                                const stageNumber = getStageNumber(activity.stage);

                                return (
                                    <div
                                        key={activity.id}
                                        className={`${styles.activityItem} ${isCompleted ? styles.activityCompleted : ''} ${isSelected ? styles.activityCurrent : ''}`}
                                        onClick={() => selectActivity(activity.id)}
                                    >
                                        {/* StopPropagation no checkbox para não disparar o selectActivity (embora não faria mal selecionar ao marcar) */}
                                        <div onClick={(e) => e.stopPropagation()} className={styles.checkboxContainer}>
                                            <Checkbox
                                                checked={isCompleted}
                                                onChange={() => toggleCompletion(activity.id)}
                                                noSound={false}
                                            />
                                        </div>
                                        <span className={styles.stageBadge}>
                                            {stageNumber}
                                        </span>
                                        <span className={styles.activityLabel}>{activity.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={styles.scriptSection}>
                    <div className={styles.scriptCard}>
                        <button
                            className={styles.copyScriptBtn}
                            title="Copiar Script"
                            onClick={() => {
                                const message = currentScript.content
                                    .replace(/\[NOME\]/g, lead.name || '[NOME]')
                                    .replace(/\[EMPRESA\]/g, lead.company || '[EMPRESA]');
                                navigator.clipboard.writeText(message);
                                toast.success('Script copiado!');
                            }}
                        >
                            <Copy size={14} />
                        </button>
                        <h4 className={styles.scriptTitle}>
                            <span className={styles.scriptNumber}>{activeId}. </span>
                            {currentScript.title}
                        </h4>
                        <div className={styles.scriptContent}>{highlightVariables(currentScript.content)}</div>

                        {/* Botão Enviar Template */}
                        <button
                            className={styles.sendTemplateBtn}
                            onClick={() => {
                                // Preparar mensagem com variáveis substituídas
                                const message = currentScript.content
                                    .replace(/\[NOME\]/g, lead.name || '[NOME]')
                                    .replace(/\[EMPRESA\]/g, lead.company || '[EMPRESA]');

                                // Se tem callback customizado (pós-venda), usar ele e sair
                                if (onTemplateSelect) {
                                    onTemplateSelect(message);
                                    onClose();
                                    return;
                                }

                                // Fluxo padrão: validar telefone e navegar para Inbox
                                const phone = lead.phone?.replace(/\D/g, '');
                                if (!phone) {
                                    toast.error('Lead não possui telefone cadastrado');
                                    return;
                                }

                                // Inicializar store se necessário
                                if (conversations.length === 0) {
                                    init();
                                }

                                // Buscar conversa existente do lead
                                const existingConversation = conversations.find(c =>
                                    c.leadPhone?.replace(/\D/g, '') === phone && c.channel === 'whatsapp'
                                );

                                if (existingConversation) {
                                    selectConversation(existingConversation.id);
                                }

                                // Setar mensagem no input do chat (via store)
                                setDraftMessage(message);

                                // Fechar Modal360
                                onClose();

                                // Navegar para Inbox
                                navigate('/inbox');
                            }}
                        >
                            <Send size={16} />
                            Enviar Template ao Cliente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
