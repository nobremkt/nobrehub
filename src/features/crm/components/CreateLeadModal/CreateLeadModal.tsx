import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button, Input, PhoneInput, Modal, Dropdown } from '@/design-system';
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
        pipeline: 'venda',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await addLead({
                name: formData.name,
                phone: formData.phone,
                email: formData.email || undefined,
                company: formData.company || undefined,
                pipeline: formData.pipeline,
                status: formData.pipeline === 'venda' ? 'ht-novo' : 'lt-entrada',
                tags: ['Novo'],
                order: 0,
                estimatedValue: 0,
                responsibleId: 'admin',
            } as any);

            setFormData({ name: '', phone: '', email: '', company: '', pipeline: 'venda' });
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to create lead:', error);
            alert('Erro ao criar lead. Verifique os dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const pipelineOptions = [
        { value: 'venda', label: 'High Ticket' },
        { value: 'pos-venda', label: 'Low Ticket' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Novo Lead"
        >
            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    label="Nome *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do cliente"
                    required
                />

                <PhoneInput
                    label="Telefone"
                    value={formData.phone}
                    onChange={(val) => setFormData({ ...formData, phone: val })}
                    placeholder="(00) 00000-0000"
                    required
                />

                <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                />

                <Dropdown
                    label="Pipeline"
                    options={pipelineOptions}
                    value={formData.pipeline}
                    onChange={(val) => setFormData({ ...formData, pipeline: String(val) })}
                />

                <Input
                    label="Empresa"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nome da empresa"
                />

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
        </Modal>
    );
}
