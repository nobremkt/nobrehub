/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - SOCIAL MEDIA PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/design-system';
import { useSocialMediaStore } from '../stores/useSocialMediaStore';
import { SocialMediaClient } from '../types/socialMedia';
import { ClientTable } from '../components/ClientTable/ClientTable';
import { ClientFormModal } from '../components/ClientFormModal/ClientFormModal';
import styles from './SocialMediaPage.module.css';

export const SocialMediaPage = () => {
    const { init, cleanup, clients, isLoading } = useSocialMediaStore();
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<SocialMediaClient | null>(null);

    useEffect(() => {
        init();
        return () => cleanup();
    }, [init, cleanup]);

    const handleAddClient = () => {
        setEditingClient(null);
        setShowModal(true);
    };

    const handleEditClient = (client: SocialMediaClient) => {
        setEditingClient(client);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingClient(null);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1>Social Media</h1>
                    <p>Gerencie clientes e acompanhe entregas de postagens.</p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus size={16} />}
                    onClick={handleAddClient}
                >
                    Novo Cliente
                </Button>
            </div>

            {/* Client Table */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Users size={20} />
                    <h2>Clientes</h2>
                    <span className={styles.count}>{clients.length}</span>
                </div>
                <ClientTable
                    clients={clients}
                    isLoading={isLoading}
                    onEditClient={handleEditClient}
                />
            </section>

            {/* Client Form Modal */}
            {showModal && (
                <ClientFormModal
                    onClose={handleCloseModal}
                    editingClient={editingClient}
                />
            )}
        </div>
    );
};
