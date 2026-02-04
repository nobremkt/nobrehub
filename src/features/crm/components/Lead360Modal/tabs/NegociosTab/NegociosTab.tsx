/**
 * NegociosTab - Informações do negócio/oportunidade
 */

import { useState } from 'react';
import { Lead } from '@/types/lead.types';
import { Input, Dropdown } from '@/design-system';
import {
    Save, X, Pencil, DollarSign, Package, FileText,
    Thermometer, Video, Briefcase
} from 'lucide-react';
import styles from './NegociosTab.module.css';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/helpers';

interface NegociosTabProps {
    lead: Lead;
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

export function NegociosTab({ lead }: NegociosTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        dealValue: lead.estimatedValue?.toString() || '',
        productAcquired: '',
        productName: '',
        notes: '',
        temperature: '',
        recordingLink: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        toast.success('Informações do negócio salvas!');
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            dealValue: lead.estimatedValue?.toString() || '',
            productAcquired: '',
            productName: '',
            notes: '',
            temperature: '',
            recordingLink: '',
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
                        <button className={styles.saveBtn} onClick={handleSave}>
                            <Save size={14} />
                            Salvar
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
