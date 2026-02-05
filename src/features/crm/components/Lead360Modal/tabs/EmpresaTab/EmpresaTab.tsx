/**
 * EmpresaTab - Informações da empresa
 */

import { useState } from 'react';
import { Lead } from '@/types/lead.types';
import { Input, Dropdown } from '@/design-system';
import { Save, X, Pencil, Building2, Globe, MapPin, Tag, Users, Database, DollarSign } from 'lucide-react';
import styles from './EmpresaTab.module.css';
import { toast } from 'react-toastify';

interface EmpresaTabProps {
    lead: Lead;
}

const CATEGORY_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'b2b', label: 'B2B' },
    { value: 'b2c', label: 'B2C' },
    { value: 'd2c', label: 'D2C' },
    { value: 'saas', label: 'SaaS' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'services', label: 'Serviços' },
];



export function EmpresaTab({ lead }: EmpresaTabProps) {
    // Extrair dados de customFields se existirem
    const customFields = lead.customFields || {};

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        companyName: lead.company || '',
        website: (customFields.website as string) || '',
        location: (customFields.location as string) || '',
        category: (customFields.category as string) || '',
        segment: (customFields.segment as string) || '',
        employeeCount: (customFields.teamSize as string) || '',
        revenue: (customFields.revenue as string) || '',
        crm: (customFields.crm as string) || '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        toast.success('Informações da empresa salvas!');
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            companyName: lead.company || '',
            website: (customFields.website as string) || '',
            location: (customFields.location as string) || '',
            category: (customFields.category as string) || '',
            segment: (customFields.segment as string) || '',
            employeeCount: (customFields.teamSize as string) || '',
            revenue: (customFields.revenue as string) || '',
            crm: (customFields.crm as string) || '',
        });
        setIsEditing(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Informações da Empresa</h3>
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

            <div className={styles.form}>
                <div className={styles.field}>
                    <label className={styles.label}>
                        <Building2 size={14} />
                        Nome da Empresa
                    </label>
                    <Input
                        value={formData.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                        placeholder="Nome da empresa"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Globe size={14} />
                        Website
                    </label>
                    <Input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://..."
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <MapPin size={14} />
                        Cidade / Estado
                    </label>
                    <Input
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="Ex: São Paulo, SP"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Tag size={14} />
                        Categoria
                    </label>
                    <Dropdown
                        options={CATEGORY_OPTIONS}
                        value={formData.category}
                        onChange={(val) => handleChange('category', String(val))}
                        placeholder="Selecione..."
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Tag size={14} />
                        Segmento
                    </label>
                    <Input
                        value={formData.segment}
                        onChange={(e) => handleChange('segment', e.target.value)}
                        placeholder="Ex: Restaurante, Clínica, Loja..."
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Users size={14} />
                        Nº de Funcionários
                    </label>
                    <Input
                        value={formData.employeeCount}
                        onChange={(e) => handleChange('employeeCount', e.target.value)}
                        placeholder="Ex: 10-50"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <DollarSign size={14} />
                        Faturamento
                    </label>
                    <Input
                        value={formData.revenue}
                        onChange={(e) => handleChange('revenue', e.target.value)}
                        placeholder="Ex: R$ 100.000/mês"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Database size={14} />
                        CRM que Utiliza
                    </label>
                    <Input
                        value={formData.crm}
                        onChange={(e) => handleChange('crm', e.target.value)}
                        placeholder="Ex: HubSpot, RD Station"
                        disabled={!isEditing}
                    />
                </div>
            </div>
        </div>
    );
}
