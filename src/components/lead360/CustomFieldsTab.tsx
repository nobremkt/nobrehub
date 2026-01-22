import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../services/api';
import ManageFieldsModal from './ManageFieldsModal';
import PhoneInput from '../ui/PhoneInput';

interface CustomFieldsTabProps {
    leadId: string;
    entity: 'contact' | 'company' | 'deal';
    title: string;
    // Base fields that are part of the Lead model (not custom)
    baseFields?: {
        key: string;
        label: string;
        value: string;
        type?: 'text' | 'email' | 'phone' | 'url';
        onChange: (value: string) => void;
    }[];
    onSave?: () => void;
}

export const CustomFieldsTab: React.FC<CustomFieldsTabProps> = ({
    leadId,
    entity,
    title,
    baseFields = [],
    onSave
}) => {
    const [customFields, setCustomFields] = useState<api.CustomField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hideEmpty, setHideEmpty] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'general': true
    });
    const [editingField, setEditingField] = useState<string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCustomFields();
    }, [leadId, entity]);

    const loadCustomFields = async () => {
        setIsLoading(true);
        try {
            const fields = await api.getCustomFieldValues(leadId);
            // Filter by entity
            const entityFields = fields.filter(f => f.entity === entity);
            setCustomFields(entityFields);
        } catch (error) {
            console.error('Error loading custom fields:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (fieldId: string, value: string) => {
        setPendingChanges(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSaveField = async (fieldId: string) => {
        const value = pendingChanges[fieldId];
        if (value === undefined) return;

        try {
            await api.setCustomFieldValue(leadId, fieldId, value);
            setCustomFields(prev =>
                prev.map(f => f.id === fieldId ? { ...f, value } : f)
            );
            setPendingChanges(prev => {
                const { [fieldId]: _, ...rest } = prev;
                return rest;
            });
            setEditingField(null);
            toast.success('Campo atualizado');
            onSave?.();
        } catch (error) {
            toast.error('Erro ao salvar campo');
        }
    };

    // Handle saving base fields (Name, Phone, etc)
    const handleSaveBaseField = (fieldKey: string, value: string, fieldOnChange: (val: string) => void) => {
        if (value === undefined) return;

        try {
            fieldOnChange(value);
            setPendingChanges(prev => {
                const { [fieldKey]: _, ...rest } = prev;
                return rest;
            });
            setEditingField(null);
        } catch (error) {
            console.error('Error saving base field:', error);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const getInputType = (type: api.CustomField['type']) => {
        switch (type) {
            case 'email': return 'email';
            case 'phone': return 'tel';
            case 'url': return 'url';
            case 'number': return 'number';
            case 'date': return 'date';
            default: return 'text';
        }
    };

    // Combine base fields with custom fields
    const allFields = [
        ...baseFields.map(bf => ({
            id: `base_${bf.key}`,
            key: bf.key,
            name: bf.label,
            type: bf.type || 'text' as const,
            value: bf.value,
            isBase: true,
            onChange: bf.onChange,
        })),
        ...customFields.map(cf => ({
            id: cf.id,
            key: cf.key,
            name: cf.name,
            type: cf.type,
            value: cf.value || '',
            isBase: false,
            placeholder: cf.placeholder,
        }))
    ];

    const visibleFields = hideEmpty
        ? allFields.filter(f => f.value && f.value.trim() !== '')
        : allFields;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setHideEmpty(!hideEmpty)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${hideEmpty
                            ? 'bg-violet-100 text-violet-700'
                            : 'text-slate-500 hover:bg-slate-100'
                            }`}
                    >
                        {hideEmpty ? <EyeOff size={12} /> : <Eye size={12} />}
                        {hideEmpty ? 'Mostrando preenchidos' : 'Ocultar vazios'}
                    </button>
                    <button
                        onClick={() => setIsManaging(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Gerenciar campos"
                    >
                        <Settings size={12} />
                        <span className="hidden sm:inline">Gerenciar</span>
                    </button>
                </div>
            </div>

            <ManageFieldsModal
                isOpen={isManaging}
                onClose={() => setIsManaging(false)}
                entity={entity}
                onFieldsChanged={loadCustomFields}
            />

            {/* Section: Informações Gerais */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                    onClick={() => toggleSection('general')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                    <span className="font-medium text-sm text-slate-700">Informações Gerais</span>
                    {expandedSections['general'] ? (
                        <ChevronUp size={16} className="text-slate-400" />
                    ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                    )}
                </button>

                {expandedSections['general'] && (
                    <div className="p-4 space-y-3 bg-white">
                        {visibleFields.map(field => {
                            const isBase = 'isBase' in field && field.isBase;
                            const currentValue = pendingChanges[field.id] ?? field.value;

                            return (
                                <div key={field.id} className="group">
                                    <label className="text-xs text-slate-500 block mb-1 font-medium">{field.name}</label>
                                    <div className="relative">
                                        {field.type === 'phone' ? (
                                            /* Phone Input Logic */
                                            <div onBlur={() => {
                                                const val = pendingChanges[field.id];
                                                // Only save if defined and changed
                                                if (val !== undefined && val !== field.value) {
                                                    if (isBase) {
                                                        handleSaveBaseField(field.id, val, (field as any).onChange);
                                                    } else {
                                                        handleSaveField(field.id);
                                                    }
                                                } else {
                                                    setEditingField(null);
                                                }
                                            }}>
                                                <PhoneInput
                                                    value={currentValue}
                                                    onChange={(val) => handleFieldChange(field.id, val)}
                                                    className="w-full text-slate-900" // Ensure text color is dark
                                                />
                                            </div>
                                        ) : (
                                            /* Standard Input Logic */
                                            <div className="relative">
                                                <input
                                                    type={getInputType(field.type as any)}
                                                    value={currentValue}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    onFocus={() => setEditingField(field.id)}
                                                    onBlur={() => {
                                                        const val = pendingChanges[field.id];
                                                        if (val !== undefined && val !== field.value) {
                                                            if (isBase) {
                                                                handleSaveBaseField(field.id, val, (field as any).onChange);
                                                            } else {
                                                                handleSaveField(field.id);
                                                            }
                                                        } else {
                                                            setEditingField(null);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                    placeholder={(field as any).placeholder || 'Clique para adicionar...'}
                                                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-violet-300 rounded-lg text-sm transition-colors outline-none text-slate-900 placeholder:text-slate-400"
                                                />
                                                {pendingChanges[field.id] !== undefined && pendingChanges[field.id] !== field.value && (
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-violet-500">
                                                        Salvando...
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {visibleFields.length === 0 && (
                            <p className="text-sm text-slate-400 italic py-4 text-center">
                                Nenhum campo para exibir
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Info about custom fields */}
            {customFields.length === 0 && (
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-sm text-slate-500">
                        Nenhum campo personalizado configurado para {entity === 'contact' ? 'contatos' : entity === 'company' ? 'empresas' : 'negócios'}.
                    </p>
                    <button className="mt-2 text-sm text-violet-600 hover:underline">
                        Adicionar campos personalizados
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomFieldsTab;
