/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS PAGE
 * Página de Lista de Contatos seguindo análise do Clint CRM
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { ContactsTable } from '../components/Contacts/ContactsTable';
import { ContactsFilterBar } from '../components/Contacts/ContactsFilterBar';
import { useContactsStore, useFilteredContacts } from '../stores/useContactsStore';
import { Button } from '@/design-system';
import { Plus, Users, RefreshCw } from 'lucide-react';
import { CreateLeadModal } from '../components/CreateLeadModal/CreateLeadModal';
import styles from './ContactsPage.module.css';

// Mock data para desenvolvimento
export const ContactsPage: React.FC = () => {
    const {
        fetchContacts,
        syncContacts,
        setAvailableLossReasons,
        isLoading,
        selectedIds,
    } = useContactsStore();

    const filteredContacts = useFilteredContacts();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Carregar contatos reais
    useEffect(() => {
        fetchContacts();

        // Motivos de perda (TODO: buscar do backend se necessário)
        setAvailableLossReasons([
            { id: '1', name: 'Não informar', isActive: true },
            { id: '2', name: 'Sem dinheiro', isActive: true },
            { id: '3', name: 'Comprou produto concorrente', isActive: true },
            { id: '4', name: 'Blacklist', isActive: true },
            { id: '5', name: 'Sem visto', isActive: true },
        ]);
    }, [fetchContacts, setAvailableLossReasons]);

    const handleNewContact = () => {
        setIsCreateModalOpen(true);
    };

    const handleSync = async () => {
        const count = await syncContacts();
        if (count > 0) {
            alert(`${count} contatos importados do Inbox!`);
        } else {
            alert('Nenhum novo contato encontrado no Inbox.');
        }
    };

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

            {/* Barra de Filtros */}
            <ContactsFilterBar />

            {/* Contador e Seleção */}
            <div className={styles.tableHeader}>
                <div className={styles.selectionInfo}>
                    {selectedIds.size > 0 ? (
                        <span>{selectedIds.size} selecionado(s)</span>
                    ) : (
                        <span>{filteredContacts.length.toLocaleString('pt-BR')} contatos</span>
                    )}
                </div>
            </div>

            {/* Tabela */}
            <ContactsTable
                contacts={filteredContacts}
                isLoading={isLoading}
            />

            <CreateLeadModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchContacts()}
            />
        </div>
    );
};
export default ContactsPage;
