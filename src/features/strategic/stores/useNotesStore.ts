/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Zustand store para gerenciamento de estado das notas.
 * 
 * Arquitetura Multiplayer:
 * - Lista de notas: Firestore (onSnapshot)
 * - Conteúdo da nota: RTDB (onValue) - sync instantâneo
 * - Presença de editores: RTDB (onValue)
 * 
 * Fluxo de edição:
 * 1. Usuário digita → estado local atualiza imediatamente
 * 2. Debounce de 300ms → envia para RTDB
 * 3. RTDB propaga para todos os subscribers
 * 4. Outros usuários recebem update em tempo real
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { Note } from '../types';
import { NotesService } from '../services/NotesService';
import { NotesRealtimeService, EditorPresence, NoteRealtimeData } from '../services/NotesRealtimeService';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores';

interface NotesState {
    // Data
    notes: Note[];
    selectedNoteId: string | null;
    localContent: string;          // Conteúdo local (para UI instantânea)
    remoteContent: string;         // Conteúdo do servidor (para comparação)
    activeEditors: EditorPresence[]; // Editores ativos na nota atual
    lastRemoteEditBy: string;      // Quem fez a última edição remota

    // Status
    isLoading: boolean;
    isSaving: boolean;
    isConnected: boolean;
    searchQuery: string;

    // Subscriptions (internos)
    _unsubscribeNotes: () => void;
    _unsubscribeContent: () => void;
    _unsubscribeEditors: () => void;
    _leaveEditor: () => void;
    _saveTimeout: ReturnType<typeof setTimeout> | null;
    _presenceInterval: ReturnType<typeof setInterval> | null;
    _lastLocalEdit: number;

