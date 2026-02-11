
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
import { Modal, Tabs } from '@/design-system';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useContactsStore } from '../../stores/useContactsStore';
import { toast } from 'react-toastify';

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
    const { updateLead, moveLead } = useKanbanStore();
    const { fetchContacts } = useContactsStore();

    const handleLeadUpdated = () => {
        fetchContacts();
    };

    // Handler para mudar status (Ganho/Perdido)
    const handleStatusChange = async (status: 'won' | 'lost' | 'open', lossReasonId?: string) => {
        if (!lead) return;

        try {
            const prefix = lead.status?.startsWith('lt-') ? 'lt' : 'ht';

            if (status === 'won') {
                await moveLead(lead.id, `${prefix}-ganho`);
                await updateLead(lead.id, {
                    dealStatus: 'won',
                    dealClosedAt: new Date(),
                });
            } else if (status === 'lost') {
                await moveLead(lead.id, `${prefix}-perdido`);
                await updateLead(lead.id, {
                    dealStatus: 'lost',
                    lostReason: lossReasonId || '',
                    lostAt: new Date(),
                });
            }

            fetchContacts();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            toast.error('Erro ao atualizar status do lead');
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
                return <NegociosTab lead={lead} onLeadUpdated={handleLeadUpdated} />;
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
                <LeadHeader lead={lead} onStatusChange={handleStatusChange} onLeadUpdated={handleLeadUpdated} />

                <Tabs
                    value={activeTab}
                    onChange={(v) => setActiveTab(v as TabType)}
                    variant="underline"
                    size="sm"
                    fullWidth
                    items={tabs.map(tab => ({
                        value: tab.id,
                        label: tab.label,
                        icon: tab.icon,
                    }))}
                />

                <div className={styles.content}>
                    {renderTabContent()}
                </div>
            </div>
        </Modal>
    );
}
