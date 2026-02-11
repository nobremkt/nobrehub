/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES REALTIME SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service para edição colaborativa em tempo real usando Supabase Realtime Broadcast.
 * 
 * Arquitetura:
 * - postgres_changes: sync de conteúdo entre janelas/tabs
 * - Supabase Realtime Broadcast: presença de editores ativos
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores';

// Types
export interface EditorPresence {
    userId: string;
    displayName: string;
    photoURL?: string;
    lastSeen: number;
    cursorPosition?: number;
}

export interface NoteRealtimeData {
    content: string;
    lastEditBy: string;
    lastEditAt: number;
}

const NOTES_PRESENCE_CHANNEL = 'notes-presence';

/**
 * NotesRealtimeService - Serviço para sincronização multiplayer via Supabase Realtime
 */
export const NotesRealtimeService = {
    /**
     * Subscribe ao conteúdo de uma nota em tempo real
     * Uses postgres_changes to watch the notes table
     */
    subscribeToContent(
        noteId: string,
        callback: (data: NoteRealtimeData | null) => void
    ): () => void {
        // Initial fetch
        supabase
            .from('notes')
            .select('content, created_by, updated_at')
            .eq('id', noteId)
            .single()
            .then(({ data }) => {
                if (data) {
                    callback({
                        content: data.content || '',
                        lastEditBy: data.created_by || '',
                        lastEditAt: new Date(data.updated_at).getTime(),
                    });
                } else {
                    callback(null);
                }
            });

        // Watch for changes
        const channel = supabase
            .channel(`note_content_${noteId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notes',
                filter: `id=eq.${noteId}`
            }, (payload) => {
                const row = payload.new as Record<string, unknown>;
                callback({
                    content: (row.content as string) || '',
                    lastEditBy: (row.created_by as string) || '',
                    lastEditAt: new Date((row.updated_at as string) || Date.now()).getTime(),
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Atualiza conteúdo da nota no Supabase
     */
    async updateContent(noteId: string, content: string): Promise<void> {
        const user = useAuthStore.getState().user;

        const { error } = await supabase
            .from('notes')
            .update({
                content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', noteId);

        if (error) throw error;

        // Also broadcast to presence channel that we edited
        const channel = supabase.channel(`${NOTES_PRESENCE_CHANNEL}_${noteId}`);
        channel.send({
            type: 'broadcast',
            event: 'content_update',
            payload: {
                noteId,
                userId: user?.id || 'anonymous',
                timestamp: Date.now(),
            }
        });
    },

    /**
     * Marca presença do editor na nota usando Supabase Realtime Presence
     */
    async joinAsEditor(noteId: string): Promise<() => void> {
        const user = useAuthStore.getState().user;
        if (!user) return () => { };

        const channel = supabase.channel(`${NOTES_PRESENCE_CHANNEL}_${noteId}`, {
            config: { presence: { key: user.id } }
        });

        channel.on('presence', { event: 'sync' }, () => {
            // Presence state synced
        });

        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    userId: user.id,
                    displayName: user.name || user.email || 'Anônimo',
                    photoURL: user.profilePhotoUrl || null,
                    lastSeen: Date.now(),
                });
            }
        });

        // Return cleanup function
        return () => {
            channel.untrack();
            supabase.removeChannel(channel);
        };
    },

    /**
     * Atualiza heartbeat de presença
     */
    async updatePresence(noteId: string): Promise<void> {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const channel = supabase.channel(`${NOTES_PRESENCE_CHANNEL}_${noteId}`);
        await channel.track({
            userId: user.id,
            displayName: user.name || user.email || 'Anônimo',
            lastSeen: Date.now(),
        });
    },

    /**
     * Subscribe aos editores ativos de uma nota
     */
    subscribeToEditors(
        noteId: string,
        callback: (editors: EditorPresence[]) => void
    ): () => void {
        const channel = supabase.channel(`${NOTES_PRESENCE_CHANNEL}_${noteId}`, {
            config: { presence: { key: useAuthStore.getState().user?.id || 'anon' } }
        });

        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const editors: EditorPresence[] = [];

            Object.values(state).forEach((presences: unknown) => {
                const presenceArray = presences as Array<{ userId: string; displayName: string; photoURL?: string; lastSeen: number }>;
                presenceArray.forEach(p => {
                    editors.push({
                        userId: p.userId,
                        displayName: p.displayName || 'Anônimo',
                        photoURL: p.photoURL,
                        lastSeen: p.lastSeen || Date.now(),
                    });
                });
            });

            // Filter inactive editors (more than 30 seconds without heartbeat)
            const activeEditors = editors.filter(
                e => Date.now() - e.lastSeen < 30000
            );

            callback(activeEditors);
        });

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Busca conteúdo atual (one-time read) — now from Supabase
     */
    async getContent(noteId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('notes')
            .select('content')
            .eq('id', noteId)
            .single();

        if (error) return null;
        return data?.content || '';
    },

    // Legacy compatibility stubs (no longer needed with unified Supabase)
    async initNoteContent(_noteId: string, _content: string = ''): Promise<void> {
        // No-op: content is now stored directly in notes table
    },

    async deleteNoteContent(_noteId: string): Promise<void> {
        // No-op: handled by notes table cascade
    },

    async noteExistsInRTDB(_noteId: string): Promise<boolean> {
        // Always exists in Supabase if note exists
        return true;
    },

    async migrateContentToRTDB(_noteId: string, _content: string): Promise<void> {
        // No-op: no RTDB migration needed
    },
};
