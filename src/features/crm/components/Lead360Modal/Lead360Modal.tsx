
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LEAD 360° MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Modal premium para visualização completa de leads com abas.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Lead } from '@/types/lead.types';
import styles from './Lead360Modal.module.css';
import {
    Activity,
    Info,
    Briefcase,
    MessageSquare,
    History,
    X,
} from 'lucide-react';

import { LeadHeader } from './components/LeadHeader/LeadHeader';
import { AtividadeTab } from './tabs/AtividadeTab/AtividadeTab';
import { InformacoesTab } from './tabs/InformacoesTab/InformacoesTab';
import { NegociosTab } from './tabs/NegociosTab/NegociosTab';
import { ConversasTab } from './tabs/ConversasTab/ConversasTab';
import { HistoricoTab } from './tabs/HistoricoTab/HistoricoTab';

interface Lead360ModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
}

type TabType = 'ATIVIDADE' | 'INFORMAÇÕES' | 'NEGÓCIOS' | 'CONVERSAS' | 'HISTÓRICO';

export function Lead360Modal({ isOpen, onClose, lead }: Lead360ModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('ATIVIDADE');

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen || !lead) return null;

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'ATIVIDADE', label: 'Atividade', icon: <Activity size={16} /> },
        { id: 'INFORMAÇÕES', label: 'Informações', icon: <Info size={16} /> },
        { id: 'NEGÓCIOS', label: 'Negócios', icon: <Briefcase size={16} /> },
        { id: 'CONVERSAS', label: 'Conversas', icon: <MessageSquare size={16} /> },
        { id: 'HISTÓRICO', label: 'Histórico', icon: <History size={16} /> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ATIVIDADE':
                return <AtividadeTab />;
            case 'INFORMAÇÕES':
                return <InformacoesTab lead={lead} />;
            case 'NEGÓCIOS':
                return <NegociosTab lead={lead} />;
            case 'CONVERSAS':
                return <ConversasTab />;
            case 'HISTÓRICO':
                return <HistoricoTab lead={lead} />;
            default:
                return null;
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className={styles.overlay}
            onClick={handleOverlayClick}
            aria-modal="true"
            role="dialog"
        >
            <div className={styles.modal}>
                {/* Close Button */}
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    <X size={20} />
                </button>

                <LeadHeader lead={lead} />

                {/* Tabs Navigation */}
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

                {/* Content */}
                <div className={styles.content}>
                    {renderTabContent()}
                </div>
            </div>
        </div>,
        document.body
    );
}
