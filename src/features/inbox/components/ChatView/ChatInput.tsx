import React, { useState } from 'react';
import { Input, Button } from '@/design-system';
import { Send, Paperclip, Mic } from 'lucide-react';
import styles from './ChatView.module.css';

interface ChatInputProps {
    onSend: (text: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text);
        setText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.inputArea}>
            <div className={styles.attachButton}>
                <Button variant="ghost">
                    <Paperclip size={20} />
                </Button>
            </div>

            <div className={styles.inputWrapper}>
                <Input
                    placeholder="Digite sua mensagem..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            <div className={styles.inputActions}>
                {text.trim() ? (
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
