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
const mockContacts = [
    {
        id: '1',
        name: 'Muriel S. Thiago Ledoux Rupp',
        email: 'ledouxrupp@gmail.com',
        phone: '5551993264044',
        company: 'Tech Solutions',
        pipeline: 'venda' as const,
        status: 'novo',
        order: 1,
        tags: ['Lcto Nov', 'engajado'],
        responsibleId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        dealsCount: 3,
    },
    {
        id: '2',
        name: 'Igor romer12323',
        email: 'akdopaks@gmail.com',
        phone: '5551123456789',
        company: '',
        pipeline: 'venda' as const,
        status: 'qualificado',
        order: 2,
        tags: ['Maio/24'],
        responsibleId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        dealsCount: 4,
    },
    {
        id: '3',
        name: 'Juliana Costa',
        email: '123456789@gmail.com',
        phone: '5511987654321',
        company: 'Marketing Pro',
        pipeline: 'venda' as const,
        status: 'novo',
        order: 3,
        tags: ['FRIO'],
        responsibleId: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
        dealsCount: 3,
    },
    {
        id: '4',
        name: 'Carlos Eduardo Silva',
        email: 'carlos.silva@empresa.com',
        phone: '5521999887766',
        company: 'Empresa ABC',
        pipeline: 'venda' as const,
        status: 'proposta',
        order: 4,
        tags: ['Lcto Nov', 'Quente'],
        responsibleId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        dealsCount: 2,
    },
    {
        id: '5',
        name: 'Ana Paula Mendes',
        email: 'ana.mendes@consultoria.com',
        phone: '5511988776655',
        company: 'Consultoria XYZ',
        pipeline: 'pos-venda' as const,
        status: 'ganho',
        order: 5,
        tags: ['engajado', 'Maio/24'],
        responsibleId: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
        dealsCount: 5,
    },
];

export const ContactsPage: React.FC = () => {
    const {
        setContacts,
        setAvailableTags,
        setAvailableLossReasons,
        isLoading,
        selectedIds,
    } = useContactsStore();

    const filteredContacts = useFilteredContacts();

    // Inicializa dados mock
    useEffect(() => {
        // Simula carregamento
        setContacts(mockContacts as any);

        // Tags disponíveis (extraídas dos contatos)
        const allTags = new Set<string>();
        mockContacts.forEach(c => c.tags.forEach(t => allTags.add(t)));
        setAvailableTags(Array.from(allTags));

        // Motivos de perda
        setAvailableLossReasons([
            { id: '1', name: 'Não informar', isActive: true },
            { id: '2', name: 'Sem dinheiro', isActive: true },
            { id: '3', name: 'Comprou produto concorrente', isActive: true },
            { id: '4', name: 'Blacklist', isActive: true },
            { id: '5', name: 'Sem visto', isActive: true },
        ]);
    }, [setContacts, setAvailableTags, setAvailableLossReasons]);

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
