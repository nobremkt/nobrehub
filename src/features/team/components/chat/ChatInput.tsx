import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import '../../styles/chat.css';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export const ChatInput = ({ onSend, disabled = false, placeholder = "Digite sua mensagem..." }: ChatInputProps) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || disabled) return;

        onSend(message);
        setMessage('');

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="chat-input-container">
            <div className="chat-input-wrapper">
                <div className="chat-input-actions">
                    <button
                        type="button"
                        className="chat-input-action-btn"
                        disabled={disabled}
                        title="Anexar arquivo"
                    >
                        <Paperclip size={20} />
                    </button>
                    <button
                        type="button"
                        className="chat-input-action-btn"
                        disabled={disabled}
                        title="Emojis"
                    >
                        <Smile size={20} />
                    </button>
                </div>

                <textarea
                    ref={textareaRef}
                    className="chat-input-field"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                />

                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!message.trim() || disabled}
                    className="chat-send-btn"
                    title="Enviar mensagem"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
