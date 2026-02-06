/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES SIDEBAR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sidebar com lista de notas, busca e criação.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmModal } from '@/design-system';
import { CollaboratorService } from '@/features/settings/services/CollaboratorService';
import { Collaborator } from '@/features/settings/types';
import styles from './NotesSidebar.module.css';

export function NotesSidebar() {
    const {
        notes,
        selectedNoteId,
        searchQuery,
        init,
        cleanup,
        selectNote,
        createNote,
        deleteNote,
        setSearchQuery
    } = useNotesStore();

    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

    useEffect(() => {
        init();
        CollaboratorService.getCollaborators().then(setCollaborators);
        return () => cleanup();
    }, [init, cleanup]);

    const getCreatorName = (createdBy: string) => {
        const collaborator = collaborators.find(c => c.id === createdBy);
        return collaborator?.name || 'Desconhecido';
    };

    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return notes;
        const query = searchQuery.toLowerCase();
        return notes.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        );
    }, [notes, searchQuery]);

    const handleDeleteClick = (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation();
        setNoteToDelete(noteId);
    };

    const handleConfirmDelete = () => {
        if (noteToDelete) {
            deleteNote(noteToDelete);
            setNoteToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setNoteToDelete(null);
    };

    const formatDate = (date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    };

    const noteToDeleteTitle = noteToDelete
        ? notes.find(n => n.id === noteToDelete)?.title || 'Sem título'
        : '';

    return (
        <>
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <input
                        type="text"
                        placeholder="Buscar anotações..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    <button
                        className={styles.createBtn}
                        onClick={createNote}
                    >
                        <Plus size={16} />
                        Nova Anotação
                    </button>
                </div>

                <div className={styles.notesList}>
                    {filteredNotes.length > 0 ? (
                        filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                className={`${styles.noteItem} ${selectedNoteId === note.id ? styles.selected : ''}`}
                                onClick={() => selectNote(note.id)}
                            >
                                <div className={styles.noteHeader}>
                                    <span className={styles.noteTitle}>
                                        {note.title || 'Sem título'}
                                    </span>
                                    <span className={styles.noteTimestamp}>
                                        {formatDate(note.updatedAt)}
                                    </span>
                                </div>
                                <div className={styles.noteMeta}>
                                    <span className={styles.noteCreator}>
                                        Criado por {getCreatorName(note.createdBy)}
                                    </span>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => handleDeleteClick(e, note.id)}
                                        title="Excluir"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <FileText size={32} className={styles.emptyIcon} />
                            <p className={styles.emptyText}>
                                {searchQuery
                                    ? 'Nenhuma anotação encontrada'
                                    : 'Crie sua primeira anotação'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!noteToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Excluir anotação"
                description={
                    <>
                        Tem certeza que deseja excluir a anotação <strong>"{noteToDeleteTitle}"</strong>?
                        <br />
                        Esta ação não pode ser desfeita.
                    </>
                }
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </>
    );
}