    // Actions
    init: () => void;
    cleanup: () => void;
    selectNote: (id: string | null) => void;
    createNote: () => Promise<void>;
    updateLocalContent: (content: string) => void;  // Atualiza localmente + debounce save
    updateNoteTitle: (title: string) => void;
    deleteNote: (id: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
}

const DEBOUNCE_MS = 300; // Reduzido para melhor responsividade
const PRESENCE_INTERVAL_MS = 10000; // Heartbeat a cada 10 segundos

export const useNotesStore = create<NotesState>((set, get) => ({
    // Initial state
    notes: [],
    selectedNoteId: null,
    localContent: '',
    remoteContent: '',
    activeEditors: [],
    lastRemoteEditBy: '',
    isLoading: false,
    isSaving: false,
    isConnected: true,
    searchQuery: '',

    // Internal subscriptions
    _unsubscribeNotes: () => { },
    _unsubscribeContent: () => { },
    _unsubscribeEditors: () => { },
    _leaveEditor: () => { },
    _saveTimeout: null,
    _presenceInterval: null,
    _lastLocalEdit: 0,

    /**
     * Inicializa o store - subscribe à lista de notas
     */
    init: () => {
        const { _unsubscribeNotes } = get();
        _unsubscribeNotes();

        set({ isLoading: true });

        const unsub = NotesService.subscribeToNotes((notes) => {
            set({ notes, isLoading: false, isConnected: true });
        });

        set({ _unsubscribeNotes: unsub });
    },

    /**
     * Cleanup completo - chamado ao desmontar
     */
    cleanup: () => {
        const {
            _unsubscribeNotes,
            _unsubscribeContent,
            _unsubscribeEditors,
            _leaveEditor,
            _saveTimeout,
            _presenceInterval
        } = get();

        _unsubscribeNotes();
        _unsubscribeContent();
        _unsubscribeEditors();
        _leaveEditor();

        if (_saveTimeout) clearTimeout(_saveTimeout);
        if (_presenceInterval) clearInterval(_presenceInterval);

        set({
            notes: [],
            selectedNoteId: null,
            localContent: '',
            remoteContent: '',
            activeEditors: [],
            _unsubscribeNotes: () => { },
            _unsubscribeContent: () => { },
            _unsubscribeEditors: () => { },
            _leaveEditor: () => { },
            _saveTimeout: null,
            _presenceInterval: null,
        });
    },

    /**
     * Seleciona uma nota e inicia subscriptions multiplayer
     */
    selectNote: async (id) => {
        const {
            _unsubscribeContent,
            _unsubscribeEditors,
            _leaveEditor,
            _saveTimeout,
            _presenceInterval,
            notes
        } = get();

        // Limpar subscriptions anteriores
        _unsubscribeContent();
        _unsubscribeEditors();
        _leaveEditor();
        if (_saveTimeout) clearTimeout(_saveTimeout);
        if (_presenceInterval) clearInterval(_presenceInterval);

        if (!id) {
            set({
                selectedNoteId: null,
                localContent: '',
                remoteContent: '',
                activeEditors: [],
                _unsubscribeContent: () => { },
                _unsubscribeEditors: () => { },
                _leaveEditor: () => { },
                _presenceInterval: null,
            });
            return;
        }

        // ✅ IMEDIATAMENTE setar o ID para feedback visual instantâneo
        // NÃO limpa o conteúdo - deixa o subscription atualizar
        // Isso evita flash de conteúdo vazio ao trocar rápido de nota
        set({
            selectedNoteId: id,
        });

        // Garantir que a nota existe no RTDB (em background, não bloqueia)
        const note = notes.find(n => n.id === id);
        if (note) {
            // Não await - deixa rodar em background
            NotesService.ensureNoteInRTDB(id, note.content || '').catch(console.error);
        }

        // 1. Subscribe ao conteúdo em tempo real (RTDB)
        // O subscription já vai fornecer o conteúdo inicial automaticamente
        const unsubContent = NotesRealtimeService.subscribeToContent(id, (data: NoteRealtimeData | null) => {
            if (!data) return;

            const { _lastLocalEdit, localContent, selectedNoteId: currentSelectedId } = get();

            // Ignorar updates se a nota mudou
            if (currentSelectedId !== id) return;

            const currentUser = useAuthStore.getState().user;
            const now = Date.now();

            // Só atualiza se:
            // - A edição não é local recente (evita loop)
            // - Ou é uma edição de outro usuário
            const isRemoteEdit = data.lastEditBy !== currentUser?.id;
            const isStaleLocalEdit = now - _lastLocalEdit > DEBOUNCE_MS + 200;

            if (isRemoteEdit || isStaleLocalEdit) {
                // Só atualiza se o conteúdo realmente mudou
                if (data.content !== localContent) {
                    set({
                        localContent: data.content,
                        remoteContent: data.content,
                        lastRemoteEditBy: data.lastEditBy,
                    });
                }
            }

            set({ remoteContent: data.content });
        });

        // 2. Subscribe aos editores ativos
        const unsubEditors = NotesRealtimeService.subscribeToEditors(id, (editors) => {
            const currentUser = useAuthStore.getState().user;
            // Filtra o próprio usuário da lista
            const otherEditors = editors.filter(e => e.oderId !== currentUser?.id);
            set({ activeEditors: otherEditors });
        });

        // 3. Marcar presença como editor (em background)
        // Não bloqueia - presença não é crítica para carregar a nota
        NotesRealtimeService.joinAsEditor(id).then(leave => {
            // Só atualiza se ainda estamos na mesma nota
            if (get().selectedNoteId === id) {
                set({ _leaveEditor: leave });
            } else {
                // Se mudou de nota, limpa a presença
                leave();
            }
        }).catch(console.error);

        // 4. Iniciar heartbeat de presença
        const presenceInt = setInterval(() => {
            NotesRealtimeService.updatePresence(id);
        }, PRESENCE_INTERVAL_MS);

        // Atualizar subscriptions no state
        set({
            _unsubscribeContent: unsubContent,
            _unsubscribeEditors: unsubEditors,
            _presenceInterval: presenceInt,
        });
    },

    /**
     * Cria uma nova nota
     */
    createNote: async () => {
        try {
            set({ isLoading: true });
            const noteId = await NotesService.createNote();
            await get().selectNote(noteId);
            toast.success('Anotação criada!');
        } catch (error) {
            console.error('Error creating note:', error);
            toast.error('Erro ao criar anotação');
        } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Atualiza conteúdo localmente + debounce para salvar
     * Esta é a função chamada pelo editor a cada keystroke
     */
    updateLocalContent: (content: string) => {
        const { selectedNoteId, _saveTimeout } = get();
        if (!selectedNoteId) return;

        // Limpar timeout anterior
        if (_saveTimeout) clearTimeout(_saveTimeout);

        // Atualizar estado local imediatamente (UI responsiva)
        set({
            localContent: content,
            _lastLocalEdit: Date.now(),
        });

        // Debounced save para RTDB
        const newTimeout = setTimeout(async () => {
            set({ isSaving: true });
            try {
                await NotesService.updateNoteContent(selectedNoteId, content);
            } catch (error) {
                console.error('Error saving note content:', error);
                set({ isConnected: false });
            } finally {
                set({ isSaving: false });
            }
        }, DEBOUNCE_MS);

        set({ _saveTimeout: newTimeout });
    },

    /**
     * Atualiza título da nota
     */
    updateNoteTitle: (title: string) => {
        const { selectedNoteId, _saveTimeout } = get();
        if (!selectedNoteId) return;

        // Atualizar na lista local imediatamente
        set(state => ({
            notes: state.notes.map(n =>
                n.id === selectedNoteId ? { ...n, title } : n
            ),
        }));

        // Limpar timeout anterior e criar novo
        if (_saveTimeout) clearTimeout(_saveTimeout);

        const newTimeout = setTimeout(async () => {
            set({ isSaving: true });
            try {
                await NotesService.updateNoteTitle(selectedNoteId, title);
            } catch (error) {
                console.error('Error saving note title:', error);
            } finally {
                set({ isSaving: false });
            }
        }, DEBOUNCE_MS);

        set({ _saveTimeout: newTimeout });
    },

    /**
     * Deleta uma nota
     */
    deleteNote: async (id: string) => {
        try {
            await NotesService.deleteNote(id);

            // Se a nota deletada era a selecionada, limpar seleção
            if (get().selectedNoteId === id) {
                get().selectNote(null);
            }

            toast.success('Anotação excluída');
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Erro ao excluir anotação');
        }
    },

    /**
     * Atualiza query de busca
     */
    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },
}));
