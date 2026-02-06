/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - EDITOR CONTEXT MENU (Right-Click)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Menu de contexto que aparece ao clicar com botão direito.
 * Renderiza via Portal para escapar do stacking context.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import {
    CheckSquare,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code2,
    Minus,
    Type
} from 'lucide-react';
import styles from './EditorMenus.module.css';

interface EditorContextMenuProps {
    editor: Editor;
    containerRef: React.RefObject<HTMLDivElement>;
}

interface MenuPosition {
    x: number;
    y: number;
    openUpward: boolean;
}

const MENU_HEIGHT = 400;
const MENU_WIDTH = 200;

export function EditorContextMenu({ editor, containerRef }: EditorContextMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0, openUpward: false });
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = useCallback((e: MouseEvent) => {
        e.preventDefault();

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        const openUpward = e.clientY + MENU_HEIGHT > viewportHeight;

        let x = e.clientX;
        if (x + MENU_WIDTH > viewportWidth) {
            x = viewportWidth - MENU_WIDTH - 10;
        }

        setPosition({ x, y: e.clientY, openUpward });
        setIsOpen(true);
    }, []);

    const handleClick = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [containerRef, handleContextMenu, handleClick, handleKeyDown]);

    const executeCommand = (callback: () => void) => {
        callback();
        setIsOpen(false);
    };

    if (!isOpen || !editor) return null;

    const menuItems = [
        {
            label: 'Checklist',
            icon: CheckSquare,
            action: () => editor.chain().focus().toggleTaskList().run(),
        },
        { divider: true },
        {
            label: 'Título 1',
            icon: Heading1,
            action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        },
        {
            label: 'Título 2',
            icon: Heading2,
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
            label: 'Título 3',
            icon: Heading3,
            action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        },
        {
            label: 'Texto normal',
            icon: Type,
            action: () => editor.chain().focus().setParagraph().run(),
        },
        { divider: true },
        {
            label: 'Lista com marcadores',
            icon: List,
            action: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
            label: 'Lista numerada',
            icon: ListOrdered,
            action: () => editor.chain().focus().toggleOrderedList().run(),
        },
        { divider: true },
        {
            label: 'Citação',
            icon: Quote,
            action: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
            label: 'Bloco de código',
            icon: Code2,
            action: () => editor.chain().focus().toggleCodeBlock().run(),
        },
        {
            label: 'Linha divisória',
            icon: Minus,
            action: () => editor.chain().focus().setHorizontalRule().run(),
        },
    ];

    const menuStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 99999,
        left: position.x,
        ...(position.openUpward
            ? { bottom: window.innerHeight - position.y, top: 'auto' }
            : { top: position.y }
        ),
    };

    // Render via Portal to escape stacking context
    return createPortal(
        <div
            ref={menuRef}
            className={styles.contextMenu}
            style={menuStyle}
        >
            {menuItems.map((item, index) => {
                if ('divider' in item) {
                    return <div key={index} className={styles.divider} />;
                }
                const Icon = item.icon;
                return (
                    <button
                        key={index}
                        type="button"
                        className={styles.contextMenuItem}
                        onClick={() => executeCommand(item.action)}
                    >
                        <Icon size={16} />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </div>,
        document.body
    );
}
