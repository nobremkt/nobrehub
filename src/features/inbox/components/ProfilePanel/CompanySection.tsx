import React, { useState } from 'react';
import { Conversation } from '../../types';
import { Edit2, Check, X } from 'lucide-react';
import styles from './ProfilePanel.module.css';

interface CompanySectionProps {
    conversation: Conversation;
    onUpdateConversation: (id: string, data: Partial<Conversation>) => Promise<void>;
}

export const CompanySection: React.FC<CompanySectionProps> = ({
    conversation,
    onUpdateConversation,
}) => {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const startEditing = (field: string, currentValue: string | undefined) => {
        setEditingField(field);
        setEditValue(currentValue || '');
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveEditing = async () => {
        if (!editingField) return;

        const updates: Partial<Conversation> = {};
        if (editingField === 'company') updates.leadCompany = editValue;
        if (editingField === 'segment') updates.segment = editValue;
        if (editingField === 'employees') updates.employees = editValue;
        if (editingField === 'revenue') updates.revenue = editValue;
        if (editingField === 'website') updates.website = editValue;

        await onUpdateConversation(conversation.id, updates);
        setEditingField(null);
        setEditValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEditing();
        if (e.key === 'Escape') cancelEditing();
    };

    const renderEditableField = (field: string, label: string, value: string | undefined, placeholder?: string) => {
        const isEditing = editingField === field;

        return (
            <div className={styles.field}>
                <span className={styles.fieldLabel}>{label}</span>
                {isEditing ? (
                    <div className={styles.editContainer}>
                        <input
                            className={styles.editInput}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            autoFocus
                        />
                        <div className={styles.editActions}>
                            <button className={`${styles.editActionBtn} ${styles.save}`} onClick={saveEditing}>
                                <Check size={14} />
                            </button>
                            <button className={`${styles.editActionBtn} ${styles.cancel}`} onClick={cancelEditing}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <span className={styles.fieldValue}>
                            {value || '-'}
                        </span>
                        <button
                            className={styles.fieldEdit}
                            onClick={() => startEditing(field, value)}
                        >
                            <Edit2 size={14} />
                        </button>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className={styles.fieldList}>
            {renderEditableField('company', 'Nome', conversation.leadCompany)}
            {renderEditableField('segment', 'Segmento', conversation.segment, 'Ex: Tecnologia')}
            {renderEditableField('employees', 'Funcionários', conversation.employees, 'Ex: 11-50')}
            {renderEditableField('revenue', 'Faturamento', conversation.revenue, 'Ex: R$ 500k - 1M')}
            {renderEditableField('website', 'Site', conversation.website, 'www.empresa.com.br')}
        </div>
    );
};
