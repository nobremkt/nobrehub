import React from 'react';
import { Conversation, DealStatus } from '../../types';
import { Dropdown } from '@/design-system';
import { Rocket, Edit2 } from 'lucide-react';
import styles from './ProfilePanel.module.css';

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
}) => (
    <>
        {/* Selected Deal */}
        <div className={styles.dealSection}>
            <div className={styles.dealPipeline}>
                <span className={styles.dealLabel}>Pipeline</span>
                <span className={styles.dealValue}>{conversation.pipeline === 'low-ticket' ? 'Vendas LT' : 'Vendas HT'}</span>
            </div>
            <div className={styles.dealStage}>
                <span className={styles.dealLabel}>Etapa</span>
                <Dropdown
                    options={[
                        { label: 'Prospecção', value: 'prospeccao' },
                        { label: 'Qualificação', value: 'qualificacao' },
                        { label: 'Apresentação', value: 'apresentacao' },
                        { label: 'Negociação', value: 'negociacao' },
                        { label: 'Fechamento', value: 'fechamento' },
                    ]}
                    value={conversation.stage || 'prospeccao'}
                    onChange={(val) => onUpdateConversation(conversation.id, { stage: val as string })}
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
        <div className={styles.fieldList}>
            <div className={styles.field}>
                <span className={styles.fieldLabel}>Origem</span>
                <span className={styles.fieldValue}>WhatsApp</span>
            </div>
            <div className={styles.field}>
                <span className={styles.fieldLabel}>Valor</span>
                <span className={styles.fieldValue}>R$ 0,00</span>
                <button className={styles.fieldEdit}><Edit2 size={14} /></button>
            </div>
            <div className={styles.field}>
                <span className={styles.fieldLabel}>Dono</span>
                <span className={styles.fieldValue}>
                    {assignedMemberName || 'Não atribuído'}
                </span>
                <button className={styles.fieldEdit}>
                    <Edit2 size={14} />
                </button>
            </div>
        </div>
    </>
);
