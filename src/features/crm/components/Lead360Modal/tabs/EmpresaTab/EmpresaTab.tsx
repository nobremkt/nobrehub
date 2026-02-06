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

// Alinhado com formulário de captação (Social Media Landing Page)
const SEGMENT_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'restaurante', label: 'Restaurante/Alimentação' },
    { value: 'clinica', label: 'Clínica/Saúde' },
    { value: 'loja', label: 'Loja/Varejo' },
    { value: 'servicos', label: 'Serviços' },
    { value: 'beleza', label: 'Beleza/Estética' },
    { value: 'imobiliaria', label: 'Imobiliária' },
    { value: 'educacao', label: 'Educação' },
    { value: 'outro', label: 'Outro' },
];

// Alinhado com formulário de captação
const EMPLOYEE_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: '1-5', label: '1-5 funcionários' },
    { value: '6-20', label: '6-20 funcionários' },
    { value: '21-50', label: '21-50 funcionários' },
    { value: '50+', label: '50+ funcionários' },
];

// Alinhado com formulário de captação
const REVENUE_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'ate-10k', label: 'Até R$ 10 mil/mês' },
    { value: '10k-50k', label: 'R$ 10 mil - R$ 50 mil/mês' },
    { value: '50k-200k', label: 'R$ 50 mil - R$ 200 mil/mês' },
    { value: '200k+', label: 'Acima de R$ 200 mil/mês' },
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
                    <Dropdown
                        options={SEGMENT_OPTIONS}
                        value={formData.segment}
                        onChange={(val) => handleChange('segment', String(val))}
                        placeholder="Selecione..."
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Users size={14} />
                        Nº de Funcionários
                    </label>
                    <Dropdown
                        options={EMPLOYEE_OPTIONS}
                        value={formData.employeeCount}
                        onChange={(val) => handleChange('employeeCount', String(val))}
                        placeholder="Selecione..."
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <DollarSign size={14} />
                        Faturamento
                    </label>
                    <Dropdown
                        options={REVENUE_OPTIONS}
                        value={formData.revenue}
                        onChange={(val) => handleChange('revenue', String(val))}
                        placeholder="Selecione..."
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
