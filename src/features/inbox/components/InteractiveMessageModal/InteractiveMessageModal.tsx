/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTERACTIVE MESSAGE MODAL
 * Send WhatsApp interactive messages with 1-3 reply buttons
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { X, Send, Loader2, Plus, Trash2, MousePointerClick } from 'lucide-react';
import { Button, Input } from '@/design-system';
import styles from './InteractiveMessageModal.module.css';

interface InteractiveButton {
    id: string;
    title: string;
}

interface InteractiveMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (body: string, buttons: InteractiveButton[], header?: string) => Promise<void>;
}

const MAX_BUTTONS = 3;
const MAX_BUTTON_TITLE = 20;

export const InteractiveMessageModal: React.FC<InteractiveMessageModalProps> = ({
    isOpen,
    onClose,
    onSend,
}) => {
    const [header, setHeader] = useState('');
    const [body, setBody] = useState('');
    const [buttons, setButtons] = useState<InteractiveButton[]>([
        { id: 'btn_1', title: '' },
    ]);
    const [isSending, setIsSending] = useState(false);

    const handleAddButton = () => {
        if (buttons.length >= MAX_BUTTONS) return;
        setButtons(prev => [...prev, { id: `btn_${prev.length + 1}`, title: '' }]);
    };

    const handleRemoveButton = (index: number) => {
        if (buttons.length <= 1) return;
        setButtons(prev => prev.filter((_, i) => i !== index));
    };

    const handleButtonChange = (index: number, title: string) => {
        if (title.length > MAX_BUTTON_TITLE) return;
        setButtons(prev => prev.map((btn, i) =>
            i === index ? { ...btn, title } : btn
        ));
    };

    const handleSend = async () => {
        if (!body.trim() || !buttons.every(b => b.title.trim())) return;

        setIsSending(true);
        try {
            await onSend(body, buttons, header || undefined);
            // Reset and close
            setHeader('');
            setBody('');
            setButtons([{ id: 'btn_1', title: '' }]);
            onClose();
        } catch (error) {
            console.error('Error sending interactive message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const isValid = body.trim() && buttons.every(b => b.title.trim());

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <MousePointerClick size={20} />
                        Mensagem Interativa
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Left: Form */}
                    <div className={styles.leftPanel}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>
                                Cabeçalho <span className={styles.optional}>(opcional)</span>
                            </label>
                            <Input
                                value={header}
                                onChange={e => setHeader(e.target.value)}
                                placeholder="Título da mensagem"
                                fullWidth
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>
                                Corpo <span className={styles.required}>*</span>
                            </label>
                            <textarea
                                className={styles.textarea}
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Texto da mensagem..."
                                rows={4}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>
                                Botões <span className={styles.required}>*</span>
                                <span className={styles.counter}>{buttons.length}/{MAX_BUTTONS}</span>
                            </label>

                            <div className={styles.buttonList}>
                                {buttons.map((btn, index) => (
                                    <div key={index} className={styles.buttonRow}>
                                        <Input
                                            value={btn.title}
                                            onChange={e => handleButtonChange(index, e.target.value)}
                                            placeholder={`Botão ${index + 1}`}
                                            fullWidth
                                        />
                                        <span className={styles.charCount}>
                                            {btn.title.length}/{MAX_BUTTON_TITLE}
                                        </span>
                                        {buttons.length > 1 && (
                                            <button
                                                className={styles.removeButton}
                                                onClick={() => handleRemoveButton(index)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {buttons.length < MAX_BUTTONS && (
                                <button className={styles.addButton} onClick={handleAddButton}>
                                    <Plus size={14} />
                                    Adicionar botão
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className={styles.rightPanel}>
                        <span className={styles.previewLabel}>Preview</span>

                        <div className={styles.previewContainer}>
                            <div className={styles.previewCard}>
                                {header && (
                                    <div className={styles.previewCardHeader}>
                                        {header}
                                    </div>
                                )}
                                <div className={styles.previewBody}>
                                    {body || 'Texto da mensagem...'}
                                </div>
                                <div className={styles.previewButtons}>
                                    {buttons.map((btn, idx) => (
                                        <div key={idx} className={styles.previewButton}>
                                            {btn.title || `Botão ${idx + 1}`}
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                        disabled={!isValid || isSending}
                        leftIcon={isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    >
                        {isSending ? 'Enviando...' : 'Enviar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InteractiveMessageModal;
