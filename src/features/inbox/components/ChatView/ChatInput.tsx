import React, { useState, useRef } from 'react';
import { Input, Button } from '@/design-system';
import { Send, Paperclip, Mic, Image, FileText, Film, X, Zap } from 'lucide-react';
import styles from './ChatView.module.css';

interface ChatInputProps {
    onSend: (text: string) => void;
    onSendMedia?: (file: File, type: 'image' | 'video' | 'audio' | 'document') => void;
    onSelectTemplate?: (template: MessageTemplate) => void;
    disabled?: boolean;
}

interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
}

// Mock templates - in production, fetch from backend
const TEMPLATES: MessageTemplate[] = [
    {
        id: '1',
        name: 'Boas-vindas',
        content: 'Olá! Seja bem-vindo(a) à Nobre Marketing. Como posso ajudá-lo(a) hoje?',
        category: 'saudacao'
    },
    {
        id: '2',
        name: 'Follow-up',
        content: 'Olá! Notei que conversamos recentemente. Gostaria de saber se ainda posso ajudá-lo(a) com alguma dúvida?',
        category: 'followup'
    },
    {
        id: '3',
        name: 'Agradecimento',
        content: 'Muito obrigado pelo contato! Qualquer dúvida, estamos à disposição. 🙏',
        category: 'fechamento'
    },
    {
        id: '4',
        name: 'Orçamento',
        content: 'Segue em anexo o orçamento solicitado. Fico no aguardo do seu retorno para esclarecer qualquer dúvida!',
        category: 'comercial'
    }
];

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onSendMedia, onSelectTemplate, disabled }) => {
    const [text, setText] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (selectedFile && onSendMedia) {
            const type = getFileType(selectedFile);
            onSendMedia(selectedFile, type);
            clearFile();
        } else if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        return 'document';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setShowAttachMenu(false);

            if (type === 'image' || type === 'video') {
                const url = URL.createObjectURL(file);
                setFilePreview(url);
            }
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
    };

    const handleTemplateSelect = (template: MessageTemplate) => {
        setText(template.content);
        setShowTemplates(false);
        if (onSelectTemplate) {
            onSelectTemplate(template);
        }
    };

    return (
        <div className={`${styles.inputArea} ${disabled ? styles.inputAreaDisabled : ''}`}>
            {/* File Preview */}
            {selectedFile && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 'var(--space-6)',
                    right: 'var(--space-6)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)'
                }}>
                    {filePreview && getFileType(selectedFile) === 'image' && (
                        <img src={filePreview} alt="Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                    )}
                    {filePreview && getFileType(selectedFile) === 'video' && (
                        <video src={filePreview} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                    )}
                    {getFileType(selectedFile) === 'document' && (
                        <FileText size={40} style={{ color: 'var(--color-primary-500)' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedFile.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                    </div>
                    <Button variant="ghost" onClick={clearFile}>
                        <X size={18} />
                    </Button>
                </div>
            )}

            {/* Templates Modal */}
            {showTemplates && (
                <div className={styles.templateModal}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-3)'
                    }}>
                        <span style={{ fontWeight: 600 }}>Templates de Mensagem</span>
                        <Button variant="ghost" onClick={() => setShowTemplates(false)}>
                            <X size={18} />
                        </Button>
                    </div>
                    {TEMPLATES.map(template => (
                        <div
                            key={template.id}
                            className={styles.templateItem}
                            onClick={() => handleTemplateSelect(template)}
                        >
                            <div className={styles.templateName}>{template.name}</div>
                            <div className={styles.templateContent}>{template.content}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Attach Menu */}
            {showAttachMenu && (
                <div className={styles.attachDropdown}>
                    <div className={styles.attachItem} onClick={() => imageInputRef.current?.click()}>
                        <Image size={20} />
                        <span>Imagem</span>
                    </div>
                    <div className={styles.attachItem} onClick={() => videoInputRef.current?.click()}>
                        <Film size={20} />
                        <span>Vídeo</span>
                    </div>
                    <div className={styles.attachItem} onClick={() => fileInputRef.current?.click()}>
                        <FileText size={20} />
                        <span>Documento</span>
                    </div>
                </div>
            )}

            {/* Hidden File Inputs */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'image')}
            />
            <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'video')}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'document')}
            />

            <div className={styles.attachButton}>
                <Button variant="ghost" onClick={() => {
                    setShowAttachMenu(!showAttachMenu);
                    setShowTemplates(false);
                }}>
                    <Paperclip size={20} />
                </Button>
            </div>

            <Button
                variant="ghost"
                onClick={() => {
                    setShowTemplates(!showTemplates);
                    setShowAttachMenu(false);
                }}
                title="Templates"
            >
                <Zap size={20} />
            </Button>

            <div className={styles.inputWrapper}>
                <Input
                    placeholder="Digite sua mensagem..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setShowAttachMenu(false);
                        setShowTemplates(false);
                    }}
                />
            </div>

            <div className={styles.inputActions}>
                {text.trim() || selectedFile ? (
                    <Button variant="primary" onClick={handleSend}>
                        <Send size={18} />
                    </Button>
                ) : (
                    <Button variant="ghost">
                        <Mic size={20} />
                    </Button>
                )}
            </div>
        </div>
    );
};
