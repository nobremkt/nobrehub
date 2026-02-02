/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CONTACTS PAGE
 * Página de Lista de Contatos seguindo análise do Clint CRM
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect } from 'react';
import { ContactsTable } from '../components/Contacts/ContactsTable';
import { ContactsFilterBar } from '../components/Contacts/ContactsFilterBar';
import { useContactsStore, useFilteredContacts } from '../stores/useContactsStore';
import { Button } from '@/design-system';
import { Plus, Users } from 'lucide-react';
import styles from './ContactsPage.module.css';

// Mock data para desenvolvimento
export const ContactsPage: React.FC = () => {
    const {
        fetchContacts,
        setAvailableLossReasons,
        isLoading,
        selectedIds,
    } = useContactsStore();

    const filteredContacts = useFilteredContacts();

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
        // TODO: Abrir modal de novo contato
        console.log('Novo contato');
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <Users size={24} />
                    <h1 className={styles.title}>Contatos</h1>
                </div>

                <Button
                    variant="primary"
                    leftIcon={<Plus size={18} />}
                    onClick={handleNewContact}
                >
                    Novo contato
                </Button>
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
        </div>
    );
};

export default ContactsPage;
