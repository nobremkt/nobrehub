/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEND TEMPLATE MODAL (v2)
 * Split-view modal with real-time preview for WhatsApp template messages
 * Supports HEADER, BODY, and BUTTON parameters + named params + category badges
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Send, Loader2, Check, AlertCircle, Settings2, MessageSquareText, Type, MousePointerClick } from 'lucide-react';
import { Button, Input, Spinner } from '@/design-system';
import { TemplateService } from '@/features/settings/services/TemplateService';
import { MessageTemplate } from '@/features/settings/types';
import { Conversation } from '../../types';
import type { TemplateComponent } from '../../types';
import { useSettingsStore } from '@/features/settings/stores/useSettingsStore';
import styles from './SendTemplateModal.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateVariable {
    section: 'HEADER' | 'BODY' | 'BUTTON';
    index: number;
    name: string; // e.g. "1" or "nome_do_param"
    buttonIndex?: number; // Which button (for BUTTON type)
    buttonSubType?: string; // 'url' | 'quick_reply'
}

interface SendTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (templateName: string, language: string, components: TemplateComponent[], previewText: string) => Promise<void>;
    conversation: Conversation | null;
}

// ─── Helper: extract variables from template components ──────────────────────

function extractVariables(components: any[]): TemplateVariable[] {
    const vars: TemplateVariable[] = [];
    if (!components?.length) return vars;

    for (const comp of components) {
        const type = (comp.type || '').toUpperCase();

        if (type === 'HEADER') {
            // Header can have {{1}} type vars (text headers only)
            if (comp.format === 'TEXT' || typeof comp.text === 'string') {
                const headerText = comp.text || '';
                const regex = /\{\{(\w+)\}\}/g;
                let match;
                while ((match = regex.exec(headerText)) !== null) {
                    vars.push({
                        section: 'HEADER',
                        index: vars.filter(v => v.section === 'HEADER').length + 1,
                        name: match[1],
                    });
                }
            }
        }

        if (type === 'BODY') {
            const bodyText = comp.text || '';
            const regex = /\{\{(\w+)\}\}/g;
            let match;
            while ((match = regex.exec(bodyText)) !== null) {
                vars.push({
                    section: 'BODY',
                    index: vars.filter(v => v.section === 'BODY').length + 1,
                    name: match[1],
                });
            }
        }

        if (type === 'BUTTONS') {
            const buttons = comp.buttons || [];
            buttons.forEach((btn: any, btnIdx: number) => {
                if (btn.type === 'URL' && btn.url) {
                    const regex = /\{\{(\w+)\}\}/g;
                    let match;
                    while ((match = regex.exec(btn.url)) !== null) {
                        vars.push({
                            section: 'BUTTON',
                            index: btnIdx,
                            name: match[1],
                            buttonIndex: btnIdx,
                            buttonSubType: 'url',
                        });
                    }
                }
            });
        }
    }

    return vars;
}

/** Get the body text from components */
function getBodyText(components: any[]): string {
    const body = components?.find((c: any) => (c.type || '').toUpperCase() === 'BODY');
    return body?.text || '';
}

/** Get the header text from components */
function getHeaderText(components: any[]): string {
    const header = components?.find((c: any) => (c.type || '').toUpperCase() === 'HEADER');
    if (header?.format === 'TEXT' || typeof header?.text === 'string') {
        return header.text || '';
    }
    return '';
}

/** Get footer text */
function getFooterText(components: any[]): string {
    const footer = components?.find((c: any) => (c.type || '').toUpperCase() === 'FOOTER');
    return footer?.text || '';
}

/** Get buttons from components */
function getButtons(components: any[]): any[] {
    const buttonsComp = components?.find((c: any) => (c.type || '').toUpperCase() === 'BUTTONS');
    return buttonsComp?.buttons || [];
}

