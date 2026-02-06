/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - EDITOR BUBBLE MENU (Selection Toolbar)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Menu flutuante que aparece ao selecionar texto.
 * Renderiza via Portal para escapar do stacking context.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react';
import styles from './EditorMenus.module.css';

interface EditorBubbleMenuProps {
    editor: Editor;
}

interface Position {
    x: number;
    y: number;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

    const updatePosition = useCallback(() => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (!hasSelection) {
            setIsVisible(false);
            return;
        }

        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        const x = (start.left + end.right) / 2;
        const y = start.top - 10;

        setPosition({ x, y });
        setIsVisible(true);
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        editor.on('selectionUpdate', updatePosition);
        editor.on('blur', () => setIsVisible(false));

        return () => {
            editor.off('selectionUpdate', updatePosition);
        };
    }, [editor, updatePosition]);

    const handleButtonMouseDown = (e: React.MouseEvent, command: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        command();
    };

    if (!isVisible || !editor) return null;

    // Render via Portal to escape stacking context
    return createPortal(
        <div
            className={styles.bubbleMenu}
            style={{
                position: 'fixed',
                zIndex: 99999,
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -100%)',
            }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <button
                type="button"
                onMouseDown={(e) => handleButtonMouseDown(e, () => editor.chain().focus().toggleBold().run())}
                className={`${styles.menuButton} ${editor.isActive('bold') ? styles.active : ''}`}
                title="Negrito (Ctrl+B)"
            >
                <Bold size={16} />
            </button>
            <button
                type="button"
                onMouseDown={(e) => handleButtonMouseDown(e, () => editor.chain().focus().toggleItalic().run())}
                className={`${styles.menuButton} ${editor.isActive('italic') ? styles.active : ''}`}
                title="Itálico (Ctrl+I)"
            >
                <Italic size={16} />
            </button>
            <button
                type="button"
                onMouseDown={(e) => handleButtonMouseDown(e, () => editor.chain().focus().toggleUnderline().run())}
                className={`${styles.menuButton} ${editor.isActive('underline') ? styles.active : ''}`}
                title="Sublinhado (Ctrl+U)"
            >
                <Underline size={16} />
            </button>
            <button
                type="button"
                onMouseDown={(e) => handleButtonMouseDown(e, () => editor.chain().focus().toggleStrike().run())}
                className={`${styles.menuButton} ${editor.isActive('strike') ? styles.active : ''}`}
                title="Riscado"
            >
                <Strikethrough size={16} />
            </button>
            <button
                type="button"
                onMouseDown={(e) => handleButtonMouseDown(e, () => editor.chain().focus().toggleCode().run())}
                className={`${styles.menuButton} ${editor.isActive('code') ? styles.active : ''}`}
                title="Código"
            >
                <Code size={16} />
            </button>
        </div>,
        document.body
    );
}
