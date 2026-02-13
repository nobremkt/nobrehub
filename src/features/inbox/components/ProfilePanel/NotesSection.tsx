import React, { useState } from 'react';
import { Conversation } from '../../types';
import { Plus, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './ProfilePanel.module.css';

interface NotesSectionProps {
    conversation: Conversation;
    conversationId: string;
    onUpdateConversation: (id: string, data: Partial<Conversation>) => Promise<void>;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
    conversation,
    conversationId,
    onUpdateConversation,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [noteValue, setNoteValue] = useState('');

    return (
        <div className={styles.notesSection}>
            {isEditing ? (
                <>
                    <textarea
                        className={styles.noteTextarea}
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        placeholder="Digite sua nota aqui..."
                        autoFocus
                        rows={4}
                    />
                    <div className={styles.noteActions}>
                        <button
                            className={styles.noteCancelBtn}
                            onClick={() => {
                                setIsEditing(false);
                                setNoteValue(conversation?.notes || '');
                            }}
                        >
                            <X size={14} />
                            Cancelar
                        </button>
                        <button
                            className={styles.noteSaveBtn}
                            onClick={() => {
                                onUpdateConversation(conversationId, { notes: noteValue });
                                toast.success('Nota salva!');
                                setIsEditing(false);
                            }}
                        >
                            <Check size={14} />
                            Salvar
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {conversation.notes ? (
                        <p className={styles.notesText}>{conversation.notes}</p>
                    ) : (
                        <p className={styles.notesEmpty}>Nenhuma nota adicionada</p>
                    )}
                    <button
                        className={styles.addNoteButton}
                        onClick={() => {
                            setNoteValue(conversation.notes || '');
                            setIsEditing(true);
                        }}
                    >
                        <Plus size={14} />
                        {conversation.notes ? 'Editar nota' : 'Adicionar nota'}
                    </button>
                </>
            )}
        </div>
    );
};
