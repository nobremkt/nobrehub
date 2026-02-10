/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS PAGE
 * Página de Lista de Contatos seguindo análise do Clint CRM
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { ContactsTable } from '../components/Contacts/ContactsTable';
import { ContactsFilterBar } from '../components/Contacts/ContactsFilterBar';
import { ContactsQuickActions } from '../components/Contacts/ContactsQuickActions';
import { useContactsStore, useFilteredContacts } from '../stores/useContactsStore';
import { useLossReasonStore } from '@/features/settings/stores/useLossReasonStore';
import { Button } from '@/design-system';
import { Plus, Users, RefreshCw } from 'lucide-react';
import { CreateLeadModal } from '../components/CreateLeadModal/CreateLeadModal';
import { Lead360Modal } from '../components/Lead360Modal/Lead360Modal';
import { Lead } from '@/types/lead.types';
import styles from './ContactsPage.module.css';

export const ContactsPage: React.FC = () => {
    const {
        fetchContacts,
        syncContacts,
        setAvailableLossReasons,
        isLoading,
        selectedIds,
        clearSelection,
    } = useContactsStore();

    const { lossReasons, fetchLossReasons } = useLossReasonStore();
    const filteredContacts = useFilteredContacts();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    // Carregar contatos reais
    useEffect(() => {
        fetchContacts();
        fetchLossReasons();
    }, [fetchContacts, fetchLossReasons]);

    // Sync loss reasons from store to contacts store
    useEffect(() => {
        if (lossReasons.length > 0) {
            const mappedReasons = lossReasons
                .filter(r => r.active)
                .map(r => ({ id: r.id, name: r.name, isActive: r.active }));
            setAvailableLossReasons(mappedReasons);
        }
    }, [lossReasons, setAvailableLossReasons]);

    const handleNewContact = () => {
        setIsCreateModalOpen(true);
    };

    const handleContactClick = (contact: any) => {
        // O contact aqui é um Lead completo em runtime
        setSelectedLead(contact as Lead);
    };

    const selectedFilteredCount = filteredContacts.filter(contact => selectedIds.has(contact.id)).length;

    const handleSync = async () => {
        const count = await syncContacts();
        if (count > 0) {
            alert(`${count} contatos importados do Inbox!`);
        } else {
            alert('Nenhum novo contato encontrado no Inbox.');
        }
    };

    const hasSelection = selectedIds.size > 0;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <Users size={24} />
                    <h1 className={styles.title}>Contatos</h1>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        variant="secondary"
                        leftIcon={<RefreshCw size={18} />}
                        onClick={handleSync}
                        isLoading={isLoading}
                    >
                        Sincronizar Inbox
                    </Button>
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={handleNewContact}
                    >
                        Novo contato
                    </Button>
                </div>
            </div>

            {/* Barra de Filtros OU Quick Actions */}
            {hasSelection ? (
                <ContactsQuickActions
                    selectedCount={selectedIds.size}
                    onClearSelection={clearSelection}
                />
            ) : (
                <ContactsFilterBar />
            )}

            {/* Contador e Seleção */}
            <div className={styles.tableHeader}>
                <div className={styles.selectionInfo}>
                    {selectedIds.size > 0 ? (
                        <span>{selectedFilteredCount} selecionado(s) na visualização atual</span>
                    ) : (
                        <span>{filteredContacts.length.toLocaleString('pt-BR')} contatos</span>
                    )}
                </div>
            </div>

            {/* Tabela */}
            <ContactsTable
                contacts={filteredContacts}
                isLoading={isLoading}
                onContactClick={handleContactClick}
            />

            <CreateLeadModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchContacts()}
            />

            <Lead360Modal
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                lead={selectedLead}
            />
        </div>
    );
};
export default ContactsPage;
