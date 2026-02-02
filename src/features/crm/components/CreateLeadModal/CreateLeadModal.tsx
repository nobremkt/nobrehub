import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { Button, Input } from '@/design-system';
import { useKanbanStore } from '../../stores/useKanbanStore';
import styles from './CreateLeadModal.module.css';

interface CreateLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
    const { addLead } = useKanbanStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        company: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await addLead({
                name: formData.name,
                phone: formData.phone,
                email: formData.email || undefined,
                company: formData.company || undefined,
                pipeline: 'venda',
                status: 'ht-novo',
                tags: ['Novo'],
                order: 0,
                estimatedValue: 0,
                responsibleId: 'admin',
                // Timestamps are handled by the service
            } as any);

            setFormData({ name: '', phone: '', email: '', company: '' });
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to create lead:', error);
            alert('Erro ao criar lead. Verifique os dados.');
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Novo Lead</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Nome *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nome do cliente"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Telefone *</label>
                        <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(00) 00000-0000"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Empresa</label>
                        <Input
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Nome da empresa"
                        />
                    </div>

                    <div className={styles.actions}>
                        <Button variant="ghost" onClick={onClose} type="button">
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isLoading}
                            leftIcon={<Save size={18} />}
                        >
                            Salvar Lead
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
