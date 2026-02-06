/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Zustand store para gerenciamento de estado das notas.
 * Inclui auto-save com debounce e sync em tempo real.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { Note } from '../types';
import { NotesService } from '../services/NotesService';
import { toast } from 'react-toastify';

interface NotesState {
    notes: Note[];
    selectedNoteId: string | null;
    selectedNoteContent: string; // Real-time synced content from server
    isLoading: boolean;
    isSaving: boolean;
    searchQuery: string;
    lastLocalUpdate: number; // Timestamp to detect local vs remote changes

    // Subscriptions
    unsubscribe: () => void;
    unsubscribeNote: () => void;

    // Debounce timer
    saveTimeout: ReturnType<typeof setTimeout> | null;

    // Actions
    init: () => void;
    cleanup: () => void;
    selectNote: (id: string | null) => void;
    createNote: () => Promise<void>;
    updateNoteContent: (content: string) => void;
    updateNoteTitle: (title: string) => void;
    deleteNote: (id: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
}

const DEBOUNCE_MS = 500;

export const useNotesStore = create<NotesState>((set, get) => ({
    notes: [],
    selectedNoteId: null,
    selectedNoteContent: '',
    isLoading: false,
    isSaving: false,
    searchQuery: '',
    lastLocalUpdate: 0,
    unsubscribe: () => { },
    unsubscribeNote: () => { },
    saveTimeout: null,

    init: () => {
        const { unsubscribe } = get();
        unsubscribe(); // Cleanup previous subscription

        set({ isLoading: true });

        const unsub = NotesService.subscribeToNotes((notes) => {
            set({ notes, isLoading: false });
        });

        set({ unsubscribe: unsub });
    },

    cleanup: () => {
        const { unsubscribe, unsubscribeNote, saveTimeout } = get();
        unsubscribe();
        unsubscribeNote();
        if (saveTimeout) clearTimeout(saveTimeout);
        set({
            notes: [],
            selectedNoteId: null,
            selectedNoteContent: '',
            unsubscribe: () => { },
            unsubscribeNote: () => { },
            saveTimeout: null
        });
    },

    selectNote: (id) => {
        const { unsubscribeNote: prevUnsub } = get();
        prevUnsub(); // Cleanup previous note subscription

        if (!id) {
            set({
                selectedNoteId: null,
                selectedNoteContent: '',
                unsubscribeNote: () => { }
            });
            return;
        }

        // Subscribe to real-time updates for this specific note
        const unsub = NotesService.subscribeToNote(id, (note) => {
            const { lastLocalUpdate, isSaving } = get();
            const now = Date.now();

            // Only update content if it's not a local change (within debounce window)
            // This prevents overwriting while user is typing
            if (note && (now - lastLocalUpdate > DEBOUNCE_MS + 100) && !isSaving) {
                set({ selectedNoteContent: note.content });
            }
        });

        set({
            selectedNoteId: id,
            unsubscribeNote: unsub
        });
    },

    createNote: async () => {
        try {
            const noteId = await NotesService.createNote();
            get().selectNote(noteId);
            toast.success('Anotação criada!');
        } catch (error) {
            console.error('Error creating note:', error);
            toast.error('Erro ao criar anotação');
        }
    },

    updateNoteContent: (content: string) => {
        const { selectedNoteId, saveTimeout } = get();
        if (!selectedNoteId) return;

        // Clear previous timeout
        if (saveTimeout) clearTimeout(saveTimeout);

        // Mark this as a local update
        set({ lastLocalUpdate: Date.now() });

        // Debounced save
        const newTimeout = setTimeout(async () => {
            set({ isSaving: true });
            try {
                await NotesService.updateNote(selectedNoteId, { content });
            } catch (error) {
                console.error('Error saving note content:', error);
            } finally {
                set({ isSaving: false });
            }
        }, DEBOUNCE_MS);

        set({ saveTimeout: newTimeout });
    },

    updateNoteTitle: (title: string) => {
        const { selectedNoteId, saveTimeout } = get();
        if (!selectedNoteId) return;

        // Clear previous timeout
        if (saveTimeout) clearTimeout(saveTimeout);

        // Debounced save
        const newTimeout = setTimeout(async () => {
            set({ isSaving: true });
            try {
                await NotesService.updateNote(selectedNoteId, { title });
            } catch (error) {
                console.error('Error saving note title:', error);
            } finally {
                set({ isSaving: false });
            }
        }, DEBOUNCE_MS);

        set({ saveTimeout: newTimeout });
    },

    deleteNote: async (id: string) => {
        try {
            await NotesService.deleteNote(id);

            // If deleted note was selected, clear selection
            if (get().selectedNoteId === id) {
                get().selectNote(null);
            }

            toast.success('Anotação excluída');
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Erro ao excluir anotação');
        }
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },
}));
