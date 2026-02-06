
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LEAD 360° MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Modal premium para visualização completa de leads com abas.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { Lead } from '@/types/lead.types';
import styles from './Lead360Modal.module.css';
import {
    Activity,
    Briefcase,
    MessageSquare,
    History,
    User,
    Building2
} from 'lucide-react';
import { Modal } from '@/design-system';
import { useKanbanStore } from '../../stores/useKanbanStore';

import { LeadHeader } from './components/LeadHeader/LeadHeader';
import { AtividadeTab } from './tabs/AtividadeTab/AtividadeTab';
import { ContatoTab } from './tabs/ContatoTab/ContatoTab';
import { EmpresaTab } from './tabs/EmpresaTab/EmpresaTab';
import { NegociosTab } from './tabs/NegociosTab/NegociosTab';
import { ConversasTab } from './tabs/ConversasTab/ConversasTab';
import { HistoricoTab } from './tabs/HistoricoTab/HistoricoTab';

interface Lead360ModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onTemplateSelect?: (message: string) => void;
}

type TabType = 'ATIVIDADE' | 'CONTATO' | 'EMPRESA' | 'NEGÓCIOS' | 'CONVERSAS' | 'HISTÓRICO';

export function Lead360Modal({ isOpen, onClose, lead, onTemplateSelect }: Lead360ModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('ATIVIDADE');
    const { updateLead, moveLead, stages } = useKanbanStore();

    // Handler para mudar status (Ganho/Perdido)
    const handleStatusChange = async (status: 'won' | 'lost' | 'open') => {
        if (!lead) return;

        try {
            if (status === 'won') {
                // Encontra a etapa de "Fechado Ganho" para o pipeline do lead
                const currentPipeline = lead.status?.startsWith('lt-') ? 'low-ticket' : 'high-ticket';
                const wonStage = stages.find(s =>
                    s.pipeline === currentPipeline &&
                    (s.name.toLowerCase().includes('ganho') || s.name.toLowerCase().includes('fechado') || s.id.includes('fechado'))
                );

                if (wonStage) {
                    await moveLead(lead.id, wonStage.id);
                }
            } else if (status === 'lost') {
                // Para "Perdido", atualiza apenas o campo de metadata ou cria uma coluna específica
                // Por enquanto, marca no próprio lead
                await updateLead(lead.id, {
                    customFields: {
                        ...lead.customFields,
                        dealStatus: 'lost',
                        lostAt: new Date().toISOString()
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    // KeyDown handled by Modal

    if (!isOpen || !lead) return null;

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'ATIVIDADE', label: 'Playbook', icon: <Activity size={16} /> },
        { id: 'CONTATO', label: 'Contato', icon: <User size={16} /> },
        { id: 'EMPRESA', label: 'Empresa', icon: <Building2 size={16} /> },
        { id: 'NEGÓCIOS', label: 'Negócios', icon: <Briefcase size={16} /> },
        { id: 'CONVERSAS', label: 'Conversas', icon: <MessageSquare size={16} /> },
        { id: 'HISTÓRICO', label: 'Histórico', icon: <History size={16} /> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ATIVIDADE':
                return <AtividadeTab lead={lead} onClose={onClose} onTemplateSelect={onTemplateSelect} />;
            case 'CONTATO':
                return <ContatoTab lead={lead} />;
            case 'EMPRESA':
                return <EmpresaTab lead={lead} />;
            case 'NEGÓCIOS':
                return <NegociosTab lead={lead} />;
            case 'CONVERSAS':
                return <ConversasTab lead={lead} />;
            case 'HISTÓRICO':
                return <HistoricoTab lead={lead} />;
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Lead 360°"
            size="full"
        >
            <div className={styles.container}>
                <LeadHeader lead={lead} onStatusChange={handleStatusChange} />

                <nav className={styles.tabsNav}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className={styles.content}>
                    {renderTabContent()}
                </div>
            </div>
        </Modal>
    );
}
