import React, { useState } from 'react';
import { FileText, Send, X, ChevronDown } from 'lucide-react';

// Predefined templates - these should match what's approved in 360Dialog
const AVAILABLE_TEMPLATES = [
    {
        name: 'hello_world',
        displayName: 'Olá Mundo (Teste)',
        description: 'Template de teste simples',
        hasVariables: false,
        variables: []
    },
    {
        name: 'boas_vindas',
        displayName: 'Boas-vindas ao Cliente',
        description: 'Mensagem de boas-vindas após fechamento',
        hasVariables: true,
        variables: ['nome_cliente']
    },
    {
        name: 'lembrete_reuniao',
        displayName: 'Lembrete de Reunião',
        description: 'Lembrar cliente sobre call agendada',
        hasVariables: true,
        variables: ['nome_cliente', 'data_reuniao', 'horario']
    },
    {
        name: 'follow_up',
        displayName: 'Follow-up de Proposta',
        description: 'Recontato após envio de proposta',
        hasVariables: true,
        variables: ['nome_cliente']
    }
];

interface TemplateSelectorProps {
    onSend: (templateName: string, parameters: string[]) => Promise<void>;
    onClose: () => void;
    leadName?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSend, onClose, leadName }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<typeof AVAILABLE_TEMPLATES[0] | null>(null);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [isSending, setIsSending] = useState(false);

    const handleTemplateSelect = (template: typeof AVAILABLE_TEMPLATES[0]) => {
        setSelectedTemplate(template);
        // Pre-fill nome_cliente if available
        if (template.variables.includes('nome_cliente') && leadName) {
            setVariables({ nome_cliente: leadName });
        } else {
            setVariables({});
        }
    };

    const handleSend = async () => {
        if (!selectedTemplate) return;

        setIsSending(true);
        try {
            // Build parameters array in order
            const params = selectedTemplate.variables.map(v => variables[v] || '');
            await onSend(selectedTemplate.name, params);
            onClose();
        } catch (error) {
            console.error('Failed to send template:', error);
        } finally {
            setIsSending(false);
        }
    };

    const allVariablesFilled = selectedTemplate?.variables.every(v => variables[v]?.trim()) ?? true;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="text-white" size={24} />
                        <h2 className="text-white font-bold text-lg">Enviar Template</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="text-white" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {/* Template List */}
                    {!selectedTemplate ? (
                        <div className="space-y-2">
                            <p className="text-sm text-slate-500 mb-3">
                                Selecione um template aprovado para iniciar a conversa:
                            </p>
                            {AVAILABLE_TEMPLATES.map(template => (
                                <button
                                    key={template.name}
                                    onClick={() => handleTemplateSelect(template)}
                                    className="w-full p-4 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-800 group-hover:text-rose-700">
                                                {template.displayName}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {template.description}
                                            </p>
                                        </div>
                                        <ChevronDown size={16} className="text-slate-400 -rotate-90" />
                                    </div>
                                    {template.hasVariables && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {template.variables.map(v => (
                                                <span key={v} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                    {`{{${v}}}`}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Variable Input Form */
                        <div className="space-y-4">
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="text-sm text-rose-600 hover:underline flex items-center gap-1"
                            >
                                ← Voltar para lista
                            </button>

                            <div className="p-3 bg-rose-50 rounded-xl">
                                <p className="font-semibold text-rose-800">{selectedTemplate.displayName}</p>
                                <p className="text-xs text-rose-600 mt-1">{selectedTemplate.description}</p>
                            </div>

                            {selectedTemplate.hasVariables && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-700">Preencha as variáveis:</p>
                                    {selectedTemplate.variables.map(varName => (
                                        <div key={varName}>
                                            <label className="block text-xs text-slate-500 mb-1">
                                                {varName.replace(/_/g, ' ')}
                                            </label>
                                            <input
                                                type="text"
                                                value={variables[varName] || ''}
                                                onChange={(e) => setVariables(prev => ({
                                                    ...prev,
                                                    [varName]: e.target.value
                                                }))}
                                                placeholder={`Digite ${varName.replace(/_/g, ' ')}`}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {selectedTemplate && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button
                            onClick={handleSend}
                            disabled={isSending || !allVariablesFilled}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    Enviar Template
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateSelector;
