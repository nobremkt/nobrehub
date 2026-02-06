/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTE EDITOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Editor WYSIWYG com Tiptap (ProseMirror) para edição inline.
 * Experiência similar ao Notion/Obsidian.
 * - BubbleMenu: aparece ao selecionar texto
 * - ContextMenu: aparece ao clicar com botão direito
 * - Real-time collaboration: conteúdo sincroniza entre usuários
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import { CustomTaskItem } from './CustomTaskItem';
import { EditorBubbleMenu } from './EditorBubbleMenu';
import { EditorContextMenu } from './EditorContextMenu';
import { useNotesStore } from '../../stores/useNotesStore';
import styles from './NoteEditor.module.css';

export function NoteEditor() {
    const {
        notes,
        selectedNoteId,
        selectedNoteContent,
        isSaving,
        updateNoteContent,
        updateNoteTitle
    } = useNotesStore();

    // Refs
    const editorWrapperRef = useRef<HTMLDivElement>(null);
    const isLocalEditRef = useRef(false); // Track if edit is local

    // Local state for title to prevent focus loss
    const [localTitle, setLocalTitle] = useState('');

    const selectedNote = useMemo(() => {
        return notes.find(n => n.id === selectedNoteId);
    }, [notes, selectedNoteId]);

    // Tiptap editor instance
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            TaskList,
            CustomTaskItem.configure({
                nested: true,
            }),
            Underline,
            Placeholder.configure({
                placeholder: 'Clique com botão direito para ver opções de formatação...',
            }),
            Typography,
        ],
        content: selectedNote?.content || '',
        editorProps: {
            attributes: {
                class: styles.proseMirror,
            },
        },
        onUpdate: ({ editor }) => {
            isLocalEditRef.current = true; // Mark as local edit
            const html = editor.getHTML();
            updateNoteContent(html);
            // Reset after debounce time
            setTimeout(() => {
                isLocalEditRef.current = false;
            }, 600);
        },
    });

    // Update editor content when selected note changes (initial load)
    useEffect(() => {
        if (selectedNote && editor) {
            setLocalTitle(selectedNote.title || '');
            // Use setTimeout to avoid flushSync warning from Tiptap's ReactNodeViewRenderer
            if (editor.getHTML() !== selectedNote.content) {
                setTimeout(() => {
                    editor.commands.setContent(selectedNote.content || '');
                }, 0);
            }
        }
    }, [selectedNoteId, editor]);

    // Real-time sync: Update editor when remote content changes
    useEffect(() => {
        if (!editor || !selectedNoteContent) return;

        // Only update if this is a remote change (not local edit)
        if (!isLocalEditRef.current && !isSaving) {
            const currentContent = editor.getHTML();
            if (currentContent !== selectedNoteContent) {
                // Preserve cursor position during remote update
                const { from, to } = editor.state.selection;
                setTimeout(() => {
                    editor.commands.setContent(selectedNoteContent);
                    // Try to restore cursor position
                    try {
                        const docLength = editor.state.doc.content.size;
                        const safeFrom = Math.min(from, docLength - 1);
                        const safeTo = Math.min(to, docLength - 1);
                        if (safeFrom >= 0 && safeTo >= 0) {
                            editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
                        }
                    } catch {
                        // If cursor restoration fails, just continue
                    }
                }, 0);
            }
        }
    }, [selectedNoteContent, editor, isSaving]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setLocalTitle(newTitle);
        updateNoteTitle(newTitle);
    };

    // Empty state when no note selected
    if (!selectedNote) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <FileText size={48} className={styles.emptyIcon} />
                    <h2 className={styles.emptyTitle}>Nenhuma anotação selecionada</h2>
                    <p className={styles.emptyText}>
                        Selecione uma anotação na lista ao lado ou crie uma nova para começar.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <input
                    type="text"
                    className={styles.titleInput}
                    placeholder="Título da anotação..."
                    value={localTitle}
                    onChange={handleTitleChange}
                />
                <div className={styles.status}>
                    {isSaving ? (
                        <>
                            <span className={styles.savingDot} />
                            <span>Salvando...</span>
                        </>
                    ) : (
                        <>
                            <span className={styles.savedDot} />
                            <span>Salvo</span>
                        </>
                    )}
                </div>
            </div>

            <div ref={editorWrapperRef} className={styles.editorWrapper}>
                {editor && (
                    <>
                        <EditorBubbleMenu editor={editor} />
                        <EditorContextMenu editor={editor} containerRef={editorWrapperRef} />
                    </>
                )}
                <EditorContent editor={editor} className={styles.editorContent} />
            </div>
        </div>
    );
}
