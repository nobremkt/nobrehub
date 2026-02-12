import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, Smile, Mic, Trash2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import styles from './ChatInput.module.css';

export interface AttachmentOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
}

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;

    // Recording
    isRecording: boolean;
    recordingTimeFormatted?: string;
    onStartRecording: () => void;
    onStopRecording: () => void; // Send
    onCancelRecording: () => void; // Cancel

    disabled?: boolean;
    placeholder?: string;
    theme?: 'light' | 'dark';

    // Attachments
    onAttachClick?: () => void; // Fallback normal click if no options provided
    attachmentOptions?: AttachmentOption[];
}

export const ChatInput = ({
    value,
    onChange,
    onSend,
    isRecording,
    recordingTimeFormatted = "00:00",
    onStartRecording,
    onStopRecording,
    onCancelRecording,
    disabled = false,
    placeholder = "Digite sua mensagem...",
    theme = 'dark',
    onAttachClick,
    attachmentOptions
}: ChatInputProps) => {

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const attachContainerRef = useRef<HTMLDivElement>(null);
    const emojiContainerRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '24px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    }, [value]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachContainerRef.current && !attachContainerRef.current.contains(event.target as Node)) {
                setIsAttachOpen(false);
            }
        };

        if (isAttachOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isAttachOpen]);

    // Close emoji menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiContainerRef.current && !emojiContainerRef.current.contains(event.target as Node)) {
                setIsEmojiOpen(false);
            }
        };

        if (isEmojiOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEmojiOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) {
                onSend();
            }
        }
    };

    const handleAttachClick = () => {
        if (attachmentOptions && attachmentOptions.length > 0) {
            setIsAttachOpen(!isAttachOpen);
        } else if (onAttachClick) {
            onAttachClick();
        }
    };

    return (
        <div className={styles.inputArea}>
            {/* Attach Actions (Left) - Hide when recording */}
            {!isRecording && (
                <div style={{ display: 'flex', gap: '8px' }} ref={attachContainerRef}>
                    <div style={{ position: 'relative' }}>
                        {isAttachOpen && attachmentOptions && (
                            <div className={styles.attachMenu}>
                                {attachmentOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        className={styles.attachOption}
                                        onClick={() => {
                                            option.onClick();
                                            setIsAttachOpen(false);
                                        }}
                                        type="button"
                                    >
                                        <div className={styles.attachOptionIcon}>
                                            {option.icon}
                                        </div>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            className={styles.headerActionBtn}
                            disabled={disabled}
                            title="Anexar arquivo"
                            onClick={handleAttachClick}
                            style={isAttachOpen ? { color: 'var(--color-primary-500)', backgroundColor: 'var(--color-bg-tertiary)' } : {}}
                        >
                            <Paperclip size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Input Field (Center) */}
            <div className={styles.inputWrapper}>
                {isRecording ? (
                    <div className={styles.recordingIndicator}>
                        <div className={styles.recordingLabel}>
                            <div className={styles.pulseDot} />
                            <span className={styles.recordingText}>
                                Gravando {recordingTimeFormatted}
                            </span>
                        </div>
                    </div>
                ) : (
                    <>
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled}
                            rows={1}
                            className={styles.textarea}
                        />
                        <div style={{ position: 'relative' }} ref={emojiContainerRef}>
                            {isEmojiOpen && (
                                <div className={styles.emojiPickerWrapper}>
                                    <EmojiPicker
                                        onEmojiClick={(emojiData: EmojiClickData) => {
                                            onChange(value + emojiData.emoji);
                                            setIsEmojiOpen(false);
                                        }}
                                        theme={theme === 'light' ? Theme.LIGHT : Theme.DARK}
                                        width={350}
                                        height={400}
                                        searchPlaceHolder="Buscar emoji..."
                                        previewConfig={{ showPreview: false }}
                                    />
                                </div>
                            )}
                            <button
                                type="button"
                                className={styles.headerActionBtn}
                                disabled={disabled}
                                title="Emojis"
                                onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                                style={isEmojiOpen ? { color: 'var(--color-primary-500)', backgroundColor: 'var(--color-bg-tertiary)' } : {}}
                            >
                                <Smile size={20} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Send/Record Actions (Right) */}
            <div className={styles.inputActions}>
                {isRecording ? (
                    <>
                        <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                            onClick={onCancelRecording}
                            title="Cancelar"
                            style={{ color: '#ef1136' }}
                        >
                            <Trash2 size={20} />
                        </button>
                        <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                            onClick={onStopRecording}
                            title="Enviar áudio"
                        >
                            <Send size={18} />
                        </button>
                    </>
                ) : (
                    <>
                        {value.trim().length === 0 && (
                            <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                                disabled={disabled}
                                onClick={onStartRecording}
                                title="Gravar áudio"
                            >
                                <Mic size={20} />
                            </button>
                        )}

                        {value.trim().length > 0 && (
                            <button
                                type="button"
                                onClick={onSend}
                                disabled={disabled}
                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                title="Enviar mensagem"
                            >
                                <Send size={18} />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
