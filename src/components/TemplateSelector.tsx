import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Send, X, ChevronDown, RefreshCw, Search, Tag } from 'lucide-react';
import { supabaseGetWhatsAppTemplates } from '../services/supabaseApi';

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

// Category mapping for better display names and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'MARKETING': { label: 'Marketing', color: 'text-violet-700', bg: 'bg-violet-100' },
    'UTILITY': { label: 'Utilidade', color: 'text-blue-700', bg: 'bg-blue-100' },
    'AUTHENTICATION': { label: 'Autenticação', color: 'text-amber-700', bg: 'bg-amber-100' },
    'SERVICE': { label: 'Atendimento', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    'OTP': { label: 'Código OTP', color: 'text-rose-700', bg: 'bg-rose-100' },
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSend, onClose, leadName }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Fetch templates from API
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await supabaseGetWhatsAppTemplates();
            setTemplates(data || []);
        } catch (err: any) {
            console.error('Failed to fetch templates:', err);
            setError('Erro ao carregar templates. Verifique sua conexão com 360Dialog.');
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique categories
    const categories = useMemo(() => {
        const cats = [...new Set(templates.map(t => t.category))];
        return cats.sort();
    }, [templates]);

    // Filter templates by search and category
    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesSearch = !searchTerm ||
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [templates, searchTerm, selectedCategory]);

    // Group templates by category
    const groupedTemplates = useMemo(() => {
        const groups: Record<string, Template[]> = {};
        filteredTemplates.forEach(t => {
            if (!groups[t.category]) {
                groups[t.category] = [];
            }
            groups[t.category].push(t);
        });
        return groups;
    }, [filteredTemplates]);

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

    // Get template preview text
    const getTemplatePreview = (template: Template): string => {
        const bodyComp = template.components?.find((c: any) => c.type === 'BODY');
        if (bodyComp?.text) {
            return bodyComp.text.length > 80 ? bodyComp.text.substring(0, 80) + '...' : bodyComp.text;
        }
        return 'Sem prévia disponível';
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

    const getCategoryStyle = (category: string) => {
        return CATEGORY_CONFIG[category] || { label: category, color: 'text-slate-700', bg: 'bg-slate-100' };
    };

    const templateVars = selectedTemplate ? getTemplateVariables(selectedTemplate) : [];
    const allVariablesFilled = templateVars.length === 0 || templateVars.every(v => variables[v]?.trim());

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
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
                <div className="max-h-[65vh] overflow-y-auto">
                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex flex-col items-center py-12">
                            <RefreshCw className="animate-spin text-rose-500 mb-2" size={24} />
                            <p className="text-slate-500 text-sm">Carregando templates...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500 text-sm mb-3">{error}</p>
                            <button
                                onClick={fetchTemplates}
                                className="text-rose-600 text-sm hover:underline"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500 text-sm">Nenhum template aprovado encontrado.</p>
                            <p className="text-slate-400 text-xs mt-1">Configure templates no 360Dialog.</p>
                        </div>
                    ) : !selectedTemplate ? (
                        /* Template List with Categories */
                        <div>
                            {/* Search and Filter Bar */}
                            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 space-y-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar template..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>

                                {/* Category Tabs */}
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                                            ? 'bg-slate-800 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        Todos ({templates.length})
                                    </button>
                                    {categories.map(cat => {
                                        const style = getCategoryStyle(cat);
                                        const count = templates.filter(t => t.category === cat).length;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                                    ? `${style.bg} ${style.color}`
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {style.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Grouped Templates */}
                            <div className="p-4 space-y-4">
                                {filteredTemplates.length === 0 ? (
                                    <p className="text-center text-slate-400 text-sm py-8">
                                        Nenhum template encontrado para "{searchTerm}"
                                    </p>
                                ) : selectedCategory === 'all' ? (
                                    // Show grouped by category
                                    Object.entries(groupedTemplates).map(([category, temps]) => (
                                        <div key={category}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Tag size={14} className={getCategoryStyle(category).color} />
                                                <span className={`text-xs font-semibold ${getCategoryStyle(category).color}`}>
                                                    {getCategoryStyle(category).label}
                                                </span>
                                                <span className="text-xs text-slate-400">({temps.length})</span>
                                            </div>
                                            <div className="space-y-2 pl-2">
                                                {temps.map(template => (
                                                    <TemplateCard
                                                        key={template.name}
                                                        template={template}
                                                        preview={getTemplatePreview(template)}
                                                        varsCount={getTemplateVariables(template).length}
                                                        categoryStyle={getCategoryStyle(template.category)}
                                                        onSelect={() => handleTemplateSelect(template)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Show flat list for single category
                                    <div className="space-y-2">
                                        {filteredTemplates.map(template => (
                                            <TemplateCard
                                                key={template.name}
                                                template={template}
                                                preview={getTemplatePreview(template)}
                                                varsCount={getTemplateVariables(template).length}
                                                categoryStyle={getCategoryStyle(template.category)}
                                                onSelect={() => handleTemplateSelect(template)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Variable Input Form */
                        <div className="p-4 space-y-4">
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="text-sm text-rose-600 hover:underline flex items-center gap-1"
                            >
                                ← Voltar para lista
                            </button>

                            <div className="p-3 bg-rose-50 rounded-xl">
                                <p className="font-semibold text-rose-800">{selectedTemplate.name}</p>
                                <p className="text-xs text-rose-600 mt-1">
                                    {getCategoryStyle(selectedTemplate.category).label} • {selectedTemplate.language}
                                </p>
                            </div>

                            {/* Preview */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Prévia da mensagem:</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                    {selectedTemplate.components?.find((c: any) => c.type === 'BODY')?.text || 'Sem texto'}
                                </p>
                            </div>

                            {templateVars.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-700">Preencha as variáveis:</p>
                                    {templateVars.map((varName, idx) => (
                                        <div key={varName}>
                                            <label className="block text-xs text-slate-500 mb-1">
                                                Variável {idx + 1}
                                            </label>
                                            <input
                                                type="text"
                                                value={variables[varName] || ''}
                                                onChange={(e) => setVariables(prev => ({
                                                    ...prev,
                                                    [varName]: e.target.value
                                                }))}
                                                placeholder={idx === 0 && leadName ? leadName : `Digite o valor`}
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

// Subcomponent for template card
interface TemplateCardProps {
    template: Template;
    preview: string;
    varsCount: number;
    categoryStyle: { label: string; color: string; bg: string };
    onSelect: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, preview, varsCount, categoryStyle, onSelect }) => (
    <button
        onClick={onSelect}
        className="w-full p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all group"
    >
        <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 group-hover:text-rose-700 truncate">
                    {template.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {preview}
                </p>
            </div>
            <ChevronDown size={16} className="text-slate-400 -rotate-90 shrink-0 mt-1" />
        </div>
        <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 ${categoryStyle.bg} ${categoryStyle.color} text-[10px] font-medium rounded-full`}>
                {categoryStyle.label}
            </span>
            <span className="text-[10px] text-slate-400">{template.language}</span>
            {varsCount > 0 && (
                <span className="text-[10px] text-slate-400">• {varsCount} variáveis</span>
            )}
        </div>
    </button>
);

export default TemplateSelector;
