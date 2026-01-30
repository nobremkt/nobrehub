
import { useState } from 'react';
import { Activity, Copy } from 'lucide-react';
import styles from './AtividadeTab.module.css';
import { PIPELINE_STAGES, ACTIVITIES, SCRIPTS } from './data';

export function AtividadeTab() {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [completedActivities, setCompletedActivities] = useState(0);

    const currentActivityId = completedActivities + 1;
    const currentScript = SCRIPTS[currentActivityId] || SCRIPTS[1];

    const handleStageClick = (index: number) => {
        setCurrentStageIndex(index);
        const stageId = PIPELINE_STAGES[index].id;
        const firstActivityOfStage = ACTIVITIES.findIndex(a => a.stage === stageId);
        if (firstActivityOfStage !== -1) {
            setCompletedActivities(firstActivityOfStage);
        }
    };

    const handleActivityClick = (activityId: number) => {
        if (activityId <= completedActivities) {
            setCompletedActivities(activityId - 1);
        } else {
            setCompletedActivities(activityId);
        }

        const activity = ACTIVITIES.find(a => a.id === activityId);
        if (activity) {
            const stageIndex = PIPELINE_STAGES.findIndex(s => s.id === activity.stage);
            if (stageIndex !== -1) {
                setCurrentStageIndex(stageIndex);
            }
        }
    };

    // Calculate progress width - stops at the center of each stage dot
    const totalStages = PIPELINE_STAGES.length;
    const progressPercent = currentStageIndex === 0 ? 0 : (currentStageIndex / (totalStages - 1)) * 100;

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

                {PIPELINE_STAGES.map((stage, index) => (
                    <button
                        key={stage.id}
                        className={`${styles.pipelineStage} ${index <= currentStageIndex ? styles.pipelineStageActive : ''} ${index === currentStageIndex ? styles.pipelineStageCurrent : ''}`}
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
                    <h3 className={styles.sectionTitle}>
                        <Activity size={18} />
                        Próximas Atividades
                    </h3>
                    <div className={styles.activitiesList}>
                        {ACTIVITIES.map((activity) => {
                            const isCompleted = activity.id <= completedActivities;
                            const isCurrent = activity.id === completedActivities + 1;

                            return (
                                <button
                                    key={activity.id}
                                    className={`${styles.activityItem} ${isCompleted ? styles.activityCompleted : ''} ${isCurrent ? styles.activityCurrent : ''}`}
                                    onClick={() => handleActivityClick(activity.id)}
                                >
                                    <span className={styles.activityCheckbox}>
                                        {isCompleted && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </span>
                                    <span className={styles.activityLabel}>{activity.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Script */}
                <div className={styles.scriptSection}>
                    <div className={styles.scriptCard}>
                        <button className={styles.copyScriptBtn} title="Copiar Script">
                            <Copy size={14} />
                        </button>
                        <h4 className={styles.scriptTitle}>{currentScript.title}</h4>
                        <pre className={styles.scriptContent}>{currentScript.content}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
