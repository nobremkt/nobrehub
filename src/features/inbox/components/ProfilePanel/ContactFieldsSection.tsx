import React, { useState } from 'react';
import { Conversation } from '../../types';
import { Tag, PhoneInput } from '@/design-system';
import { Edit2, Check, X } from 'lucide-react';
import { formatPhone } from '@/utils';
import styles from './ProfilePanel.module.css';

interface ContactFieldsSectionProps {
    conversation: Conversation;
    onUpdateConversation: (id: string, data: Partial<Conversation>) => Promise<void>;
}

export const ContactFieldsSection: React.FC<ContactFieldsSectionProps> = ({
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
        if (editingField === 'name') updates.leadName = editValue;
        if (editingField === 'phone') updates.leadPhone = editValue;
        if (editingField === 'email') updates.leadEmail = editValue;
        if (editingField === 'instagram') updates.instagram = editValue;
        if (editingField === 'birthday') updates.birthday = editValue;
        if (editingField === 'position') updates.position = editValue;

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
                        {field === 'phone' ? (
                            <div style={{ flex: 1 }}>
                                <PhoneInput
                                    value={editValue}
                                    onChange={(val) => setEditValue(val)}
                                    placeholder={placeholder}
                                    className={styles.phoneInputOverride}
                                />
                            </div>
                        ) : (
                            <input
                                className={styles.editInput}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                autoFocus
                            />
                        )}
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
                            {field === 'phone' && value ? formatPhone(value) : (value || '-')}
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
            {renderEditableField('name', 'Nome', conversation.leadName)}
            {renderEditableField('birthday', 'Aniversário', conversation.birthday, 'DD/MM/AAAA')}
            {renderEditableField('email', 'Email', conversation.leadEmail)}
            {renderEditableField('phone', 'Telefone', conversation.leadPhone)}
            {renderEditableField('instagram', 'Instagram', conversation.instagram, '@username')}
            {renderEditableField('position', 'Cargo', conversation.position, 'Ex: Gerente')}
            <div className={styles.field}>
                <span className={styles.fieldLabel}>Notas</span>
                <span className={styles.fieldValue}>{conversation.notes || '-'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.fieldLabel}>Origem (UTM)</span>
                <span className={styles.fieldValue}>{conversation.utmSource || 'Desconhecida'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.fieldLabel}>Tags</span>
                <div className={styles.tagsInline}>
                    {conversation.tags?.map(tag => (
                        <Tag key={tag} variant="default" size="sm">{tag}</Tag>
                    ))}
                </div>
            </div>
        </div>
    );
};
