/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PLAYBOOK BLOCKS — Componentes visuais para cada tipo de bloco
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Copy, Send } from 'lucide-react';
import styles from './PlaybookBlocks.module.css';
import type { PlaybookBlock } from '@/features/crm/types/playbook.types';

// ─── Variable Highlighter ────────────────────────────────────────────

function highlightVariables(content: string) {
    const regex = /\{([A-ZÁÉÍÓÚÂÊÔÀÃÕÇ\/\s]+)\}/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return (
                <span key={index} className={styles.variable}>
                    {'{' + part + '}'}
                </span>
            );
        }
        return part;
    });
}

// ─── Message Block ───────────────────────────────────────────────────

interface MessageBlockProps {
    block: PlaybookBlock;
    onCopy: (text: string) => void;
    onSendToChat?: (text: string) => void;
}

export function MessageBlock({ block, onCopy, onSendToChat }: MessageBlockProps) {
    return (
        <div className={`${styles.block} ${styles.messageBlock}`}>
            <div className={styles.blockHeader}>
                <span className={styles.blockIcon}>💬</span>
                {block.title || 'Mensagem'}
            </div>
            <div className={styles.messageContent}>
                {highlightVariables(block.content)}
            </div>
            <div className={styles.messageActions}>
                <button
                    className={styles.actionBtn}
                    onClick={() => onCopy(block.content)}
                    title="Copiar texto"
                >
                    <Copy size={12} />
                    Copiar
                </button>
                {onSendToChat && (
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                        onClick={() => onSendToChat(block.content)}
                        title="Enviar no chat"
                    >
                        <Send size={12} />
                        Enviar no Chat
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Checklist Block ─────────────────────────────────────────────────

interface ChecklistBlockProps {
    block: PlaybookBlock;
    checks: boolean[];
    onToggle: (index: number) => void;
}

export function ChecklistBlock({ block, checks, onToggle }: ChecklistBlockProps) {
    // Parse content as JSON array
    let items: string[];
    try {
        items = JSON.parse(block.content);
    } catch {
        items = block.content.split('\n').filter(Boolean);
    }

    return (
        <div className={`${styles.block} ${styles.checklistBlock}`}>
            <div className={styles.blockHeader}>
                <span className={styles.blockIcon}>📋</span>
                {block.title || 'Checklist'}
            </div>
            <div className={styles.checklistItems}>
                {items.map((item, i) => {
                    const isChecked = checks[i] ?? false;
                    return (
                        <div
                            key={i}
                            className={styles.checklistItem}
                            onClick={() => onToggle(i)}
                        >
                            <div
                                className={styles.checklistCheckbox}
                                data-checked={isChecked}
                            />
                            <span
                                className={styles.checklistLabel}
                                data-checked={isChecked}
                            >
                                {item}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Tip Block ───────────────────────────────────────────────────────

interface TipBlockProps {
    block: PlaybookBlock;
}

export function TipBlock({ block }: TipBlockProps) {
    return (
        <div className={`${styles.block} ${styles.tipBlock}`}>
            <div className={styles.blockHeader}>
                <span className={styles.blockIcon}>💡</span>
                {block.title || 'Dica'}
            </div>
            <div className={styles.tipContent}>
                {block.content}
            </div>
        </div>
    );
}

// ─── Question Block ──────────────────────────────────────────────────

interface QuestionBlockProps {
    block: PlaybookBlock;
}

export function QuestionBlock({ block }: QuestionBlockProps) {
    return (
        <div className={`${styles.block} ${styles.questionBlock}`}>
            <div className={styles.blockHeader}>
                <span className={styles.blockIcon}>❓</span>
                {block.title || 'Pergunta'}
            </div>
            <div className={styles.questionContent}>
                {highlightVariables(block.content)}
            </div>
        </div>
    );
}
