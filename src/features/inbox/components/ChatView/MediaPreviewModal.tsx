/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - MEDIA PREVIEW MODAL
 * Modal para preview de mídia antes de enviar com opção de legenda
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Switch } from '@/design-system';
import { Send, FileText, AlertCircle, Eye } from 'lucide-react';
import styles from './MediaPreviewModal.module.css';

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (file: File, caption: string, viewOnce?: boolean) => void;
    file: File | null;
    fileType: 'image' | 'video' | 'document';
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
    isOpen,
    onClose,
    onSend,
    file,
    fileType
}) => {
    const [caption, setCaption] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [viewOnce, setViewOnce] = useState(false);

    // Generate preview URL when file changes
    useEffect(() => {
        if (file && (fileType === 'image' || fileType === 'video')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        return () => { };
    }, [file, fileType]);

    // Reset caption when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCaption('');
            setViewOnce(false);
        }
    }, [isOpen]);

    const handleSend = () => {
        if (file) {
            onSend(file, caption, viewOnce);
            setCaption('');
            setViewOnce(false);
            onClose();
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    };

    const renderPreview = () => {
        if (!file) return null;

        if (fileType === 'image' && previewUrl) {
            return (
                <div className={styles.imagePreview}>
                    <img src={previewUrl} alt="Preview" />
                </div>
            );
        }

        if (fileType === 'video' && previewUrl) {
            return (
                <div className={styles.videoPreview}>
                    <video src={previewUrl} controls />
                </div>
            );
        }

        // Document preview
        return (
            <div className={styles.documentPreview}>
                <div className={styles.documentIcon}>
                    <FileText size={48} />
                </div>
                <div className={styles.documentInfo}>
                    <span className={styles.documentName}>{file.name}</span>
                    <span className={styles.documentMeta}>
                        {getFileExtension(file.name)} • {formatFileSize(file.size)}
                    </span>
                </div>
            </div>
        );
    };

    const getTitle = () => {
        switch (fileType) {
            case 'image': return 'Enviar Imagem';
            case 'video': return 'Enviar Vídeo';
            case 'document': return 'Enviar Documento';
            default: return 'Enviar Arquivo';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            size="md"
            footer={
                <div className={styles.footer}>
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSend} disabled={!file}>
                        <Send size={16} />
                        Enviar
                    </Button>
                </div>
            }
        >
            <div className={styles.content}>
                {/* Preview Area */}
                <div className={styles.previewArea}>
                    {renderPreview()}
                </div>

                {/* Caption Input (only for image/video) */}
                {(fileType === 'image' || fileType === 'video') && (
                    <div className={styles.captionSection}>
                        <label className={styles.captionLabel}>
                            Legenda (opcional)
                        </label>
                        <textarea
                            className={styles.captionInput}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Adicione uma legenda..."
                            rows={3}
                            maxLength={1024}
                        />
                        <span className={styles.captionCount}>
                            {caption.length}/1024
                        </span>
                    </div>
                )}

                {/* View Once Toggle (only for image/video) */}
                {(fileType === 'image' || fileType === 'video') && (
                    <div className={styles.viewOnceSection}>
                        <div className={styles.viewOnceLabel}>
                            <Eye size={18} />
                            <div className={styles.viewOnceText}>
                                <span className={styles.viewOnceTitle}>Visualização única</span>
                                <span className={styles.viewOnceDescription}>
                                    A mídia só pode ser vista uma vez
                                </span>
                            </div>
                        </div>
                        <Switch
                            checked={viewOnce}
                            onChange={setViewOnce}
                        />
                    </div>
                )}

                {/* Info Banner */}
                <div className={styles.infoBanner}>
                    <AlertCircle size={16} />
                    <span>
                        {fileType === 'document'
                            ? 'O documento será enviado como anexo.'
                            : viewOnce
                                ? 'A mídia será deletada após ser visualizada.'
                                : 'A mídia será enviada para o contato.'}
                    </span>
                </div>
            </div>
        </Modal>
    );
};
