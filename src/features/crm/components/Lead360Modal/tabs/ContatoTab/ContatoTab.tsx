/**
 * ContatoTab - Informações pessoais do contato
 */

import { useState } from 'react';
import { Lead } from '@/types/lead.types';
import { Input, PhoneInput } from '@/design-system';
import { Save, X, Pencil, Calendar, Mail, Phone, Instagram, Briefcase, FileText, Link2 } from 'lucide-react';
import styles from './ContatoTab.module.css';
import { toast } from 'react-toastify';

interface ContatoTabProps {
    lead: Lead;
}

export function ContatoTab({ lead }: ContatoTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: lead.name || '',
        birthday: '',
        email: lead.email || '',
        phone: lead.phone || '',
        instagram: '',
        position: '',
        notes: lead.notes || '',
        utm_source: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        toast.success('Informações de contato salvas!');
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            name: lead.name || '',
            birthday: '',
            email: lead.email || '',
            phone: lead.phone || '',
            instagram: '',
            position: '',
            notes: lead.notes || '',
            utm_source: '',
        });
        setIsEditing(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Informações de Contato</h3>
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
                        <Briefcase size={14} />
                        Nome
                    </label>
                    <Input
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Nome do contato"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Calendar size={14} />
                        Aniversário
                    </label>
                    <Input
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => handleChange('birthday', e.target.value)}
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Mail size={14} />
                        Email
                    </label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="email@exemplo.com"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Phone size={14} />
                        Telefone
                    </label>
                    <PhoneInput
                        value={formData.phone}
                        onChange={(val) => handleChange('phone', val)}
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Instagram size={14} />
                        Instagram
                    </label>
                    <Input
                        value={formData.instagram}
                        onChange={(e) => handleChange('instagram', e.target.value)}
                        placeholder="@usuario"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Briefcase size={14} />
                        Cargo
                    </label>
                    <Input
                        value={formData.position}
                        onChange={(e) => handleChange('position', e.target.value)}
                        placeholder="Cargo do contato"
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.fieldFull}>
                    <label className={styles.label}>
                        <FileText size={14} />
                        Notas
                    </label>
                    <textarea
                        className={styles.textarea}
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="Anotações sobre o contato..."
                        disabled={!isEditing}
                        rows={4}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Link2 size={14} />
                        UTM / Origem
                    </label>
                    <Input
                        value={formData.utm_source}
                        onChange={(e) => handleChange('utm_source', e.target.value)}
                        placeholder="Ex: google, facebook, indicação"
                        disabled={!isEditing}
                    />
                </div>
            </div>
        </div>
    );
}
