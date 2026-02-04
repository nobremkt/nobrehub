/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEND TEMPLATE MODAL
 * Split-view modal with real-time preview for WhatsApp template messages
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Send, Loader2 } from 'lucide-react';
import { Button, Dropdown, Input, Spinner } from '@/design-system';
import { TemplateService } from '@/features/settings/services/TemplateService';
import { MessageTemplate } from '@/features/settings/types';
import { Conversation } from '../../types';
import styles from './SendTemplateModal.module.css';

interface SendTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (templateName: string, language: string, components: any[], previewText: string) => Promise<void>;
    conversation: Conversation | null;
}

export const SendTemplateModal: React.FC<SendTemplateModalProps> = ({
    isOpen,
    onClose,
    onSend,
    conversation
}) => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
    const [variableValues, setVariableValues] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Fetch templates on mount
    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const fetchedTemplates = await TemplateService.getTemplates();
            setTemplates(fetchedTemplates);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Extract variable placeholders from template content ({{1}}, {{2}}, etc.)
    const variables = useMemo(() => {
        if (!selectedTemplate?.content) return [];

        const regex = /\{\{(\d+)\}\}/g;
        const matches: number[] = [];
        let match;

        while ((match = regex.exec(selectedTemplate.content)) !== null) {
            const index = parseInt(match[1], 10);
            if (!matches.includes(index)) {
                matches.push(index);
            }
        }

        return matches.sort((a, b) => a - b);
    }, [selectedTemplate]);

    // Generate preview text with variables replaced
    const previewText = useMemo(() => {
        if (!selectedTemplate?.content) return '';

        let text = selectedTemplate.content;

        variables.forEach((varIndex) => {
            const value = variableValues[varIndex];
            const placeholder = `{{${varIndex}}}`;

            if (value) {
                text = text.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
            }
        });

        return text;
    }, [selectedTemplate, variableValues, variables]);

    // Reset state when template changes
    useEffect(() => {
        setVariableValues({});
    }, [selectedTemplate?.id]);

    // Pre-fill helpers
    const getPrefillValue = (varIndex: number): string | null => {
        if (!conversation) return null;

        // Common mappings - first variable is usually name
        if (varIndex === 1 && conversation.leadName) {
            return conversation.leadName.split(' ')[0]; // First name
        }

        return null;
    };

    const handlePrefill = (varIndex: number) => {
        const value = getPrefillValue(varIndex);
        if (value) {
            setVariableValues(prev => ({ ...prev, [varIndex]: value }));
        }
    };

    const handleSend = async () => {
        if (!selectedTemplate) return;

        setIsSending(true);
        try {
            // Build components array for WhatsApp API
            const components: any[] = [];

            if (variables.length > 0) {
                const bodyParameters = variables.map(varIndex => ({
                    type: 'text',
                    text: variableValues[varIndex] || `{{${varIndex}}}`
                }));

                components.push({
                    type: 'body',
                    parameters: bodyParameters
                });
            }

            await onSend(
                selectedTemplate.name,
                selectedTemplate.language || 'pt_BR',
                components,
                previewText
            );

            onClose();
        } catch (error) {
            console.error('Error sending template:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleTemplateSelect = (templateId: string | number) => {
        const template = templates.find(t => t.id === String(templateId));
        setSelectedTemplate(template || null);
    };

    // Check if all variables are filled
    const allVariablesFilled = variables.every(v => variableValues[v]?.trim());

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
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
                    {/* Left Panel - Variables Editor */}
                    <div className={styles.leftPanel}>
                        <div className={styles.templateSelector}>
                            <span className={styles.sectionTitle}>Template</span>
                            {isLoading ? (
                                <div className={styles.loading}>
                                    <Spinner size="sm" />
                                </div>
                            ) : (
                                <Dropdown
                                    value={selectedTemplate?.id}
                                    onChange={handleTemplateSelect}
                                    placeholder="Selecione um template"
                                    options={templates.map(t => ({
                                        value: t.id,
                                        label: t.name
                                    }))}
                                />
                            )}
                        </div>

                        {selectedTemplate && variables.length > 0 && (
                            <div className={styles.variablesSection}>
                                <span className={styles.sectionTitle}>Variáveis</span>
                                {variables.map((varIndex) => (
                                    <div key={varIndex} className={styles.variableRow}>
                                        <label className={styles.variableLabel}>
                                            <span className={styles.variableIndex}>{varIndex}</span>
                                            Variável {varIndex}
                                            {getPrefillValue(varIndex) && (
                                                <button
                                                    className={styles.prefillButton}
                                                    onClick={() => handlePrefill(varIndex)}
                                                >
                                                    Usar: {getPrefillValue(varIndex)}
                                                </button>
                                            )}
                                        </label>
                                        <Input
                                            value={variableValues[varIndex] || ''}
                                            onChange={(e) => setVariableValues(prev => ({
                                                ...prev,
                                                [varIndex]: e.target.value
                                            }))}
                                            placeholder={`Digite o valor para {{${varIndex}}}`}
                                            fullWidth
                                        />
                                    </div>
                                ))}
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
                                    <div className={styles.previewBody}>
                                        {previewText.split(/(\{\{\d+\}\})/).map((part, index) => {
                                            const isPlaceholder = /\{\{\d+\}\}/.test(part);
                                            if (isPlaceholder) {
                                                return (
                                                    <span key={index} className={styles.variablePlaceholder}>
                                                        {part}
                                                    </span>
                                                );
                                            }
                                            return <span key={index}>{part}</span>;
                                        })}
                                    </div>
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
