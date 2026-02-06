/**
 * Client Form Modal Component
 */

import { useState } from 'react';
import { Modal, Input, Button, Dropdown } from '@/design-system';
import { useSocialMediaStore } from '../../stores/useSocialMediaStore';
import { PlanType, SocialMediaClient, SocialMediaClientFormData } from '../../types/socialMedia';
import styles from './ClientFormModal.module.css';

interface ClientFormModalProps {
    onClose: () => void;
    editingClient?: SocialMediaClient | null;
}

const PLAN_OPTIONS = [
    { value: 'expansao', label: 'Expansão' },
    { value: 'presenca', label: 'Presença' },
    { value: 'outro', label: 'Outro' },
];

const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

export const ClientFormModal = ({ onClose, editingClient }: ClientFormModalProps) => {
    const { createClient, updateClient } = useSocialMediaStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!editingClient;

    const [formData, setFormData] = useState({
        clientName: editingClient?.clientName || '',
        contact: editingClient?.contact || '',
        companyName: editingClient?.companyName || '',
        instagramUsername: editingClient?.instagramUsername || '',
        instagramUrl: editingClient?.instagramUrl || '',
        planDuration: editingClient?.planDuration || 1,
        planType: (editingClient?.planType || 'expansao') as PlanType,
        postStartDate: formatDateForInput(editingClient?.postStartDate),
        contractEndDate: formatDateForInput(editingClient?.contractEndDate),
        value: editingClient?.value?.toString() || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientName || !formData.postStartDate) return;

        setIsSubmitting(true);
        try {
            const data: SocialMediaClientFormData = {
                clientName: formData.clientName,
                contact: formData.contact,
                companyName: formData.companyName,
                instagramUsername: formData.instagramUsername || undefined,
                instagramUrl: formData.instagramUrl || undefined,
                planDuration: formData.planDuration,
                planType: formData.planType,
                postStartDate: new Date(formData.postStartDate),
                contractEndDate: formData.contractEndDate ? new Date(formData.contractEndDate) : null,
                value: formData.value ? parseFloat(formData.value) : null,
            };

            if (isEditing && editingClient) {
                await updateClient(editingClient.id, data);
            } else {
                await createClient(data);
            }
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
            size="md"
        >
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                    <Input
                        label="Nome do Cliente *"
                        placeholder="Ex: Paulo"
                        value={formData.clientName}
                        onChange={(e) => setFormData(f => ({ ...f, clientName: e.target.value }))}
                        required
                    />
                    <Input
                        label="Contato"
                        placeholder="Ex: 14 99765-5085"
                        value={formData.contact}
                        onChange={(e) => setFormData(f => ({ ...f, contact: e.target.value }))}
                    />
                </div>

                <Input
                    label="Empresa"
                    placeholder="Ex: Pousada Beira Lago"
                    value={formData.companyName}
                    onChange={(e) => setFormData(f => ({ ...f, companyName: e.target.value }))}
                />

                <Input
                    label="Instagram (@)"
                    placeholder="Ex: @pousadabeiralago"
                    value={formData.instagramUsername}
                    onChange={(e) => setFormData(f => ({ ...f, instagramUsername: e.target.value }))}
                />

                <Input
                    label="Instagram URL"
                    placeholder="Ex: https://instagram.com/pousadabeiralago"
                    value={formData.instagramUrl}
                    onChange={(e) => setFormData(f => ({ ...f, instagramUrl: e.target.value }))}
                />

                <div className={styles.row}>
                    <Input
                        label="Prazo (meses)"
                        type="number"
                        placeholder="Ex: 3"
                        value={formData.planDuration.toString()}
                        onChange={(e) => setFormData(f => ({ ...f, planDuration: parseInt(e.target.value) || 1 }))}
                        min={1}
                    />
                    <Dropdown
                        label="Plano"
                        options={PLAN_OPTIONS}
                        value={formData.planType}
                        onChange={(val) => setFormData(f => ({ ...f, planType: val as PlanType }))}
                    />
                </div>

                <div className={styles.row}>
                    <Input
                        label="Início das Postagens *"
                        type="date"
                        value={formData.postStartDate}
                        onChange={(e) => setFormData(f => ({ ...f, postStartDate: e.target.value }))}
                        required
                    />
                    <Input
                        label="Vencimento do Contrato"
                        type="date"
                        value={formData.contractEndDate}
                        onChange={(e) => setFormData(f => ({ ...f, contractEndDate: e.target.value }))}
                    />
                </div>

                <Input
                    label="Valor"
                    type="number"
                    placeholder="Ex: 1500"
                    value={formData.value}
                    onChange={(e) => setFormData(f => ({ ...f, value: e.target.value }))}
                />

                <div className={styles.actions}>
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting || !formData.clientName || !formData.postStartDate}
                    >
                        {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
