/**
 * NegociosTab - Informações do negócio/oportunidade
 */

import { useState } from 'react';
import { Lead } from '@/types/lead.types';
import { Input, Dropdown } from '@/design-system';
import {
    Save, X, Pencil, DollarSign, Package, FileText,
    Thermometer, Video, Briefcase, Loader2
} from 'lucide-react';
import styles from './NegociosTab.module.css';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/helpers';
import { LeadService } from '../../../../services/LeadService';

interface NegociosTabProps {
    lead: Lead;
    onLeadUpdated?: () => void;
}

const TEMPERATURE_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'cold', label: '❄️ Frio' },
    { value: 'warm', label: '🌡️ Morno' },
    { value: 'hot', label: '🔥 Quente' },
];

const PRODUCT_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'high_ticket', label: 'High Ticket' },
    { value: 'low_ticket', label: 'Low Ticket' },
    { value: 'consultoria', label: 'Consultoria' },
    { value: 'mentoria', label: 'Mentoria' },
    { value: 'curso', label: 'Curso' },
    { value: 'servico', label: 'Serviço Avulso' },
];

export function NegociosTab({ lead, onLeadUpdated }: NegociosTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const customFields = (lead.customFields || {}) as Record<string, string>;
    const [formData, setFormData] = useState({
        dealValue: (lead.dealValue ?? lead.estimatedValue)?.toString() || '',
        productAcquired: customFields.productAcquired || '',
        productName: customFields.productName || '',
        notes: lead.dealNotes || '',
        temperature: lead.temperature || '',
        recordingLink: customFields.recordingLink || '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const numericValue = parseFloat(formData.dealValue) || 0;
            await LeadService.updateLead(lead.id, {
                estimatedValue: numericValue,
                dealValue: numericValue,
                dealNotes: formData.notes,
                temperature: (formData.temperature || undefined) as Lead['temperature'],
                customFields: {
                    ...lead.customFields,
                    productAcquired: formData.productAcquired,
                    productName: formData.productName,
                    recordingLink: formData.recordingLink,
                },
            });
            toast.success('Informações do negócio salvas!');
            setIsEditing(false);
            onLeadUpdated?.();
        } catch (error) {
            console.error('Erro ao salvar negócio:', error);
            toast.error('Erro ao salvar informações do negócio.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        const cf = (lead.customFields || {}) as Record<string, string>;
        setFormData({
            dealValue: (lead.dealValue ?? lead.estimatedValue)?.toString() || '',
            productAcquired: cf.productAcquired || '',
            productName: cf.productName || '',
            notes: lead.dealNotes || '',
            temperature: lead.temperature || '',
            recordingLink: cf.recordingLink || '',
        });
        setIsEditing(false);
    };

    const getTemperatureLabel = (temp: string) => {
        const opt = TEMPERATURE_OPTIONS.find(o => o.value === temp);
        return opt?.label || '-';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <Briefcase size={18} />
                    Informações do Negócio
                </h3>
                {!isEditing ? (
                    <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                        <Pencil size={14} />
                        <span>Editar</span>
                    </button>
                ) : (
                    <div className={styles.actions}>
                        <button className={styles.cancelBtn} onClick={handleCancel}>
                            <X size={14} />
                            Cancelar
                        </button>
                        <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 size={14} className={styles.spinning} /> : <Save size={14} />}
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Card */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Valor do Negócio</span>
                    <span className={styles.summaryValue}>
                        {formatCurrency(lead.estimatedValue)}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Status</span>
                    <span className={`${styles.statusBadge} ${styles[lead.status]}`}>
                        {lead.status === 'open' && 'Em Aberto'}
                        {lead.status === 'won' && 'Ganho'}
                        {lead.status === 'lost' && 'Perdido'}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Temperatura</span>
                    <span className={styles.summaryValue}>
                        {getTemperatureLabel(formData.temperature)}
                    </span>
                </div>
            </div>

            <div className={styles.form}>
                <div className={styles.field}>
                    <label className={styles.label}>
                        <DollarSign size={14} />
                        Valor do Negócio
                    </label>
                    <Input
                        type="number"
                        value={formData.dealValue}
                        onChange={(e) => handleChange('dealValue', e.target.value)}
                        placeholder="Ex: 5000"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Package size={14} />
                        Produto Adquirido
                    </label>
                    <Dropdown
                        options={PRODUCT_OPTIONS}
                        value={formData.productAcquired}
                        onChange={(val) => handleChange('productAcquired', String(val))}
                        placeholder="Selecione..."
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Package size={14} />
                        Nome do Produto
                    </label>
                    <Input
                        value={formData.productName}
                        onChange={(e) => handleChange('productName', e.target.value)}
                        placeholder="Ex: Curso Premium 2025"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Thermometer size={14} />
                        Temperatura
                    </label>
                    <Dropdown
                        options={TEMPERATURE_OPTIONS}
                        value={formData.temperature}
                        onChange={(val) => handleChange('temperature', String(val))}
                        placeholder="Selecione..."
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Video size={14} />
                        Link de Gravação
                    </label>
                    <Input
                        type="url"
                        value={formData.recordingLink}
                        onChange={(e) => handleChange('recordingLink', e.target.value)}
                        placeholder="https://meet.google.com/..."
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.fieldFull}>
                    <label className={styles.label}>
                        <FileText size={14} />
                        Notas do Negócio
                    </label>
                    <textarea
                        className={styles.textarea}
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="Anotações sobre a negociação..."
                        disabled={!isEditing}
                        rows={4}
                    />
                </div>
            </div>
        </div>
    );
}
