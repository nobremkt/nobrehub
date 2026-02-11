/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service para gerenciamento de notas.
 * 
 * Arquitetura Supabase:
 * - Tabela `notes`: metadados + conteúdo
 * - Supabase Realtime Broadcast: edição multiplayer
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores';
import { Note } from '../types';

// ─── Row mapper ──────────────────────────────────────────────────────────────

function mapRowToNote(row: Record<string, unknown>): Note {
    return {
        id: row.id as string,
        title: (row.title as string) || 'Sem título',
        content: (row.content as string) || '',
        createdAt: new Date((row.created_at as string) || Date.now()),
        updatedAt: new Date((row.updated_at as string) || Date.now()),
        createdBy: (row.created_by as string) || '',
    };
}

export const NotesService = {
    /**
     * Subscribe to real-time notes list updates
     */
    subscribeToNotes(callback: (notes: Note[]) => void): () => void {
        const fetchNotes = async () => {
            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select('*')
                    .order('updated_at', { ascending: false });

                if (error) throw error;
                callback((data || []).map(mapRowToNote));
            } catch (error) {
                console.error('Error fetching notes:', error);
                callback([]);
            }
        };

        // Initial fetch
        fetchNotes();

        // Realtime
        const channel = supabase
            .channel('notes_list_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notes'
            }, () => {
                fetchNotes();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Create a new note
     */
    async createNote(title: string = 'Nova Anotação'): Promise<string> {
        const user = useAuthStore.getState().user;
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('notes')
            .insert({
                title,
                content: '',
                created_by: user?.id || 'anonymous',
                created_at: now,
                updated_at: now,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Update note title
     */
    async updateNoteTitle(noteId: string, title: string): Promise<void> {
        const { error } = await supabase
            .from('notes')
            .update({
                title,
                updated_at: new Date().toISOString(),
            })
            .eq('id', noteId);

        if (error) throw error;
    },

    /**
     * Update note content
     */
    async updateNoteContent(noteId: string, content: string): Promise<void> {
        const { error } = await supabase
            .from('notes')
            .update({
                content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', noteId);

        if (error) throw error;
    },

    /**
     * Delete note
     */
    async deleteNote(noteId: string): Promise<void> {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) throw error;
    },

    /**
     * Get a single note's content (one-time read)
     */
    async getNoteContent(noteId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('notes')
            .select('content')
            .eq('id', noteId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data.content || '';
    },
};