/** Category badge config */
const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
    MARKETING: { label: 'Marketing', className: 'categoryMarketing' },
    UTILITY: { label: 'Utilidade', className: 'categoryUtility' },
    AUTHENTICATION: { label: 'Autenticação', className: 'categoryAuth' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const SendTemplateModal: React.FC<SendTemplateModalProps> = ({
    isOpen,
    onClose,
    onSend,
    conversation
}) => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { whatsapp } = useSettingsStore();
    const isConfigured = whatsapp.enabled && (whatsapp.provider === 'meta_cloud' || Boolean(whatsapp.baseUrl));

    // Fetch templates on mount
    useEffect(() => {
        if (isOpen && isConfigured) {
            loadTemplates();
        }
    }, [isOpen, isConfigured]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedTemplate(null);
            setVariableValues({});
            setError(null);
        }
    }, [isOpen]);

    // Reset variables when conversation changes
    useEffect(() => {
        setVariableValues({});
    }, [conversation?.id]);

    // Reset when template changes
    useEffect(() => {
        setVariableValues({});
    }, [selectedTemplate?.id]);

    const loadTemplates = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedTemplates = await TemplateService.getTemplates();
            setTemplates(fetchedTemplates);
        } catch (err) {
            console.error('Error loading templates:', err);
            setError('Erro ao carregar templates. Verifique a configuração.');
        } finally {
            setIsLoading(false);
        }
    };

    // Extract variables from components (or fallback to content)
    const variables = useMemo((): TemplateVariable[] => {
        if (!selectedTemplate) return [];

        // If template has components[], use structured extraction
        if (selectedTemplate.components?.length) {
            return extractVariables(selectedTemplate.components);
        }

        // Fallback: extract from flat content (legacy)
        if (selectedTemplate.content) {
            const regex = /\{\{(\w+)\}\}/g;
            const vars: TemplateVariable[] = [];
            let match;
            while ((match = regex.exec(selectedTemplate.content)) !== null) {
                vars.push({
                    section: 'BODY',
                    index: vars.length + 1,
                    name: match[1],
                });
            }
            return vars;
        }

        return [];
    }, [selectedTemplate]);

    // Generate unique key for each variable
    const getVarKey = (v: TemplateVariable) => `${v.section}-${v.index}-${v.name}`;

    // Generate preview text with variables replaced
    const previewBodyText = useMemo(() => {
        if (!selectedTemplate) return '';

        let text = selectedTemplate.components?.length
            ? getBodyText(selectedTemplate.components)
            : (selectedTemplate.content || '');

        variables.filter(v => v.section === 'BODY').forEach((v) => {
            const value = variableValues[getVarKey(v)];
            const placeholder = `{{${v.name}}}`;
            if (value) {
                text = text.replace(placeholder, value);
            }
        });

        return text;
    }, [selectedTemplate, variableValues, variables]);

    const previewHeaderText = useMemo(() => {
        if (!selectedTemplate?.components?.length) return '';

        let text = getHeaderText(selectedTemplate.components);
        variables.filter(v => v.section === 'HEADER').forEach((v) => {
            const value = variableValues[getVarKey(v)];
            if (value) {
                text = text.replace(`{{${v.name}}}`, value);
            }
        });

        return text;
    }, [selectedTemplate, variableValues, variables]);

    // Pre-fill helpers
    const getPrefillValue = (v: TemplateVariable): string | null => {
        if (!conversation) return null;
        // First BODY variable or named "nome" is usually the contact name
        if (v.section === 'BODY' && (v.index === 1 || v.name.toLowerCase() === 'nome') && conversation.leadName) {
            return conversation.leadName.split(' ')[0];
        }
        return null;
    };

    const handlePrefill = (v: TemplateVariable) => {
        const value = getPrefillValue(v);
        if (value) {
            setVariableValues(prev => ({ ...prev, [getVarKey(v)]: value }));
        }
    };

    const handleSend = async () => {
        if (!selectedTemplate) return;

        setIsSending(true);
        try {
            const components: TemplateComponent[] = [];

            // HEADER params
            const headerVars = variables.filter(v => v.section === 'HEADER');
            if (headerVars.length > 0) {
                components.push({
                    type: 'header',
                    parameters: headerVars.map(v => ({
                        type: 'text',
                        text: variableValues[getVarKey(v)] || `{{${v.name}}}`,
                    })),
                });
            }

            // BODY params
            const bodyVars = variables.filter(v => v.section === 'BODY');
            if (bodyVars.length > 0) {
                components.push({
                    type: 'body',
                    parameters: bodyVars.map(v => ({
                        type: 'text',
                        text: variableValues[getVarKey(v)] || `{{${v.name}}}`,
                    })),
                });
            }

            // BUTTON params
            const buttonVars = variables.filter(v => v.section === 'BUTTON');
            buttonVars.forEach(v => {
                components.push({
                    type: 'button',
                    sub_type: v.buttonSubType || 'url',
                    index: v.buttonIndex,
                    parameters: [{
                        type: 'text',
                        text: variableValues[getVarKey(v)] || `{{${v.name}}}`,
                    }],
                });
            });

            await onSend(
                selectedTemplate.name,
                selectedTemplate.language || 'pt_BR',
                components,
                previewBodyText
            );

            onClose();
        } catch (error) {
            console.error('Error sending template:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Check if all variables are filled
    const allVariablesFilled = variables.every(v => variableValues[getVarKey(v)]?.trim());

    if (!isOpen) return null;

    // ─── Template List Render ────────────────────────────────────────────────

    const renderTemplateList = () => {
        if (!isConfigured) {
            return (
                <div className={styles.emptyConfig}>
                    <Settings2 size={40} className={styles.emptyConfigIcon} />
                    <span className={styles.emptyConfigTitle}>API não configurada</span>
                    <span className={styles.emptyConfigText}>
                        Configure a integração 360Dialog em Configurações → Integrações para usar templates.
                    </span>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className={styles.loading}>
                    <Spinner size="md" />
                </div>
            );
        }

        if (error) {
            return (
                <div className={styles.errorState}>
                    <AlertCircle size={40} className={styles.errorIcon} />
                    <span className={styles.errorText}>{error}</span>
                    <button className={styles.retryButton} onClick={loadTemplates}>
                        Tentar novamente
                    </button>
                </div>
            );
        }

        if (templates.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <FileText size={40} className={styles.emptyIcon} />
                    <span className={styles.emptyConfigText}>
                        Nenhum template aprovado encontrado.
                    </span>
                </div>
            );
        }

        return (
            <div className={styles.templateList}>
                {templates.map((template) => {
                    const cat = CATEGORY_CONFIG[(template.category || '').toUpperCase()];
                    return (
                        <div
                            key={template.id}
                            className={`${styles.templateItem} ${selectedTemplate?.id === template.id ? styles.selected : ''}`}
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <MessageSquareText size={18} className={styles.templateItemIcon} />
                            <div className={styles.templateItemInfo}>
                                <span className={styles.templateItemName}>{template.name}</span>
                                {cat && (
                                    <span className={`${styles.categoryBadge} ${styles[cat.className]}`}>
                                        {cat.label}
                                    </span>
                                )}
                            </div>
                            <Check size={18} className={styles.templateItemCheck} />
                        </div>
                    );
                })}
            </div>
        );
    };

    // ─── Variable Section Render ─────────────────────────────────────────────

    const renderVariableSection = (section: string, sectionVars: TemplateVariable[], icon: React.ReactNode) => {
        if (sectionVars.length === 0) return null;

        const sectionLabels: Record<string, string> = {
            HEADER: 'Cabeçalho',
            BODY: 'Corpo',
            BUTTON: 'Botão',
        };

        return (
            <div className={styles.variableGroup}>
                <span className={styles.variableGroupTitle}>
                    {icon}
                    {sectionLabels[section] || section}
                </span>
                {sectionVars.map((v) => {
                    const key = getVarKey(v);
                    const isNamed = isNaN(Number(v.name));
                    const label = isNamed ? v.name : `Variável ${v.index}`;
                    const placeholder = isNamed ? `Digite o valor para {{${v.name}}}` : `Digite o valor para {{${v.index}}}`;

                    return (
                        <div key={key} className={styles.variableRow}>
                            <label className={styles.variableLabel}>
                                <span className={styles.variableIndex}>{v.index}</span>
                                {label}
                                {getPrefillValue(v) && (
                                    <button
                                        className={styles.prefillButton}
                                        onClick={() => handlePrefill(v)}
                                    >
                                        Usar: {getPrefillValue(v)}
                                    </button>
                                )}
                            </label>
                            <Input
                                value={variableValues[key] || ''}
                                onChange={(e) => setVariableValues(prev => ({
                                    ...prev,
                                    [key]: e.target.value
                                }))}
                                placeholder={placeholder}
                                fullWidth
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    // ─── Grouped variables ───────────────────────────────────────────────────

    const headerVars = variables.filter(v => v.section === 'HEADER');
    const bodyVars = variables.filter(v => v.section === 'BODY');
    const buttonVars = variables.filter(v => v.section === 'BUTTON');
    const hasComponents = selectedTemplate?.components?.length;
    const footerText = hasComponents ? getFooterText(selectedTemplate!.components!) : '';
    const buttons = hasComponents ? getButtons(selectedTemplate!.components!) : [];

    // ─── Preview render helper ───────────────────────────────────────────────

    const renderTextWithVars = (text: string, sectionVars: TemplateVariable[]) => {
        if (!text) return null;

        return text.split(/(\{\{\w+\}\})/).map((part, index) => {
            const match = part.match(/\{\{(\w+)\}\}/);
            if (match) {
                const paramName = match[1];
                const v = sectionVars.find(sv => sv.name === paramName);
                const value = v ? variableValues[getVarKey(v)] : undefined;

                if (value) {
                    return (
                        <span key={index} className={styles.filledVariable}>
                            {value}
                        </span>
                    );
                }
                return (
                    <span key={index} className={styles.variablePlaceholder}>
                        {part}
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className={styles.overlay} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <FileText size={20} />
                        Enviar Template
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Split View */}
                <div className={styles.content}>
                    {/* Left Panel - Template List & Variables */}
                    <div className={styles.leftPanel}>
                        <div className={styles.templateSelector}>
                            <span className={styles.sectionTitle}>Templates</span>
                            {renderTemplateList()}
                        </div>

                        {selectedTemplate && variables.length > 0 && (
                            <div className={styles.variablesSection}>
                                <span className={styles.sectionTitle}>Variáveis</span>
                                {renderVariableSection('HEADER', headerVars, <Type size={14} />)}
                                {renderVariableSection('BODY', bodyVars, <MessageSquareText size={14} />)}
                                {renderVariableSection('BUTTON', buttonVars, <MousePointerClick size={14} />)}
                            </div>
                        )}

                        {selectedTemplate && variables.length === 0 && (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                                Este template não possui variáveis.
                            </p>
                        )}
                    </div>

                    {/* Right Panel - Preview */}
                    <div className={styles.rightPanel}>
                        <span className={styles.previewLabel}>Preview</span>

                        <div className={styles.previewContainer}>
                            {selectedTemplate ? (
                                <div className={styles.previewCard}>
                                    <div className={styles.previewHeader}>
                                        <span className={styles.templateBadge}>Template</span>
                                        <span className={styles.templateName}>{selectedTemplate.name}</span>
                                    </div>

                                    {/* Header section in preview */}
                                    {previewHeaderText && (
                                        <div className={styles.previewHeaderContent}>
                                            {renderTextWithVars(
                                                hasComponents ? getHeaderText(selectedTemplate.components!) : '',
                                                headerVars
                                            )}
                                        </div>
                                    )}

                                    {/* Body section in preview */}
                                    <div className={styles.previewBody}>
                                        {renderTextWithVars(
                                            hasComponents ? getBodyText(selectedTemplate.components!) : (selectedTemplate.content || ''),
                                            bodyVars
                                        )}
                                    </div>

                                    {/* Footer in preview */}
                                    {footerText && (
                                        <div className={styles.previewFooter}>
                                            {footerText}
                                        </div>
                                    )}

                                    {/* Buttons in preview */}
                                    {buttons.length > 0 && (
                                        <div className={styles.previewButtons}>
                                            {buttons.map((btn: any, idx: number) => (
                                                <div key={idx} className={styles.previewButton}>
                                                    {btn.text}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <FileText size={48} className={styles.emptyIcon} />
                                    <p>Selecione um template para ver o preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSend}
                        disabled={!selectedTemplate || (variables.length > 0 && !allVariablesFilled) || isSending}
                        leftIcon={isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    >
                        {isSending ? 'Enviando...' : 'Enviar Template'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SendTemplateModal;
