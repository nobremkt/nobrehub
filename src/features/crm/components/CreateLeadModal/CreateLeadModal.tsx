import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Save } from 'lucide-react';
import { Button, Input, PhoneInput, Modal, Dropdown, Tag } from '@/design-system';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useAuthStore } from '@/stores';
import styles from './CreateLeadModal.module.css';

interface CreateLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const SOURCE_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'indicacao', label: 'Indicação' },
    { value: 'site', label: 'Site' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'organico', label: 'Orgânico' },
    { value: 'outro', label: 'Outro' },
];

const PIPELINE_OPTIONS = [
    { value: 'high-ticket', label: 'High Ticket' },
    { value: 'low-ticket', label: 'Low Ticket' },
];

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
    const { addLead, stages } = useKanbanStore();
    const user = useAuthStore((s) => s.user);
    const [isLoading, setIsLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        company: '',
        pipeline: 'high-ticket',
        source: '',
        estimatedValue: '',
        tags: [] as string[],
        notes: '',
    });

    /** Get first non-system stage UUID for the selected pipeline */
    const getFirstStageId = (pipeline: string): string => {
        const pipelineStages = stages
            .filter(s => s.pipeline === pipeline && !s.isSystemStage)
            .sort((a, b) => a.order - b.order);
        return pipelineStages[0]?.id ?? '';
    };

    /** Parse currency string to number */
    const parseValue = (val: string): number => {
        if (!val) return 0;
        const clean = val.replace(/[R$\s.]/g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    };

    /** Format currency input as R$ X.XXX,XX */
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        if (!raw) {
            setFormData({ ...formData, estimatedValue: '' });
            return;
        }

        const numericValue = parseInt(raw, 10);
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(numericValue / 100);

        setFormData({ ...formData, estimatedValue: formatted });
    };

    /** Add tag on Enter */
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const tag = tagInput.trim();
            if (!formData.tags.includes(tag)) {
                setFormData({ ...formData, tags: [...formData.tags, tag] });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(t => t !== tagToRemove),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const tags = formData.tags.length > 0 ? formData.tags : ['Novo'];

            await addLead({
                name: formData.name,
                phone: formData.phone,
                email: formData.email || undefined,
                company: formData.company,
                pipeline: formData.pipeline,
                status: getFirstStageId(formData.pipeline),
                tags,
                order: 0,
                estimatedValue: parseValue(formData.estimatedValue),
                responsibleId: user?.id ?? '',
                source: formData.source,
                notes: formData.notes || undefined,
            } as any);

            setFormData({
                name: '', phone: '', email: '', company: '',
                pipeline: 'high-ticket', source: '', estimatedValue: '',
                tags: [], notes: '',
            });
            setTagInput('');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to create lead:', error);
            toast.error('Erro ao criar lead. Verifique os dados.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Novo Lead"
            size="lg"
        >
            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Row 1: Nome + Empresa */}
                <div className={styles.row}>
                    <Input
                        label="Nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nome do cliente"
                        required
                    />
                    <Input
                        label="Empresa"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Nome da empresa"
                        required
                    />
                </div>

                {/* Row 2: Telefone + Email */}
                <div className={styles.row}>
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
                </div>

                {/* Row 3: Pipeline + Origem */}
                <div className={styles.row}>
                    <Dropdown
                        label="Pipeline"
                        options={PIPELINE_OPTIONS}
                        value={formData.pipeline}
                        onChange={(val) => setFormData({ ...formData, pipeline: String(val) })}
                    />
                    <Dropdown
                        label="Origem"
                        options={SOURCE_OPTIONS}
                        value={formData.source}
                        onChange={(val) => setFormData({ ...formData, source: String(val) })}
                        required
                    />
                </div>

                {/* Row 4: Valor Estimado + Tags */}
                <div className={styles.row}>
                    <Input
                        label="Valor Estimado"
                        value={formData.estimatedValue}
                        onChange={handleValueChange}
                        placeholder="R$ 0,00"
                    />
                    <Input
                        label="Tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Digite e Enter..."
                    />
                </div>

                {/* Tag pills (se houver) */}
                {formData.tags.length > 0 && (
                    <div className={styles.tagsList}>
                        {formData.tags.map(tag => (
                            <Tag
                                key={tag}
                                variant="default"
                                size="sm"
                                onRemove={() => removeTag(tag)}
                            >
                                {tag}
                            </Tag>
                        ))}
                    </div>
                )}

                {/* Observações */}
                <Input
                    label="Observações"
                    multiline
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Contexto sobre o lead..."
                />

                {/* Ações */}
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
