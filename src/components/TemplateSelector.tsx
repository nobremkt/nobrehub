import React, { useState, useEffect } from 'react';
import { FileText, Send, X, ChevronDown, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Template {
    name: string;
    language: string;
    status: string;
    category: string;
    components?: any[];
}

interface TemplateSelectorProps {
    onSend: (templateName: string, parameters: string[], fullText?: string) => Promise<void>;
    onClose: () => void;
    leadName?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSend, onClose, leadName }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch templates from API
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/whatsapp/templates`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }

            const data = await response.json();
            setTemplates(data.templates || []);
        } catch (err: any) {
            console.error('Failed to fetch templates:', err);
            setError('Erro ao carregar templates. Verifique sua conexão com 360Dialog.');
        } finally {
            setIsLoading(false);
        }
    };

    // Extract variable names from template components
    const getTemplateVariables = (template: Template): string[] => {
        if (!template.components) return [];

        const vars: string[] = [];
        template.components.forEach((comp: any) => {
            if (comp.type === 'BODY' && comp.text) {
                // Match {{1}}, {{2}}, etc.
                const matches = comp.text.match(/\{\{\d+\}\}/g);
                if (matches) {
                    matches.forEach((m: string, i: number) => {
                        vars.push(`variavel_${i + 1}`);
                    });
                }
            }
        });
        return vars;
    };

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        const templateVars = getTemplateVariables(template);
        // Pre-fill first variable with lead name if available
        if (templateVars.length > 0 && leadName) {
            setVariables({ [templateVars[0]]: leadName });
        } else {
            setVariables({});
        }
    };

    const handleSend = async () => {
        if (!selectedTemplate) return;

        setIsSending(true);
        try {
            const templateVars = getTemplateVariables(selectedTemplate);
            const params = templateVars.map(v => variables[v] || '');

            // Reconstruct full message text
            const bodyComp = selectedTemplate.components?.find((c: any) => c.type === 'BODY');
            let fullText = bodyComp?.text || '';
            // Replace {{1}}, {{2}} with actual values
            fullText = fullText.replace(/\{\{(\d+)\}\}/g, (match: string, number: string) => {
                const varIndex = parseInt(number) - 1;
                return params[varIndex] || match;
            });

            await onSend(selectedTemplate.name, params, fullText);
            onClose();
        } catch (error) {
            console.error('Failed to send template:', error);
        } finally {
            setIsSending(false);
        }
    };

    const templateVars = selectedTemplate ? getTemplateVariables(selectedTemplate) : [];
    const allVariablesFilled = templateVars.length === 0 || templateVars.every(v => variables[v]?.trim());

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
                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex flex-col items-center py-8">
                            <RefreshCw className="animate-spin text-rose-500 mb-2" size={24} />
                            <p className="text-slate-500 text-sm">Carregando templates...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-500 text-sm mb-3">{error}</p>
                            <button
                                onClick={fetchTemplates}
                                className="text-rose-600 text-sm hover:underline"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 text-sm">Nenhum template aprovado encontrado.</p>
                            <p className="text-slate-400 text-xs mt-1">Configure templates no 360Dialog.</p>
                        </div>
                    ) : !selectedTemplate ? (
                        /* Template List */
                        <div className="space-y-2">
                            <p className="text-sm text-slate-500 mb-3">
                                Selecione um template aprovado para iniciar a conversa:
                            </p>
                            {templates.map(template => {
                                const vars = getTemplateVariables(template);
                                return (
                                    <button
                                        key={template.name}
                                        onClick={() => handleTemplateSelect(template)}
                                        className="w-full p-4 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-800 group-hover:text-rose-700">
                                                    {template.name}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {template.category} • {template.language}
                                                </p>
                                            </div>
                                            <ChevronDown size={16} className="text-slate-400 -rotate-90" />
                                        </div>
                                        {vars.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {vars.map(v => (
                                                    <span key={v} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                        {`{{${v}}}`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
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
                                <p className="font-semibold text-rose-800">{selectedTemplate.name}</p>
                                <p className="text-xs text-rose-600 mt-1">{selectedTemplate.category} • {selectedTemplate.language}</p>
                            </div>

                            {templateVars.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-700">Preencha as variáveis:</p>
                                    {templateVars.map(varName => (
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
