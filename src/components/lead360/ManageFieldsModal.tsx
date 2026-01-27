import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseGetCustomFields, supabaseCreateCustomField, supabaseDeleteCustomField, CustomField } from '../../services/supabaseApi';

interface ManageFieldsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entity: 'contact' | 'company' | 'deal';
    onFieldsChanged: () => void;
}

interface NewFieldForm {
    name: string;
    key: string;
    type: CustomField['type'];
    placeholder: string;
    options: string; // Comma separated for input
}

const ManageFieldsModal: React.FC<ManageFieldsModalProps> = ({
    isOpen,
    onClose,
    entity,
    onFieldsChanged
}) => {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // New field form state
    const [newField, setNewField] = useState<NewFieldForm>({
        name: '',
        key: '',
        type: 'text',
        placeholder: '',
        options: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadFields();
        }
    }, [isOpen, entity]);

    const loadFields = async () => {
        setIsLoading(true);
        try {
            const data = await supabaseGetCustomFields(entity);
            setFields(data);
        } catch (error) {
            toast.error('Erro ao carregar campos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateField = async () => {
        // Validation
        if (!newField.name || !newField.key) {
            toast.error('Nome e chave são obrigatórios');
            return;
        }

        // Auto-format key to snake_case if user didn't specific strictly
        const formattedKey = newField.key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

        try {
            await supabaseCreateCustomField({
                name: newField.name,
                key: formattedKey,
                type: newField.type,
                entity: entity,
                placeholder: newField.placeholder || undefined,
                options: newField.type === 'select' || newField.type === 'multiselect'
                    ? newField.options.split(',').map(o => o.trim()).filter(Boolean)
                    : undefined,
                order: fields.length,
                isVisible: true,
                isRequired: false
            } as any); // Cast because creating doesn't require all fields like createdAt

            toast.success('Campo criado com sucesso');
            setNewField({ name: '', key: '', type: 'text', placeholder: '', options: '' });
            setIsCreating(false);
            loadFields();
            onFieldsChanged();
        } catch (error) {
            // Check for specific error messages if API returns them
            toast.error('Erro ao criar campo. Verifique se a chave já existe.');
        }
    };

    const handleDeleteField = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o campo "${name}"? Os dados associados serão perdidos.`)) return;

        try {
            await supabaseDeleteCustomField(id);
            toast.success('Campo excluído');
            loadFields();
            onFieldsChanged();
        } catch (error) {
            toast.error('Erro ao excluir campo');
        }
    };

    const generateKeyFromName = (name: string) => {
        const generated = name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
        setNewField(prev => ({ ...prev, key: generated }));
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            text: 'Texto',
            number: 'Número',
            date: 'Data',
            select: 'Seleção',
            multiselect: 'Múltipla Escolha',
            url: 'Link',
            email: 'Email',
            phone: 'Telefone'
        };
        return types[type] || type;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in scale-95 duration-200">
                <header className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-800">
                        Gerenciar Campos: {entity === 'contact' ? 'Contato' : entity === 'company' ? 'Empresa' : 'Negócio'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* List Existing Fields */}
                    <div className="space-y-3 mb-8">
                        <h4 className="text-sm font-semibold text-slate-700 mb-4">Campos Existentes</h4>

                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full" />
                            </div>
                        ) : fields.length === 0 ? (
                            <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                                Nenhum campo personalizado criado ainda.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {fields.map((field) => (
                                    <div key={field.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-violet-200 transition-colors group shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="cursor-grab text-slate-300 hover:text-slate-500">
                                                <GripVertical size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{field.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {getTypeLabel(field.type)}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono">{field.key}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDeleteField(field.id, field.name)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Excluir campo"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add New Field */}
                    <div className="border-t border-slate-100 pt-6">
                        {!isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-4 py-2 rounded-lg transition-colors w-full justify-center border border-dashed border-violet-200"
                            >
                                <Plus size={16} />
                                Adicionar Novo Campo
                            </button>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                <h4 className="text-sm font-semibold text-slate-800 mb-4">Novo Campo</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Nome do Campo <span className="text-rose-500">*</span></label>
                                        <input
                                            value={newField.name}
                                            onChange={(e) => {
                                                setNewField(prev => ({ ...prev, name: e.target.value }));
                                                if (!newField.key) generateKeyFromName(e.target.value);
                                            }}
                                            placeholder="Ex: Data de Nascimento"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Chave (ID) <span className="text-rose-500">*</span></label>
                                        <input
                                            value={newField.key}
                                            onChange={(e) => setNewField(prev => ({ ...prev, key: e.target.value }))}
                                            placeholder="Ex: data_nascimento"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none font-mono bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo do Campo</label>
                                        <select
                                            value={newField.type}
                                            onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as any }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white"
                                        >
                                            <option value="text">Texto</option>
                                            <option value="number">Número</option>
                                            <option value="date">Data</option>
                                            <option value="email">Email</option>
                                            <option value="phone">Telefone</option>
                                            <option value="url">Link / URL</option>
                                            <option value="select">Seleção Única</option>
                                            <option value="multiselect">Múltipla Escolha</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Placeholder</label>
                                        <input
                                            value={newField.placeholder}
                                            onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                                            placeholder="Ex: Digite..."
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {(newField.type === 'select' || newField.type === 'multiselect') && (
                                    <div className="mb-4">
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Opções (separadas por vírgula)</label>
                                        <input
                                            value={newField.options}
                                            onChange={(e) => setNewField(prev => ({ ...prev, options: e.target.value }))}
                                            placeholder="Opção 1, Opção 2, Opção 3"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateField}
                                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
                                    >
                                        <Save size={16} />
                                        Salvar Campo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageFieldsModal;
