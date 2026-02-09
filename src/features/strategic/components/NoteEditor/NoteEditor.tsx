/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTE EDITOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Editor WYSIWYG com Tiptap (ProseMirror) para edição colaborativa.
 * 
 * Arquitetura Multiplayer:
 * - localContent: estado local para UI responsiva
 * - remoteContent: conteúdo do RTDB para detectar mudanças externas
 * - activeEditors: lista de outros usuários editando
 * 
 * Fluxo:
 * 1. Usuário digita → updateLocalContent → UI atualiza instantaneamente
 * 2. Após debounce → salva no RTDB
 * 3. RTDB propaga → outros usuários recebem
 * 4. Se outro usuário editar → remoteContent muda → atualiza editor local
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Users, WifiOff } from 'lucide-react';
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
import { Avatar } from '@/design-system';
import styles from './NoteEditor.module.css';

export function NoteEditor() {
    const {
        notes,
        selectedNoteId,
        localContent,
        remoteContent,
        activeEditors,
        isSaving,
        isConnected,
        updateLocalContent,
        updateNoteTitle
    } = useNotesStore();

    // Refs
    const editorWrapperRef = useRef<HTMLDivElement>(null);
    const isTypingRef = useRef(false);
    const lastRemoteContentRef = useRef(remoteContent);

    // Local state for title
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
            Underline.configure({
                HTMLAttributes: {
                    class: 'underline',
                },
            }),
            Placeholder.configure({
                placeholder: 'Clique com botão direito para ver opções de formatação...',
            }),
            Typography,
        ],
        content: localContent,
        immediatelyRender: false, // Prevent flushSync warnings
        editorProps: {
            attributes: {
                class: styles.proseMirror,
            },
        },
        onUpdate: ({ editor }) => {
            isTypingRef.current = true;
            const html = editor.getHTML();
            updateLocalContent(html);

            // Reset typing flag after debounce
            setTimeout(() => {
                isTypingRef.current = false;
            }, 400);
        },
    });

    // Sync with remote content when it changes from another user
    useEffect(() => {
        if (!editor || !remoteContent) return;

        // Skip if user is currently typing
        if (isTypingRef.current) return;

        // Skip if content hasn't actually changed from remote
        if (remoteContent === lastRemoteContentRef.current) return;
        if (remoteContent === editor.getHTML()) return;

        // Store current cursor position and note ID
        const { from, to } = editor.state.selection;
        const currentNoteId = selectedNoteId;
        const contentToSet = remoteContent;

        // Use queueMicrotask to avoid flushSync warning during React render
        queueMicrotask(() => {
            if (!editor || editor.isDestroyed) return;

            // Check if we're still on the same note
            if (useNotesStore.getState().selectedNoteId !== currentNoteId) return;

            // Update editor with remote content
            editor.commands.setContent(contentToSet, { emitUpdate: false });

            // Try to restore cursor position
            try {
                const docLength = editor.state.doc.content.size;
                const safeFrom = Math.min(from, Math.max(0, docLength - 1));
                const safeTo = Math.min(to, Math.max(0, docLength - 1));
                if (safeFrom >= 0 && safeTo >= 0) {
                    editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
                }
            } catch {
                // Cursor restoration failed, continue without it
            }
        });

        lastRemoteContentRef.current = remoteContent;
    }, [remoteContent, editor, selectedNoteId]);
        // Store current cursor position
        const { from, to } = editor.state.selection;

        // Update editor with remote content
        editor.commands.setContent(remoteContent, { emitUpdate: false });

        // Try to restore cursor position
        try {
            const docLength = editor.state.doc.content.size;
            const safeFrom = Math.min(from, Math.max(0, docLength - 1));
            const safeTo = Math.min(to, Math.max(0, docLength - 1));
            if (safeFrom >= 0 && safeTo >= 0) {
                editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
            }
        } catch {
            // Cursor restoration failed, continue without it
        }

        lastRemoteContentRef.current = remoteContent;
    }, [remoteContent, editor]);

    // Update editor when selecting a different note
    useEffect(() => {
        if (selectedNote && editor) {
            setLocalTitle(selectedNote.title || '');

            // Only set content if it's different (prevents cursor jump on initial load)
            // Use queueMicrotask to avoid flushSync warning during React render
            if (editor.getHTML() !== localContent) {
                const currentNoteId = selectedNoteId;
                const contentToSet = localContent;

                queueMicrotask(() => {
                    if (!editor || editor.isDestroyed) return;
                    // Check if we're still on the same note
                    if (useNotesStore.getState().selectedNoteId !== currentNoteId) return;
                    editor.commands.setContent(contentToSet || '', { emitUpdate: false });
                });
            if (editor.getHTML() !== localContent) {
                editor.commands.setContent(localContent || '');
            }
        }
    }, [selectedNoteId, editor, localContent]);

    // Update title when note changes
    useEffect(() => {
        if (selectedNote) {
            setLocalTitle(selectedNote.title || '');
        }
    }, [selectedNote?.title]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setLocalTitle(newTitle);
        updateNoteTitle(newTitle);
    }, [updateNoteTitle]);

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

                <div className={styles.headerRight}>
                    {/* Active Editors Indicator */}
                    {activeEditors.length > 0 && (
                        <div className={styles.activeEditors}>
                            <Users size={14} />
                            <span>{activeEditors.length} editando</span>
                            <div className={styles.editorAvatars}>
                                {activeEditors.slice(0, 3).map((ed) => (
                                    <Avatar
                                        key={ed.oderId}
                                        fallback={ed.displayName}
                                        alt={ed.displayName}
                                        src={ed.photoURL}
                                        size="sm"
                                        className={styles.editorAvatar}
                                    />
                                ))}
                                {activeEditors.length > 3 && (
                                    <span className={styles.moreEditors}>
                                        +{activeEditors.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Connection/Save Status */}
                    <div className={styles.status}>
                        {!isConnected ? (
                            <>
                                <WifiOff size={14} className={styles.disconnectedIcon} />
                                <span>Offline</span>
                            </>
                        ) : isSaving ? (
                            <>
                                <span className={styles.savingDot} />
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <>
                                <span className={styles.savedDot} />
                                <span>Sincronizado</span>
                            </>
                        )}
                    </div>
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
